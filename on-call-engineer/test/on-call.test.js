import test from 'node:test';
import assert from 'node:assert/strict';
import { fingerprint, redact } from '../src/on-call.js';

test('redacts secrets, source fields, and URLs', () => {
  assert.deepEqual(redact({ token: 'x', code: 'print(1)', url: 'https://example.test', message: 'failed' }), {
    token: '[REDACTED]', code: '[REDACTED]', url: '[REDACTED]', message: 'failed',
  });
});

test('dedupe identity ignores changing alert details', () => {
  assert.equal(fingerprint({ alertname: 'Down', labels: { service: 'paircode' }, startsAt: 'a' }),
    fingerprint({ alertname: 'Down', labels: { service: 'paircode' }, startsAt: 'b' }));
});
