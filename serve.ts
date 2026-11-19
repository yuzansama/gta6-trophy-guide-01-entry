// Serves app/ for local use: node serve.ts [port]  ->  http://localhost:8080
// Static files only, nothing outside app/ is reachable. Also used by tools/capture-screenshots.mjs.

import { readFile } from 'node:fs/promises';
import { createServer, type Server } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

export function serveApp(port: number): Promise<Server> {
  const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const file = resolve(appRoot, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
    if (file !== appRoot && !file.startsWith(appRoot + sep)) {
      response.writeHead(403).end('outside app/');
      return;
    }
    try {
      const body = await readFile(file);
      response.writeHead(200, { 'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream', 'cache-control': 'no-store' });
      response.end(body);
    } catch {
      response.writeHead(404).end('not found');
    }
  });
  return new Promise((ready) => server.listen(port, '127.0.0.1', () => ready(server)));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2]) || 8080;
  await serveApp(port);
  console.log(`Leonida Legend is on http://localhost:${port}`);
}
