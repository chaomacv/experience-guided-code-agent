import json
from pathlib import Path
from typing import Dict

from experience_guided_code_agent.agent.trace import RunTrace
from experience_guided_code_agent.rag.prompt_builder import build_prompt
from experience_guided_code_agent.utils.jsonio import write_json


def _rollback(adapter) -> Dict[str, object]:
    """Record rollback failures so a failed restore never looks successful."""
    try:
        return adapter.rollback()
    except Exception as exc:
        return {"restored": False, "error": str(exc)}


def run_agent(task, retriever, planner, adapter, run_dir: Path,
              repository_facts="", skill="", top_k=5, module=None, max_attempts=3) -> Dict[str, object]:
    """Retrieve, plan, execute, validate, and retry or roll back using actual outcomes."""
    if max_attempts < 1:
        raise ValueError("max_attempts must be at least 1.")
    trace = RunTrace(run_dir)
    with trace.span("checkpoint"):
        adapter.checkpoint()
    def traced_rollback():
        with trace.span("rollback"):
            return _rollback(adapter)
    attempts = []
    query = task
    last_error = ""
    try:
        for number in range(1, max_attempts + 1):
            attempt_dir = run_dir / "attempts" / f"{number:02d}"
            attempt_dir.mkdir(parents=True, exist_ok=True)
            with trace.span("retrieval", number):
                results = retriever.search(query, top_k=top_k, module=module)
            facts = repository_facts + "\n\n" + adapter.facts()
            if last_error:
                facts += "\n\nPREVIOUS VALIDATION / EXECUTION FAILURE:\n" + last_error
            facts += "\n\nALGORITHM REPLACEMENT SKILL:\n" + skill
            write_json(attempt_dir / "retrieval.json", [item.model_dump() for item in results])
            write_json(attempt_dir / "query.json", {"query": query})
            (attempt_dir / "prompt.md").write_text(build_prompt(task, results, facts), encoding="utf-8")
            try:
                with trace.span("planning", number):
                    try:
                        plan = planner.plan(task, results, facts)
                    finally:
                        if getattr(planner, 'last_exchange', None):
                            write_json(attempt_dir / 'model_exchange.json', planner.last_exchange)
                write_json(attempt_dir / "plan.json", plan)
                with trace.span("execution", number):
                    execution = adapter.execute(plan)
                write_json(attempt_dir / "execution.json", execution)
                with trace.span("validation", number):
                    validation = adapter.validate()
            except Exception as exc:
                validation = {"passed": False, "error": str(exc), "stage": "planning_or_execution"}
            write_json(attempt_dir / "validation.json", validation)
            attempts.append({"attempt": number, "passed": validation.get("passed") is True,
                             "retrieved_cases": list(dict.fromkeys(item.case_id for item in results))})
            if validation.get("passed") is True:
                report = {"status": "success", "attempts": attempts, "rollback": None}
                if hasattr(adapter, 'deliver'):
                    report['delivery'] = adapter.deliver(run_dir / 'delivery')
                report["telemetry"] = trace.summary()
                write_json(run_dir / "final_report.json", report)
                return report
            last_error = json.dumps(validation, ensure_ascii=False)
            analysis = {"failure": validation, "next_action": "retry" if number < max_attempts else "rollback"}
            write_json(attempt_dir / "error_analysis.json", analysis)
            # Error evidence is embedded and searched again; no fixed repair is injected.
            query = task + "\nValidation failure:\n" + last_error
    except (Exception, KeyboardInterrupt) as exc:
        report = {"status": "failed", "attempts": attempts, "error": str(exc) or type(exc).__name__,
                  "rollback": traced_rollback()}
        report["telemetry"] = trace.summary()
        write_json(run_dir / "final_report.json", report)
        raise
    rollback = traced_rollback()
    report = {"status": "rolled_back" if rollback.get("restored") is True else "rollback_failed",
              "attempts": attempts, "rollback": rollback}
    report["telemetry"] = trace.summary()
    write_json(run_dir / "final_report.json", report)
    return report
