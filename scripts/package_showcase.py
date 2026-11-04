"""Create the showcase download without secrets, runtime data or recursive ZIPs."""
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIRS = {'experience_guided_code_agent', 'benchmarks', 'configs', 'docs', 'examples',
               'scripts', 'tests', 'showcase', '.github'}
SOURCE_FILES = {'README.md', 'LICENSE', 'CONTRIBUTING.md', 'CODE_OF_CONDUCT.md',
                'SECURITY.md', '.env.example', '.gitignore', '.gitattributes',
                'pytest.ini', 'requirements.txt', 'requirements-core.txt'}


def source_files():
    for path in sorted(ROOT.rglob('*')):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if rel.parts[0] not in SOURCE_DIRS and rel.as_posix() not in SOURCE_FILES:
            continue
        if any(part in {'__pycache__', '.pytest_cache', '.venv', '.git', 'node_modules', 'outputs'} for part in rel.parts):
            continue
        if path.suffix in {'.pyc', '.zip', '.gz'} or path.name in {'.env', 'password.txt'}:
            continue
        yield path


if __name__ == '__main__':
    output = ROOT / 'showcase/experience-guided-code-agent-source.zip'
    output.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for path in source_files():
            archive.write(path, path.relative_to(ROOT).as_posix())
    print(output)
