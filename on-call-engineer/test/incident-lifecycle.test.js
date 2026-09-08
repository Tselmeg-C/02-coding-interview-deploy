import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHandler } from '../src/on-call.js';

test('disposable incident lifecycle redacts, deduplicates, and persists completion', async (context) => {
  const jobDirectory = await mkdtemp(join(tmpdir(), 'paircode-incident-'));
  context.after(() => rm(jobDirectory, { recursive: true, force: true }));
  let release;
  const dispatchStarted = new Promise((resolve) => { release = resolve; });
  const handler = createHandler({
    jobDirectory,
    dispatch: async () => dispatchStarted,
  });
  const alert = {
    alertname: 'PairCodeRoomErrors',
    labels: { service: 'paircode-interview', deployment_environment_name: 'test' },
    annotations: { code: 'print(1)', logs: 'failed https://example.test' },
  };

  const first = handler(alert);
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual((await handler(alert)).duplicate, true);
  release();
  const result = await first;
  const record = JSON.parse(await readFile(join(jobDirectory, `${result.id}.json`), 'utf8'));
  assert.equal(record.status, 'dispatched');
  assert.equal(record.alert.annotations.code, '[REDACTED]');
  assert.equal(record.alert.annotations.logs, 'failed [REDACTED_URL]');
});
