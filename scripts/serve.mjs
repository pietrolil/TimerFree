import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

createServer(async (request, response) => {
  if (request.url !== '/' && request.url !== '/index.html') {
    response.writeHead(404).end();
    return;
  }
  try {
    const html = await readFile('index.html');
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(html);
  } catch {
    response.writeHead(500).end('index.html não encontrado. Execute npm run build.');
  }
}).listen(4173, '127.0.0.1');
