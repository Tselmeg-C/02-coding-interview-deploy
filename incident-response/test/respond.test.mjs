import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import process from 'node:process';

const run = promisify(execFile);

test('structured responder denies unsafe action and escalates act without approval', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'paircode-response-'));
  const recordPath = join(directory, 'incident.json');
  await writeFile(recordPath, JSON.stringify({ incident_id: 'test-1', alert: { name: 'RoomErrors' }, evidence: [] }));
  const script = resolve('incident-response/respond.mjs');

  const denied = JSON.parse((await run('node', [script, recordPath], { env: { ...process.env, PROPOSED_ACTION: 'deploy_production' } })).stdout);
  assert.equal(denied.policy_decision, 'denied');

  const escalated = JSON.parse((await run('node', [script, recordPath], { env: { ...process.env, AUTONOMY_LEVEL: 'act', PROPOSED_ACTION: 'run_recovery_check' } })).stdout);
  assert.equal(escalated.policy_decision, 'escalated');
  assert.equal(escalated.executed_command, '');
});
