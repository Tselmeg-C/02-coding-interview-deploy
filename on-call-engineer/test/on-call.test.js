import test from 'node:test';
import assert from 'node:assert/strict';
import { createGitHubDispatcher, fingerprint, normalizeWebhook, redact } from '../src/on-call.js';

test('redacts secrets, source fields, and URLs', () => {
  assert.deepEqual(redact({ token: 'x', code: 'print(1)', url: 'https://example.test', message: 'failed' }), {
    token: '[REDACTED]', code: '[REDACTED]', url: '[REDACTED]', message: 'failed',
  });
});

test('dedupe identity ignores changing alert details', () => {
  assert.equal(fingerprint({ alertname: 'Down', labels: { service: 'paircode' }, startsAt: 'a' }),
    fingerprint({ alertname: 'Down', labels: { service: 'paircode' }, startsAt: 'b' }));
});

test('normalizes the Grafana webhook envelope to bounded alert metadata', () => {
  const [alert] = normalizeWebhook({ alerts: [{
    status: 'firing',
    fingerprint: 'c6eadffa33fcdf37',
    labels: { alertname: 'PairCodeRoomErrors', service: 'paircode-interview', room_id: 'private' },
    annotations: { summary: 'Room failures', code: 'print(1)', generatorURL: 'https://example.test' },
  }] });

  assert.deepEqual(alert, {
    alertname: 'PairCodeRoomErrors',
    status: 'firing',
    fingerprint: 'c6eadffa33fcdf37',
    labels: { alertname: 'PairCodeRoomErrors', service: 'paircode-interview' },
    annotations: { summary: 'Room failures' },
  });
  assert.throws(() => normalizeWebhook({ alerts: [{
    status: 'firing', labels: { alertname: 'OtherService' }, annotations: {},
  }] }), /invalid alert/);
});

test('dispatches only sanitized alert metadata to GitHub', async () => {
  let request;
  const dispatch = createGitHubDispatcher({
    token: 'placeholder-token',
    repository: 'owner/repository',
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { status: 204 };
    },
  });

  await dispatch({ alertname: 'PairCodeRoomErrors', status: 'firing', fingerprint: 'abcdef12' });

  assert.equal(request.url, 'https://api.github.com/repos/owner/repository/dispatches');
  assert.deepEqual(JSON.parse(request.options.body), {
    event_type: 'paircode_on_call',
    client_payload: { alertname: 'PairCodeRoomErrors', status: 'firing', fingerprint: 'abcdef12' },
  });
});
