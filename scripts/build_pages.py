#!/usr/bin/env python3
"""Build a portable static site, including stable feature/module redirects."""
from pathlib import Path
from html import escape
from urllib.parse import quote, urlsplit, unquote
import json
import shutil

PROJECT = Path(__file__).resolve().parents[1]
OUTPUT = PROJECT / '_site'
if OUTPUT.exists():
    shutil.rmtree(OUTPUT)
shutil.copytree(PROJECT / 'public', OUTPUT)
(OUTPUT / '.nojekyll').touch()
links = json.loads((PROJECT / 'data/report-links.json').read_text())
for entry in links['features'] + links['modules']:
    destination = OUTPUT / entry['short_path'].strip('/') / 'index.html'
    destination.parent.mkdir(parents=True, exist_ok=True)
    target = '../../' + quote(entry['report_path'].lstrip('/'), safe='/#')
    resolved = (destination.parent / unquote(urlsplit(target).path)).resolve()
    assert resolved.is_file() and OUTPUT.resolve() in resolved.parents, entry
    name = escape(entry['name'])
    destination.write_text(
        '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">'
        '<meta name="robots" content="noindex,nofollow">'
        f'<meta http-equiv="refresh" content="0;url={escape(target, quote=True)}">'
        f'<title>{name}</title></head><body>'
        f'<a href="{escape(target, quote=True)}">打开{name}</a>'
        f'<script>location.replace({json.dumps(target)});</script></body></html>'
    )
print(json.dumps({'output': '_site', 'static_redirects': len(links['features']) + len(links['modules'])}))
