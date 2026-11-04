import json
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import numpy as np
import pytest

from experience_guided_code_agent.agent.trace import RunTrace
from experience_guided_code_agent.case_pipeline.schema import KnowledgeChunk
from experience_guided_code_agent.evaluation import evaluate, ranking_metrics
from experience_guided_code_agent.rag.index_builder import save_index
from experience_guided_code_agent.rag.lexical import BM25Index, tokenize, reciprocal_rank_fusion
from experience_guided_code_agent.rag.retriever import Retriever


def make_index(tmp_path):
    chunks = [
        KnowledgeChunk(case_id=case, chunk_id=case+str(i), chunk_type="solution",
                       text=text, module=module, final_status="partial", source="synthetic")
        for i, (case, text, module) in enumerate([
            ("CASE_A", "general ranking migration", "Ranking"),
            ("CASE_A", "ranking interface contract", "Ranking"),
            ("CASE_B", "metadata.reason missing KeyError", "Ranking"),
            ("CASE_C", "metadata.reason embedding", "Other"),
        ])
    ]
    save_index(np.array([[1, 0], [.99, .1], [.2, .98], [.9, .4]], dtype="float32"),
               chunks, "mock", tmp_path)


def test_bm25_identifiers_chinese_and_no_match():
    index = BM25Index(["无关文档", "保留回滚 metadata.reason", "保留回滚接口"])
    assert max(index.scores("metadata.reason"), key=index.scores("metadata.reason").get) == 1
    assert 1 in index.scores("回滚")
    assert index.scores("unfindable") == {}
    assert "neuralscorer" in tokenize("NeuralScorer")


def test_rrf_rewards_agreement_without_double_counting_one_channel():
    result = reciprocal_rank_fusion([[1, 2, 2], [2, 3]])
    assert result[2] > result[1]
    assert result[2] == pytest.approx(1/62 + 1/61)


def test_lexical_mode_does_not_initialize_model(tmp_path):
    make_index(tmp_path)
    with patch("experience_guided_code_agent.rag.retriever.get_embedding_provider", side_effect=AssertionError):
        r = Retriever(tmp_path, "mock", mode="bm25")
        assert r.search("KeyError", module="Ranking")[0].case_id == "CASE_B"
        assert r.search("unfindable") == []


def test_hybrid_recovers_identifier_and_diversifies_before_truncation(tmp_path):
    make_index(tmp_path)
    r = Retriever(tmp_path, "mock", mode="hybrid", max_per_case=1)
    r.provider = SimpleNamespace(encode_query=lambda text: np.array([1, 0], dtype="float32"))
    results = r.search("metadata.reason KeyError", top_k=3, module="ranking", prefer_success=False)
    assert {x.case_id for x in results} == {"CASE_A", "CASE_B"}
    target = next(x for x in results if x.case_id == "CASE_B")
    assert target.lexical_rank == 1
    assert target.dense_score is not None and target.lexical_score > 0


def test_metrics_do_not_count_duplicate_case_twice():
    m = ranking_metrics(["A", "A", "B"], {"A": 3, "B": 2}, 3)
    assert m["recall@3"] == 1
    assert m["mrr@3"] == 1
    assert 0 < m["ndcg@3"] < 1
    assert ranking_metrics(["X"], {"A": 3}, 5)["mrr@5"] == 0


def test_missing_relevant_case_is_rejected_before_indexing(tmp_path):
    queries = tmp_path / "queries.jsonl"
    queries.write_text(json.dumps({"id":"q", "query":"q", "relevance":{"CASE_UNKNOWN":3}}), encoding="utf-8")
    with pytest.raises(ValueError, match="unknown relevance"):
        evaluate("benchmarks/cases", queries, tmp_path / "out", "mock")


def test_trace_records_exception_and_refuses_to_mix_runs(tmp_path):
    trace = RunTrace(tmp_path)
    with pytest.raises(RuntimeError):
        with trace.span("planning", 2):
            raise RuntimeError("example")
    event = json.loads((tmp_path / "events.jsonl").read_text())
    assert event["status"] == "error" and event["attempt"] == 2 and event["duration_ms"] >= 0
    assert trace.summary()["event_count"] == 1
    with pytest.raises(ValueError, match="new run"):
        RunTrace(tmp_path)


def test_benchmark_is_schema_valid_and_labels_resolve():
    from experience_guided_code_agent.rag.index_builder import load_cases
    cases = load_cases(Path("benchmarks/cases"))
    ids = {c.case_id for c in cases}
    queries = [json.loads(line) for line in Path("benchmarks/queries.jsonl").read_text(encoding="utf-8").splitlines()]
    assert len(cases) == 20 and len(queries) == 30
    assert all(set(q["relevance"]) <= ids for q in queries)
