import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import { createReportServer } from '../server.mjs';

test('published report pages, images and stable feature links remain accessible', async t => {
  const server = await createReportServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = (url, options) => fetch(base + encodeURI(url), options);

  const health = await get('/healthz');
  assert.equal(health.status, 200);
  assert.equal((await health.json()).features, 67);
  const home = await get('/校校调研总览.html');
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type'), /text\/html.*utf-8/);
  assert.match(await home.text(), /校校功能结构表/);

  const manifest = JSON.parse(await readFile(new URL('../data/report-links.json', import.meta.url), 'utf8'));
  for (const item of [...manifest.features, ...manifest.modules]) {
    const result = await get(item.short_path, { redirect: 'manual' });
    assert.equal(result.status, 302, item.id);
    assert.equal(decodeURI(result.headers.get('location')), item.report_path);
  }
  const detail = await get('/校校功能清单/B04_作业教学.html');
  assert.match(await detail.text(), /id="XX067"/);
  const image = await get('/校校教师端调研报告_2026-10-23/04_作业/截图/W01.png');
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.ok((await image.arrayBuffer()).byteLength > 1000);
  const head = await get('/校校调研总览.html', { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  const cached = await get('/校校调研总览.html', { headers: { 'If-None-Match': head.headers.get('etag') } });
  assert.equal(cached.status, 304);
});

test('only the published directory is exposed', async t => {
  const server = await createReportServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise(resolve => { server.closeAllConnections(); server.close(resolve); }));
  const base = `http://127.0.0.1:${server.address().port}`;
  for (const pathname of ['/.git/config', '/data/功能清单数据.json', '/server.mjs', '/.tools/', '/missing.html', '/%ZZ', '/%2e%2e%2fpackage.json']) {
    const result = await fetch(base + pathname);
    assert.ok([400, 404].includes(result.status), pathname);
  }
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
});
