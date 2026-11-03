"""Render an existing run as a self-contained, escaped HTML evidence report."""
import argparse
import json
from html import escape
from pathlib import Path

from algo_rag_demo.utils.jsonio import read_json


def render_run(run_dir, output):
    run_dir, output = Path(run_dir), Path(output)
    report = read_json(run_dir / "final_report.json")
    def block(title, value):
        return "<details><summary>"+escape(title)+"</summary><pre>"+escape(
            json.dumps(value, indent=2, ensure_ascii=False))+"</pre></details>"
    sections = []
    for attempt in report.get("attempts", []):
        number = attempt["attempt"]
        if type(number) is not int or number < 1:
            raise ValueError("Attempt number must be a positive integer.")
        folder = run_dir / "attempts" / f"{number:02d}"
        contents = []
        for name in ["query", "retrieval", "plan", "execution", "validation", "error_analysis"]:
            file = folder / (name+".json")
            if file.exists():
                contents.append(block(name, read_json(file)))
        sections.append("<section><h2>Attempt "+str(number)+" · "+
                        ("PASS" if attempt["passed"] else "FAIL")+"</h2>"+"".join(contents)+"</section>")
    html = """<!doctype html><html lang="zh-CN"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>RAG Planning · Run evidence</title>
<style>body{font:16px/1.6 system-ui;margin:0;background:#f5f4ef;color:#202c2a}main{max-width:1050px;margin:auto;padding:50px 24px}h1{font-size:38px}section{background:white;padding:24px;border:1px solid #d9ddd7;border-radius:16px;margin:24px 0}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.7 monospace;background:#eef2ec;padding:20px}summary{cursor:pointer;padding:14px;border-bottom:1px solid #ddd}small{color:#61736b}</style><main>
<small>RAG PLANNING LAB / EXECUTION EVIDENCE</small><h1>从计划到验证，每一步都有依据。</h1>"""
    html += "<p>最终状态："+escape(str(report["status"]))+"</p>"
    metadata = run_dir / "demo_metadata.json"
    if metadata.exists():
        html += block("演示来源与限制", read_json(metadata))
    html += block("Final report", report)+"".join(sections)+"</main></html>"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(html, encoding="utf-8")
    return output


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run-dir", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    print(render_run(args.run_dir, args.output))
