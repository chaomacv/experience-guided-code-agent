"""Reproducible retrieval ablations; never calls a planning LLM."""
import argparse
import hashlib
import json
import math
import platform
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np

from algo_rag_demo.rag.index_builder import build_index_from_cases, load_cases
from algo_rag_demo.rag.retriever import Retriever
from algo_rag_demo.utils.jsonio import read_json, write_json


def ranking_metrics(case_ids, relevance, k):
    """Top-k context slots; duplicate cases earn no extra gain or recall."""
    seen, gains, reciprocal = set(), [], 0.0
    for rank, case_id in enumerate(case_ids[:k], 1):
        grade = relevance.get(case_id, 0) if case_id not in seen else 0
        seen.add(case_id)
        gains.append((2**grade - 1) / math.log2(rank+1))
        if grade > 0 and not reciprocal:
            reciprocal = 1.0 / rank
    relevant = {key for key, grade in relevance.items() if grade > 0}
    ideal = sorted((grade for grade in relevance.values() if grade > 0), reverse=True)[:k]
    idcg = sum((2**grade - 1) / math.log2(rank+1) for rank, grade in enumerate(ideal, 1))
    return {
        f"recall@{k}": len(seen & relevant) / len(relevant) if relevant else 0.0,
        f"mrr@{k}": reciprocal,
        f"ndcg@{k}": sum(gains) / idcg if idcg else 0.0,
        "unique_cases": len(set(case_ids[:k])),
    }


def fingerprint(case_dir, query_file):
    digest = hashlib.sha256()
    for path in [*sorted(Path(case_dir).glob("CASE_*.json")), Path(query_file)]:
        digest.update(path.name.encode("utf-8"))
        digest.update(path.read_bytes())
    return digest.hexdigest()


def evaluate(case_dir, query_file, output_dir, provider="bge-m3", model=None, k=5):
    if k < 1:
        raise ValueError("k must be positive.")
    case_dir, query_file, output_dir = map(Path, [case_dir, query_file, output_dir])
    cases = load_cases(case_dir)
    ids = {case.case_id for case in cases}
    queries = [json.loads(line) for line in query_file.read_text(encoding="utf-8").splitlines() if line.strip()]
    if not queries or len({q["id"] for q in queries}) != len(queries):
        raise ValueError("Queries must be nonempty with unique ids.")
    for query in queries:
        if not query["query"].strip() or not query["relevance"] or not set(query["relevance"]) <= ids:
            raise ValueError(f"Invalid query or unknown relevance case: {query['id']}")
        if any(type(grade) is not int or grade not in {1, 2, 3} for grade in query["relevance"].values()):
            raise ValueError("Relevance grades must be integers from 1 to 3.")
    index_dir = output_dir / "index"
    started = time.perf_counter()
    _, chunk_count, dimension = build_index_from_cases(
        provider, model, case_dir, output_dir / "knowledge", index_dir)
    index_ms = (time.perf_counter() - started) * 1000
    variants = [("dense", "dense", None), ("bm25", "bm25", None),
                ("hybrid", "hybrid", None), ("hybrid_diverse", "hybrid", 1)]
    summaries, details = {}, {}
    for name, mode, diversity in variants:
        retriever = Retriever(index_dir, provider, model, case_dir,
                              mode=mode, candidate_k=50, max_per_case=diversity)
        retriever.search(queries[0]["query"], top_k=k, prefer_success=False)  # warmup
        rows = []
        for query in queries:
            started = time.perf_counter()
            results = retriever.search(query["query"], top_k=k, prefer_success=False)
            latency = (time.perf_counter()-started)*1000
            metrics = ranking_metrics([r.case_id for r in results], query["relevance"], k)
            rows.append(dict(query, metrics=metrics, latency_ms=latency,
                             results=[r.model_dump() for r in results]))
        aggregate = {key: float(np.mean([row["metrics"][key] for row in rows])) for key in rows[0]["metrics"]}
        aggregate["p50_ms"] = float(np.percentile([row["latency_ms"] for row in rows], 50))
        aggregate["p95_ms"] = float(np.percentile([row["latency_ms"] for row in rows], 95))
        summaries[name], details[name] = aggregate, rows
    report = {
        "schema_version": 1, "created_at": datetime.now(timezone.utc).isoformat(),
        "dataset": {"cases": len(cases), "chunks": chunk_count, "queries": len(queries),
                    "sha256": fingerprint(case_dir, query_file),
                    "provenance": "Hand-authored synthetic engineering cases and relevance labels; development set, not an independent test."},
        "embedding": {"provider": provider, "model": model, "dimension": dimension},
        "settings": {"k": k, "candidate_k": 50, "rrf_constant": 60, "success_prior": False,
                     "metric_unit": "Top-k chunk context slots; each relevant case receives gain once."},
        "environment": {"python": platform.python_version(), "platform": platform.platform()},
        "index_build_ms": index_ms, "summary": summaries, "queries": details,
        "limitations": ["Retrieval metrics do not measure Agent task success.",
                       "Latency is a single sequential warm run, not a load test.",
                       "Queries and labels are curated together with the corpus; no generalization claim."],
    }
    if provider == "mock":
        report["limitations"].insert(0, "Mock embeddings verify the evaluation path only; not semantic model quality.")
    write_json(output_dir / "report.json", report)
    lines = ["# Retrieval ablation", "", f"Cases: {len(cases)} · chunks: {chunk_count} · queries: {len(queries)}",
             "", f"Provider: {provider} · model: {model} · K: {k}", "",
             f"| Variant | Recall@{k} | MRR@{k} | nDCG@{k} | Unique cases | P95 ms |",
             "| --- | ---: | ---: | ---: | ---: | ---: |"]
    for name, row in summaries.items():
        lines.append(f"| {name} | {row[f'recall@{k}']:.4f} | {row[f'mrr@{k}']:.4f} | {row[f'ndcg@{k}']:.4f} | {row['unique_cases']:.2f} | {row['p95_ms']:.2f} |")
    lines.extend(["", "## Scope", "", *["- "+text for text in report["limitations"]], "",
                  "Dataset SHA256: "+report["dataset"]["sha256"]])
    (output_dir / "report.md").write_text("\n".join(lines)+"\n", encoding="utf-8")
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--case-dir", default="benchmarks/cases")
    parser.add_argument("--queries", default="benchmarks/queries.jsonl")
    parser.add_argument("--output-dir", default="outputs/evaluation")
    parser.add_argument("--provider", choices=["mock", "bge-m3"], default="bge-m3")
    parser.add_argument("--model", default="BAAI/bge-m3")
    parser.add_argument("--k", type=int, default=5)
    args = parser.parse_args()
    report = evaluate(args.case_dir, args.queries, args.output_dir, args.provider,
                      None if args.provider == "mock" else args.model, args.k)
    print(json.dumps(report["summary"], indent=2))


if __name__ == "__main__":
    main()
