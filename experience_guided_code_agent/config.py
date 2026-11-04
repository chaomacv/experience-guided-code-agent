from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[1]
EXAMPLES_DIR = PROJECT_ROOT / "examples"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
CONFIG_DIR = PROJECT_ROOT / "configs"
CASE_DIR = OUTPUTS_DIR / "history_cases"
RAW_DIR = EXAMPLES_DIR / "history_dialogues" / "raw"
KNOWLEDGE_DIR = OUTPUTS_DIR / "knowledge"
INDEX_DIR = OUTPUTS_DIR / "index"
RUNS_DIR = OUTPUTS_DIR / "runs"
DEFAULT_CONFIG = CONFIG_DIR / "wine_practice.json"
