"""Export text evidence from an actual run; never export keys or binary indexes."""
import argparse
import hashlib
import json
from pathlib import Path


def export(run_dir, output):
    root = Path(run_dir).resolve()
    # Restrict export to known run assets, not arbitrary neighboring files.
    files = {}
    for path in sorted(root.rglob('*')):
        if not path.is_file() or '__pycache__' in path.parts or path.suffix not in {'.json', '.jsonl', '.md', '.py', '.patch', '.csv', '.txt'}:
            continue
        if path.name.startswith('.') or path.name == 'password.txt':
            continue
        text = path.read_text(encoding='utf-8')
        if __import__('re').search(r'sk-[A-Za-z0-9]{16,}', text):
            raise ValueError('Possible credential in evidence: ' + path.name)
        text = text.replace(str(root), '<run_dir>').replace(str(Path(__file__).resolve().parents[1]), '<project_root>')
        files[path.relative_to(root).as_posix()] = text
    result = {'schema_version':1, 'export':{'redactions':['absolute run and project paths'],
              'excluded':['binary vector index', 'HTML rendering', 'bytecode'],
              'source_file_sha256':{p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest()
                                    for p in root.rglob('*') if p.is_file() and p.relative_to(root).as_posix() in files}},
              'files':files}
    Path(output).parent.mkdir(parents=True, exist_ok=True)
    Path(output).write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({'files':len(files), 'output':str(output)}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('run_dir')
    parser.add_argument('output')
    args = parser.parse_args()
    export(args.run_dir, args.output)
