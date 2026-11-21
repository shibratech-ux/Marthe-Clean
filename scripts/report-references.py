"""Inventory missing static references after npm run build; no network requests."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
import json
import re

class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ('src', 'href', 'data-background') and value:
                self.refs.append(value)

report = {}
for page in Path('dist').rglob('*'):
    if page.suffix not in ('.html', '.css'):
        continue
    text = page.read_text()
    if page.suffix == '.html':
        parser = References()
        parser.feed(text)
        refs = parser.refs
    else:
        refs = re.findall(r'url\(\s*[\"\']?([^\)\"\']+)', text)
    missing, external = set(), set()
    for ref in refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            if url.scheme in ('http', 'https'):
                external.add(ref)
        elif url.path:
            target = Path('dist', unquote(url.path).lstrip('/')) if url.path.startswith('/') else page.parent / unquote(url.path)
            if not target.exists():
                missing.add(ref)
    if missing or external:
        report[str(page.relative_to('dist'))] = {'missing_local': sorted(missing), 'external': sorted(external)}
Path('docs/REFERENCES.json').write_text(json.dumps(report, indent=2) + '\n')
print(f'{sum(len(v["missing_local"]) for v in report.values())} missing reference occurrences recorded')
