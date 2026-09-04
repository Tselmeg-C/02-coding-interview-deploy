import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import process from 'node:process';

test('collects only bounded health evidence into a secret-free incident record', async () => {
  const server = createServer((_request, response) => {
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify({ status: 'ok' }));
  });
  await new Promise((resolveServer) => server.listen(0, resolveServer));
  const { port } = server.address();
  const incidentDir = await mkdtemp(join(tmpdir(), 'paircode-incident-'));
  const result = await new Promise((resolveResult, reject) => {
    const child = spawn('bash', [resolve('incident-response/collect-evidence.sh')], {
      env: { ...process.env, INCIDENT_ID: 'test-1', APP_URL: `http://127.0.0.1:${port}`, INCIDENT_DIR: incidentDir },
    });
    child.on('close', (code) => code ? reject(new Error(`collector exited ${code}`)) : resolveResult());
  });
  assert.equal(result, undefined);
  const record = JSON.parse(await readFile(join(incidentDir, 'test-1.json'), 'utf8'));
  assert.equal(record.evidence[0].response.status, 'ok');
  server.close();
});
