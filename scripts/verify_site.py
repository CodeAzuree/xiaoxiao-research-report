#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit
from collections import Counter
import hashlib
import json
import re

PROJECT = Path(__file__).resolve().parents[1]
PUBLIC = PROJECT / 'public'


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids, self.refs = [], []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'img':
            # Oversized lazy-image placeholders can exceed browser layout limits,
            # collapsing subsequent text onto the same coordinates.
            for dimension in ['width', 'height']:
                value = attrs.get(dimension)
                if value is not None:
                    assert value.isdecimal() and 0 < int(value) <= 32768, ('invalid image dimension', attrs.get('src'), dimension, value)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        self.refs.extend(attrs[key] for key in ['href', 'src'] if attrs.get(key))


docs = {p.resolve(): Document(p.read_text()) for p in PUBLIC.rglob('*.html')}
link_count = 0
for file, doc in docs.items():
    assert all(count == 1 for count in Counter(doc.ids).values()), ('duplicate id', file)
    for ref in doc.refs:
        url = urlsplit(ref)
        assert url.scheme != 'file', ('local absolute link', file, ref)
        if url.scheme or url.netloc:
            continue
        target = (file.parent / unquote(url.path)).resolve() if url.path else file
        assert PUBLIC.resolve() in target.parents, ('outside public', file, ref)
        assert target.is_file(), ('missing resource', file, ref)
        if url.fragment:
            assert target in docs and unquote(url.fragment) in docs[target].ids, ('missing anchor', file, ref)
        link_count += 1

manifest = json.loads((PROJECT / 'data/publish-manifest.json').read_text())
for entry in manifest['files']:
    target = PUBLIC / entry['path']
    assert hashlib.sha256(target.read_bytes()).hexdigest() == entry['sha256'], ('changed exported source', target)
links = json.loads((PROJECT / 'data/report-links.json').read_text())
assert len(links['features']) == 67 and len(links['modules']) == 23
for entry in links['features'] + links['modules']:
    url = urlsplit(entry['report_path'])
    target = (PUBLIC / url.path.lstrip('/')).resolve()
    assert target in docs and url.fragment in docs[target].ids, ('invalid stable link', entry)
for file in PUBLIC.rglob('*'):
    if not file.is_file():
        continue
    assert not any(part.startswith('.') or part in {'_工作底稿', '_历史归档', 'node_modules'} for part in file.relative_to(PUBLIC).parts), file
    assert file.suffix not in {'.py', '.sh', '.env', '.enc'}, file
    if file.suffix in {'.html', '.txt', '.json', '.js'}:
        assert not re.search(r'gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|AKID[A-Za-z0-9]{20,}|(?:access_token|app_secret|secretKey)\s*[=:]\s*[\"\'][A-Za-z0-9_\-]{15,}', file.read_text(), re.I), ('credential-like value', file)
result = {'html_pages': len(docs), 'local_links_checked': link_count, 'exported_files': manifest['report_files'], 'features': 67, 'modules': 23, 'stable_report_links': 90, 'source_hashes_match': True, 'errors': []}
(PROJECT / 'verification-result.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
print(json.dumps(result, ensure_ascii=False))
