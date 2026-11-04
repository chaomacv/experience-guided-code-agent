from pathlib import Path

from experience_guided_code_agent.case_pipeline.chunker import chunk_case
from experience_guided_code_agent.case_pipeline.schema import EngineeringCase
from experience_guided_code_agent.utils.jsonio import read_json


def test_case_generates_required_chunks():
    """Verify one case produces task, constraint, and solution chunks."""
    # These chunk types are the schema-aligned retrieval views.
    case = EngineeringCase(**read_json(Path("tests/fixtures/custom_data/cases/CASE_CUSTOM_001.json")))
    chunks = chunk_case(case)
    types = {chunk.chunk_type for chunk in chunks}
    assert {"task", "constraint", "solution"}.issubset(types)
    assert all(chunk.chunk_id and chunk.case_id for chunk in chunks)

