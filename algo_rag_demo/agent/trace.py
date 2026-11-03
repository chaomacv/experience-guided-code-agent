"""Append-only stage timing without recording prompts, file contents or secrets."""
import json
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path


class RunTrace:
    def __init__(self, run_dir):
        self.path = Path(run_dir) / "events.jsonl"
        self.path.parent.mkdir(parents=True, exist_ok=True)
        if self.path.exists():
            raise ValueError("Run directory already contains a trace; choose a new run directory.")
        self.started = time.perf_counter()
        self.events = []

    @contextmanager
    def span(self, stage, attempt=0):
        started = time.perf_counter()
        event = {"stage": stage, "attempt": attempt, "status": "ok",
                 "started_at": datetime.now(timezone.utc).isoformat()}
        try:
            yield
        except BaseException as exc:
            event.update(status="error", error_type=type(exc).__name__)
            raise
        finally:
            event["duration_ms"] = (time.perf_counter()-started)*1000
            self.events.append(event)
            with self.path.open("a", encoding="utf-8") as handle:
                handle.write(json.dumps(event, ensure_ascii=False)+"\n")

    def summary(self):
        stages = {}
        for event in self.events:
            stages[event["stage"]] = stages.get(event["stage"], 0.0) + event["duration_ms"]
        return {"elapsed_ms": (time.perf_counter()-self.started)*1000,
                "stage_ms": stages, "event_count": len(self.events)}
