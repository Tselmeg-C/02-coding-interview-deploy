import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
import process from 'node:process';

function run(script, env) {
  return new Promise((resolveResult) => {
    const child = spawn('bash', [resolve(script)], { env: { ...process.env, ...env } });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (code) => resolveResult({ code, stderr }));
  });
}

test('rollback refuses to run without human approval', async () => {
  const result = await run('incident-response/runbooks/rollback.sh', {
    ROLLBACK_COMMIT: 'a'.repeat(40),
    HUMAN_APPROVED: '',
  });
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /human approval/);
});

test('recovery runbook verifies an isolated health endpoint', async () => {
  const server = createServer((_request, response) => response.end('{"status":"ok"}'));
  await new Promise((resolveServer) => server.listen(0, resolveServer));
  const { port } = server.address();
  const result = await run('incident-response/runbooks/verify-recovery.sh', {
    APP_URL: `http://127.0.0.1:${port}`,
  });
  server.close();
  assert.equal(result.code, 0);
});
