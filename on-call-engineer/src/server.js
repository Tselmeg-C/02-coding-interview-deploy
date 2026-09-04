import { createServer } from 'node:http';
import { createHandler } from './on-call.js';

const handler = createHandler({ jobDirectory: process.env.JOB_LOG_DIR ?? './jobs' });
const server = createServer(async (request, response) => {
  if (request.method !== 'POST' || request.url !== '/alerts') {
    response.writeHead(404).end();
    return;
  }
  let body = '';
  for await (const chunk of request) body += chunk;
  try {
    const alert = JSON.parse(body);
    if (!alert || typeof alert !== 'object' || typeof alert.alertname !== 'string') throw new Error('invalid alert');
    response.writeHead(202, { 'content-type': 'application/json' });
    response.end(JSON.stringify(await handler(alert)));
  } catch {
    response.writeHead(400).end(JSON.stringify({ error: 'invalid_alert' }));
  }
});

server.listen(process.env.PORT ?? 8080);
