import http from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
};

export async function createReportServer({ root = path.join(projectRoot, 'public') } = {}) {
  const publicRoot = await realpath(root);
  const links = JSON.parse(await readFile(path.join(projectRoot, 'data/report-links.json'), 'utf8'));
  const aliases = new Map([
    ...links.features.map(item => [item.short_path, item.report_path]),
    ...links.modules.map(item => [item.short_path, item.report_path]),
  ]);

  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');

    const reply = (status, text) => {
      res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : text);
    };
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD');
      reply(405, 'Method not allowed');
      return;
    }

    let requestPath;
    try {
      requestPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      reply(400, 'Invalid path');
      return;
    }
    if (requestPath === '/healthz') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : JSON.stringify({ status: 'ok', features: links.features.length }));
      return;
    }
    if (requestPath.includes('\\') || requestPath.includes('\0') || requestPath.split('/').some(part => part.startsWith('.'))) {
      reply(404, 'Not found');
      return;
    }
    const alias = aliases.get(requestPath.replace(/\/$/, ''));
    if (alias) {
      res.writeHead(302, { Location: encodeURI(alias), 'Cache-Control': 'no-cache' });
      res.end();
      return;
    }

    try {
      let file = path.join(publicRoot, requestPath);
      let info = await stat(file);
      if (info.isDirectory()) {
        file = path.join(file, 'index.html');
        info = await stat(file);
      }
      const resolved = await realpath(file);
      if (!resolved.startsWith(publicRoot + path.sep) || !info.isFile()) {
        reply(404, 'Not found');
        return;
      }
      const extension = path.extname(file).toLowerCase();
      const etag = `"${info.size.toString(16)}-${Math.floor(info.mtimeMs).toString(16)}"`;
      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', ['.html', '.json', '.txt', '.csv'].includes(extension) ? 'no-cache' : 'public, max-age=3600');
      if (req.headers['if-none-match'] === etag) {
        res.writeHead(304);
        res.end();
        return;
      }
      res.writeHead(200, {
        'Content-Type': types[extension] ?? 'application/octet-stream',
        'Content-Length': info.size,
      });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      const stream = createReadStream(resolved);
      stream.on('error', () => res.destroy());
      res.on('close', () => stream.destroy());
      stream.pipe(res);
    } catch (error) {
      if (['ENOENT', 'ENOTDIR', 'EACCES'].includes(error.code)) reply(404, 'Not found');
      else {
        console.error('Static file request failed:', error.code ?? error.name);
        if (!res.headersSent) reply(500, 'Server error');
        else res.destroy();
      }
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be between 1 and 65535');
  const server = await createReportServer();
  server.listen(port, process.env.HOST ?? '0.0.0.0', () => console.log(`Report server listening on port ${port}`));
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
