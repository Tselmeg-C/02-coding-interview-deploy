import { createHmac, timingSafeEqual } from 'node:crypto';
import { createServer } from 'node:http';
import { pathToFileURL } from 'node:url';
import { createGitHubDispatcher, createHandler, normalizeWebhook } from './on-call.js';

const maxBodyBytes = 64 * 1024;
const maxClockSkewSeconds = 300;

function send(response, status, body) {
  response.writeHead(status, { 'content-type': 'application/json' });
  response.end(JSON.stringify(body));
}

async function readBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      request.resume();
      throw new Error('payload_too_large');
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function verifyGrafanaSignature(body, signature, timestamp, secret, now = Date.now()) {
  if (!secret || !/^[a-f0-9]{64}$/i.test(signature ?? '') || !/^\d+$/.test(timestamp ?? '')) return false;
  if (Math.abs(Math.floor(now / 1000) - Number(timestamp)) > maxClockSkewSeconds) return false;
  const actual = Buffer.from(signature, 'hex');
  const expected = createHmac('sha256', secret).update(`${timestamp}:`).update(body).digest();
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createAlertServer({ handler, secret, now = Date.now }) {
  return createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      send(response, 200, { status: 'ok' });
      return;
    }
    if (request.method !== 'POST' || request.url !== '/alerts') {
      send(response, 404, { error: 'not_found' });
      return;
    }
    try {
      const body = await readBody(request);
      if (!verifyGrafanaSignature(
        body,
        request.headers['x-grafana-alerting-signature'],
        request.headers['x-grafana-alerting-timestamp'],
        secret,
        now(),
      )) {
        send(response, 401, { error: 'invalid_signature' });
        return;
      }
      let alerts;
      try {
        alerts = normalizeWebhook(JSON.parse(body.toString('utf8')));
      } catch {
        send(response, 400, { error: 'invalid_alert' });
        return;
      }
      const results = await Promise.all(alerts.map(handler));
      send(response, 202, { accepted: results.length });
    } catch (error) {
      const status = error instanceof Error && error.message === 'payload_too_large' ? 413 : 502;
      if (status === 502) console.error(JSON.stringify({ severity: 'ERROR', message: 'On-call alert dispatch failed' }));
      send(response, status, { error: status === 413 ? 'payload_too_large' : 'dispatch_failed' });
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const secret = process.env.GRAFANA_WEBHOOK_SECRET;
  if (!secret) throw new Error('GRAFANA_WEBHOOK_SECRET is required');
  const handler = createHandler({
    jobDirectory: process.env.JOB_LOG_DIR ?? '/tmp/paircode-on-call-jobs',
    dispatch: createGitHubDispatcher(),
  });
  createAlertServer({ handler, secret }).listen(process.env.PORT ?? 8080, () => {
    console.log('PairCode on-call receiver listening');
  });
}
