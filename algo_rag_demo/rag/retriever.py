from pathlib import Path
from typing import List, Optional

import numpy as np

from algo_rag_demo.config import CASE_DIR, INDEX_DIR
from algo_rag_demo.rag.embedding import get_embedding_provider
from algo_rag_demo.rag.lexical import BM25Index, reciprocal_rank_fusion
from algo_rag_demo.rag.models import RetrievalResult
from algo_rag_demo.utils.jsonio import read_json


class Retriever:
    def __init__(self, index_dir: Path = INDEX_DIR, provider_name: str = "mock",
                 embedding_model: str = None, case_dir: Path = CASE_DIR,
                 mode="dense", candidate_k=50, rrf_constant=60, max_per_case=None):
        if mode not in {"dense", "bm25", "hybrid"}:
            raise ValueError("Retrieval mode must be dense, bm25 or hybrid.")
        if candidate_k < 1 or rrf_constant < 1 or (max_per_case is not None and max_per_case < 1):
            raise ValueError("Candidate count, RRF constant and max_per_case must be positive.")
        self.index_dir, self.case_dir = Path(index_dir), Path(case_dir)
        self.mode, self.candidate_k = mode, candidate_k
        self.rrf_constant, self.max_per_case = rrf_constant, max_per_case
        self.metadata = read_json(self.index_dir / "metadata.json")
        expected_model = embedding_model or ("BAAI/bge-m3" if provider_name == "bge-m3" else None)
        saved = self.metadata["_provider"]
        if saved.get("name") != provider_name or saved.get("model") != expected_model:
            raise ValueError("Embedding provider/model differs from this index; rebuild the index first.")
        self.rows = sorted(int(key) for key in self.metadata if not key.startswith("_"))
        self.lexical = BM25Index([self.metadata[str(idx)]["text"] for idx in self.rows]) if mode != "dense" else None
        self.provider = get_embedding_provider(provider_name, model_name=embedding_model) if mode != "bm25" else None
        self.index = self._load_index() if mode != "bm25" else None

    def _load_index(self):
        path = self.index_dir / "cases.index"
        if self.metadata.get("_format") == "numpy":
            with path.open("rb") as handle:
                return np.load(handle, allow_pickle=False)
        if self.metadata.get("_format") == "faiss":
            import faiss
            return faiss.read_index(str(path))
        raise ValueError("Legacy or unknown index format; rebuild the index first.")

    def _dense_scores(self, query):
        vector = self.provider.encode_query(query).reshape(1, -1).astype("float32")
        if vector.shape[1] != self.metadata["_provider"]["dimension"] or not np.isfinite(vector).all():
            raise ValueError("Query embedding dimension or values do not match the index.")
        if hasattr(self.index, "search"):
            # Exact scan preserves filtering semantics for this reference corpus.
            scores, ids = self.index.search(vector, self.index.ntotal)
            return {int(idx): float(score) for idx, score in zip(ids[0], scores[0]) if idx >= 0}
        return {idx: float(score) for idx, score in enumerate(np.dot(self.index, vector[0]))}

    def search(self, query: str, top_k: int = 5, module: Optional[str] = None,
               prefer_success: bool = True) -> List[RetrievalResult]:
        if top_k < 1:
            raise ValueError("top_k must be positive.")
        if not query.strip():
            raise ValueError("Query must not be empty.")
        eligible = {idx for idx in self.rows if not module or
                    self.metadata[str(idx)]["module"].lower() == module.lower()}
        dense = self._dense_scores(query) if self.mode != "bm25" else {}
        lexical = {self.rows[idx]: score for idx, score in self.lexical.scores(query).items()} if self.lexical else {}
        dense, lexical = ({idx: score for idx, score in channel.items() if idx in eligible}
                          for channel in (dense, lexical))
        def ranked(channel):
            return sorted(channel, key=lambda idx: (-channel[idx], self.metadata[str(idx)]["chunk_id"]))
        dense_order, lexical_order = ranked(dense), ranked(lexical)
        if self.mode == "hybrid":
            limit = max(top_k, self.candidate_k)
            dense_order, lexical_order = dense_order[:limit], lexical_order[:limit]
            scores = reciprocal_rank_fusion([dense_order, lexical_order], self.rrf_constant)
        else:
            scores = dict(dense if self.mode == "dense" else lexical)
        # Keep upstream's cosine-scale prior only in dense mode. Failure cases
        # remain available as repair evidence; RRF scores get no arbitrary bonus.
        if prefer_success and self.mode == "dense":
            scores = {idx: score + (0.01 if self.metadata[str(idx)]["final_status"] == "success" else 0)
                      for idx, score in scores.items()}
        dense_ranks = {idx: rank for rank, idx in enumerate(dense_order, 1)}
        lexical_ranks = {idx: rank for rank, idx in enumerate(lexical_order, 1)}
        counts, results = {}, []
        for idx in ranked(scores):
            meta = self.metadata[str(idx)]
            case_id = meta["case_id"]
            if self.max_per_case and counts.get(case_id, 0) >= self.max_per_case:
                continue
            counts[case_id] = counts.get(case_id, 0) + 1
            results.append(RetrievalResult(
                **meta, score=scores[idx], case_path=str(self.case_dir / f"{case_id}.json"),
                dense_score=dense.get(idx), lexical_score=lexical.get(idx),
                dense_rank=dense_ranks.get(idx), lexical_rank=lexical_ranks.get(idx),
                retrieval_mode=self.mode,
            ))
            if len(results) == top_k:
                break
        return results


