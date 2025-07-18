import { createServer } from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { extname, resolve, sep } from 'node:path';
const root = await realpath(fileURLToPath(new URL('../web-dist/', import.meta.url)));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.wav': 'audio/wav',
};
const server = createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' });
      response.end();
      return;
    }
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const candidate = await realpath(
      resolve(root, `.${path.endsWith('/') ? path + 'index.html' : path}`),
    );
    if (!candidate.startsWith(root + sep) || !(await stat(candidate)).isFile()) {
      response.writeHead(404);
      response.end('Not found');
      return;
    }
    const bytes = await readFile(candidate);
    response.writeHead(200, {
      'Content-Type': types[extname(candidate)] ?? 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'no-cache',
    });
    response.end(request.method === 'HEAD' ? undefined : bytes);
  } catch {
    response.writeHead(404);
    response.end('Not found');
  }
});
server.listen(4173, '127.0.0.1', () => console.log('Sonascope: http://127.0.0.1:4173'));
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close());
