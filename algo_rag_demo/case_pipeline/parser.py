import json
from pathlib import Path

from algo_rag_demo.agent.llm_provider import ChatProvider
from algo_rag_demo.case_pipeline.schema import Conversation, EngineeringCase, model_to_dict
from algo_rag_demo.utils.jsonio import parse_json_object, read_json, write_json


class LLMCaseExtractor:
    """Extract a reusable EngineeringCase from a historical conversation."""

    system_prompt = """You extract reusable engineering experience from historical conversations.
Return exactly one JSON object matching this schema:
{
  "case_id": "CASE_*",
  "module": "short module or component name",
  "task": "short task summary",
  "old_algorithm": "string or null",
  "new_algorithm": "string or null",
  "constraints": {"category": ["constraint"]},
  "steps": ["step"],
  "problems": [{"stage": "stage", "symptom": "symptom", "root_cause": "root cause"}],
  "solutions": [{"problem": "problem", "solution": "solution"}],
  "validation": {"check": "passed|failed|not_run"},
  "final_status": "success|failed|partial",
  "reusable_experience": ["lesson"],
  "source_conversation_id": "conversation id"
}
Keep only reusable, sanitized engineering knowledge. Do not include secrets, private paths, customer data, or raw internal logs.
Preserve the scope of evidence: user-reported tests are reported outcomes, not independently verified executions.
If provenance marks an authored/synthetic dialogue, do not portray it as a real customer incident or verified production result."""

    def __init__(self, provider: ChatProvider) -> None:
        """Store the LLM provider used for schema-driven extraction."""
        self.provider = provider

    def extract(self, conversation: Conversation) -> EngineeringCase:
        """Ask the LLM to turn one conversation into an EngineeringCase."""
        user_prompt = (
            "Extract a structured EngineeringCase from this conversation JSON. "
            "Focus on reusable task, constraints, solution, validation, and lessons.\n\n"
            + json.dumps(model_to_dict(conversation), indent=2, ensure_ascii=False)
        )
        content = self.provider.complete(
            [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
        )
        self.last_exchange = {'conversation_id': conversation.conversation_id, 'response': content,
                              'metadata': getattr(self.provider, 'last_response_metadata', {})}
        data = parse_json_object(content)
        # Provenance comes from input identity rather than generated model text.
        data["source_conversation_id"] = conversation.conversation_id
        data['source_provenance'] = conversation.provenance
        return EngineeringCase(**data)


def extract_case_directory(raw_dir: Path, case_dir: Path, extractor: LLMCaseExtractor, audit_dir=None):
    """Extract conversations to case-id filenames without temporary files or silent collisions."""
    raw_paths = sorted(raw_dir.glob("*.json"))
    if not raw_paths:
        raise ValueError(f"No raw conversation JSON files found in {raw_dir}")
    seen = set()
    for raw_path in raw_paths:
        case = extractor.extract(Conversation(**read_json(raw_path)))
        output = case_dir / f"{case.case_id}.json"
        if case.case_id in seen:
            raise ValueError(f"Duplicate extracted case_id: {case.case_id}")
        if output.exists() and read_json(output).get("source_conversation_id") != case.source_conversation_id:
            raise ValueError(f"Case id already belongs to another conversation: {case.case_id}")
        seen.add(case.case_id)
        write_json(output, case)
        if audit_dir and hasattr(extractor, 'last_exchange'):
            write_json(Path(audit_dir) / (raw_path.stem + '.json'), extractor.last_exchange)
        yield case, output


def load_case_file(case_path: Path) -> EngineeringCase:
    """Load one already structured EngineeringCase JSON file."""
    return EngineeringCase(**read_json(case_path))
