# Synthetic engineering development set

20 hand-authored synthetic EngineeringCase files and 30 curated retrieval queries.
Cases cover interface compatibility, runtime activation, fallback, empty input, ties,
embedding identity/dimension/normalization/batching, filtering/diversity, execution,
rollback, bytecode, timeouts, binary dependencies, cache invalidation and plan parsing.

All sources use SYNTHETIC_ identifiers. Cases are fictional scenarios, not production
incidents; validation is not_run and final_status is partial. No proprietary logs,
customer data or API keys are included.

queries.jsonl contains id, category, query and relevance (case_id → integer grade 1–3).
The corpus and labels were authored together. This is a development fixture, not an
independently labeled held-out benchmark. Do not use its scores as generalization,
business impact or Agent success claims.

See [evaluation protocol](../docs/evaluation.md). Data distributed under the repository MIT license.
