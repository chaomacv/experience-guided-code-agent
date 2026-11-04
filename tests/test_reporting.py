from experience_guided_code_agent.reporting import render_run
from experience_guided_code_agent.utils.jsonio import write_json


def test_report_escapes_untrusted_model_or_tool_output(tmp_path):
    run = tmp_path / "run"
    write_json(run / "final_report.json", {"status":"success", "attempts":[{"attempt":1,"passed":True}]})
    write_json(run / "attempts/01/plan.json", {"text":"<script>alert('x')</script>"})
    output = render_run(run, tmp_path / "report.html").read_text(encoding="utf-8")
    assert "<script>" not in output and "&lt;script&gt;" in output
