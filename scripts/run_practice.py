"""One-command real-model practice: measurements -> Cases -> RAG -> code -> validation."""
import argparse
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from algo_rag_demo.utils.jsonio import read_json


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--config', default='configs/wine_practice.json')
    args = parser.parse_args()
    os.chdir(ROOT)
    config = read_json(Path(args.config))
    key_env = config['llm'].get('api_key_env', 'DEEPSEEK_API_KEY')
    if not os.environ.get(key_env):
        raise SystemExit('Set ' + key_env + ' before running real-model practice.')
    subprocess.run([sys.executable, 'scripts/prepare_wine.py', '--output', str(Path(config['paths']['raw_dir']).parent)], check=True)
    subprocess.run([sys.executable, '-m', 'algo_rag_demo.cli', '--config', args.config, 'run'], check=True)


if __name__ == '__main__':
    main()
