"""Explicit scripted mechanics demo; not a live LLM evaluation."""
import json
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from algo_rag_demo.agent.executor import FileProjectAdapter
from algo_rag_demo.agent.workflow import run_agent
from algo_rag_demo.rag.index_builder import build_index_from_cases
from algo_rag_demo.rag.retriever import Retriever
from algo_rag_demo.reporting import render_run
from algo_rag_demo.utils.jsonio import read_json, write_json


class ScriptedPlanner:
    def __init__(self, original, repair=True):
        self.original, self.calls, self.repair = original, 0, repair

    def plan(self, task, results, repository_facts=""):
        self.calls += 1
        actions = [{"tool":"write_file", "path":"config.json",
                    "content":json.dumps({"algorithm":"NeuralScorer"})}]
        if self.calls > 1 and self.repair:
            fixed = self.original.replace("rows = neural_scorer(items)",
                'rows = [{"id": row["id"], "score": row["value"], '
                '"metadata": {"confidence": row["confidence"], "reason": row["explanation"]}} '
                'for row in neural_scorer(items)]')
            actions.append({"tool":"write_file", "path":"ranking.py", "content":fixed})
        return {"actions":actions, "plan":["Apply scripted demonstration action"],
                "retrieved_experience_used":[r.chunk_id for r in results]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("output", nargs="?", default="outputs/offline-demo")
    parser.add_argument("--scenario", choices=["repair", "rollback"], default="repair")
    args = parser.parse_args()
    root = Path(args.output)
    if root.exists():
        raise ValueError("Choose a new output directory for each demo.")
    root.mkdir(parents=True)
    write_json(root / "demo_metadata.json", {
        "planner":"scripted", "embedding":"mock", "live_llm":False,
        "note":"Predetermined failure/repair demonstrates workflow mechanics. Validation subprocesses and file edits are real; this does not measure LLM task success."})
    build_index_from_cases("mock", case_dir=Path("benchmarks/cases"),
                           knowledge_dir=root / "knowledge", index_dir=root / "index")
    adapter = FileProjectAdapter(read_json(Path("configs/deepseek_bge_m3.json"))["execution"], root)
    planner = ScriptedPlanner((adapter.workspace / "ranking.py").read_text(encoding="utf-8"), args.scenario == "repair")
    retriever = Retriever(root / "index", "mock", case_dir=Path("benchmarks/cases"),
                          mode="hybrid", max_per_case=1)
    report = run_agent("Replace LegacyRanker with NeuralScorer while preserving metadata.reason and fallback.",
                       retriever, planner, adapter, root, top_k=5, max_attempts=2)
    render_run(root, root / "report.html")
    print(json.dumps(report, indent=2))
    if report["status"] != ("success" if args.scenario == "repair" else "rolled_back"):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
