"""Check local documentation targets and README inclusion in source downloads.

Standard library only; no model, network or generated source ZIP required.
"""
import re
from urllib.parse import unquote, urlsplit

from package_showcase import ROOT, SOURCE_FILES, source_files

MARKDOWN_LINK = re.compile(r'\]\(\s*<?([^\s)>]+)>?(?:\s+"[^"]*")?\s*\)')
HTML_LINK = re.compile(r'\b(?:src|href)=[\"\']([^\"\']+)[\"\']')


def check():
    paths = list(source_files())
    errors = []
    documents = [path for path in paths if path.suffix == '.md']
    for path in documents:
        # Commands and sample code can contain Markdown syntax that is not a link.
        content = re.sub(r'^```.*?^```[^\n]*', '', path.read_text(encoding='utf-8-sig'),
                         flags=re.MULTILINE | re.DOTALL)
        for target in MARKDOWN_LINK.findall(content) + HTML_LINK.findall(content):
            parsed = urlsplit(target)
            if parsed.scheme or parsed.netloc or not parsed.path:
                continue
            destination = (path.parent / unquote(parsed.path)).resolve()
            if not destination.is_relative_to(ROOT) or not destination.exists():
                errors.append(f'{path.relative_to(ROOT)}: missing local target {target}')
    for readme in ROOT.glob('README*.md'):
        if readme.name not in SOURCE_FILES:
            errors.append(f'{readme.name}: missing from source download manifest')
    for name in ('README.md', 'README.en.md'):
        if not (ROOT / name).is_file():
            errors.append(f'{name}: required bilingual entry point is missing')
    if errors:
        raise SystemExit('\n'.join(errors))
    print(f'Documentation OK: {len(documents)} Markdown files; bilingual READMEs included in source manifest.')


if __name__ == '__main__':
    check()
