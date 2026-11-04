#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."
source ./load_deepseek_env.sh
python scripts/run_practice.py "$@"
