import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';
import { createAlertServer } from '../src/server.js';

const secret = 'not-a-real-secret-with-at-least-32-bytes';

async function startServer(context, handler) {
  const server = createAlertServer({ handler, secret });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  context.after(() => server.close());
  return `http://127.0.0.1:${server.address().port}`;
}

function signedRequest(body) {
  const timestamp = String(Math.floor(Date.now() / 1000));
  return {
    'content-type': 'application/json',
    'x-grafana-alerting-timestamp': timestamp,
    'x-grafana-alerting-signature': createHmac('sha256', secret).update(`${timestamp}:${body}`).digest('hex'),
  };
}

test('accepts a signed Grafana alert envelope', async (context) => {
  const received = [];
  const url = await startServer(context, async (alert) => { received.push(alert); return { duplicate: false }; });
  const body = JSON.stringify({ alerts: [{
    status: 'firing',
    fingerprint: 'c6eadffa33fcdf37',
    labels: { alertname: 'PairCodeRoomErrors', service: 'paircode-interview' },
    annotations: { summary: 'Room failures' },
  }] });

  const response = await fetch(`${url}/alerts`, { method: 'POST', headers: signedRequest(body), body });

  assert.equal(response.status, 202);
  assert.equal(received[0].alertname, 'PairCodeRoomErrors');
});

test('rejects unsigned alert payloads', async (context) => {
  const url = await startServer(context, async () => {});
  const response = await fetch(`${url}/alerts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ alerts: [] }),
  });

  assert.equal(response.status, 401);
});

test('rejects a signed payload without Grafana alerts', async (context) => {
  const url = await startServer(context, async () => {});
  const body = JSON.stringify({ status: 'firing' });
  const response = await fetch(`${url}/alerts`, { method: 'POST', headers: signedRequest(body), body });

  assert.equal(response.status, 400);
});
