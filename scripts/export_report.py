#!/usr/bin/env python3
"""从本地调研工作目录导出报告及其实际引用的资源，不复制工具、凭据和底稿。"""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit, unquote
from collections import deque
import argparse
import hashlib
import json
import re
import shutil

PROJECT = Path(__file__).resolve().parents[1]
ALLOWED_ROOTS = {'校校功能清单', '校校教师端调研报告_2026-10-23', '学生端调研_实操记录', '师生联动说明'}
ALLOWED_SUFFIXES = {'.html', '.css', '.js', '.json', '.txt', '.csv', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf', '.ico'}


class Links(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.refs = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in {'href', 'src'} and value:
                self.refs.append(value)


def export(workspace):
    workspace = workspace.resolve()
    queue = deque([workspace / 'index.html', workspace / '校校调研总览.html'])
    included = set()
    while queue:
        source = queue.popleft().resolve()
        if source in included:
            continue
        relative = source.relative_to(workspace)
        if len(relative.parts) > 1 and relative.parts[0] not in ALLOWED_ROOTS:
            raise ValueError(f'不在报告发布范围内：{relative}')
        if source.suffix not in ALLOWED_SUFFIXES or not source.is_file():
            raise ValueError(f'无效资源：{relative}')
        included.add(source)
        if source.suffix not in {'.html', '.css', '.js'}:
            continue
        text = source.read_text()
        refs = Links(text).refs if source.suffix == '.html' else re.findall(r'url\([\'\"]?([^\)\'\"]+)', text) if source.suffix == '.css' else []
        for ref in refs:
            url = urlsplit(ref)
            if url.scheme or url.netloc or not url.path:
                continue
            queue.append((source.parent / unquote(url.path)).resolve())

    public = PROJECT / 'public'
    public.mkdir(exist_ok=True)
    manifest = []
    for source in sorted(included):
        relative = source.relative_to(workspace)
        target = public / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)
        manifest.append({'path': relative.as_posix(), 'bytes': source.stat().st_size, 'sha256': hashlib.sha256(source.read_bytes()).hexdigest()})

    data = PROJECT / 'data'
    data.mkdir(exist_ok=True)
    for name in ['层级框架.json', '功能清单数据.json', '功能检查要点.json', '功能配图索引.json', '待补说明.json']:
        shutil.copy2(workspace / '校校功能清单' / name, data / name)
    catalog = json.loads((data / '功能清单数据.json').read_text())
    links = {'features': [], 'modules': []}
    for feature in catalog['features']:
        links['features'].append({'id': feature['id'], 'name': feature['name'], 'short_path': '/f/' + feature['id'], 'report_path': '/校校功能清单/' + feature['detail_file'] + '#' + feature['id']})
    for block in catalog['blocks']:
        for module in block['modules']:
            links['modules'].append({'id': module['id'], 'name': module['name'], 'short_path': '/m/' + module['id'], 'report_path': '/校校功能清单/' + block['file'] + '#' + module['id']})
    (data / 'report-links.json').write_text(json.dumps(links, ensure_ascii=False, indent=2))
    (public / 'report-links.json').write_text(json.dumps(links, ensure_ascii=False, indent=2))
    (public / 'robots.txt').write_text('User-agent: *\nDisallow: /\n')
    result = {'published_on': '2026-10-27', 'files': manifest, 'report_files': len(manifest), 'report_bytes': sum(item['bytes'] for item in manifest), 'blocks': len(catalog['blocks']), 'modules': len(links['modules']), 'features': len(links['features']), 'checkpoints': sum(len(f['checkpoints']) for f in catalog['features'])}
    (data / 'publish-manifest.json').write_text(json.dumps(result, ensure_ascii=False, indent=2))
    print(json.dumps({key: value for key, value in result.items() if key != 'files'}, ensure_ascii=False))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--workspace', type=Path, default=PROJECT.parent)
    export(parser.parse_args().workspace)
