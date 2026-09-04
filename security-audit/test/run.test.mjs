import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = await mkdtemp(join(tmpdir(), 'security-audit-'));
await writeFile(join(root, 'safe.mjs'), 'const value = 1;\n');
await writeFile(join(root, 'unsafe.mjs'), 'const token = "redacted-test-token";\n');
const { stdout } = await run(process.execPath, ['security-audit/run.mjs'], { env: { ...process.env, AUDIT_ROOT: root } });
const report = JSON.parse(stdout);
assert.equal(report.findings.length, 1);
assert.equal(report.findings[0].severity, 'critical');
assert.ok(!stdout.includes('redacted-test-token'));
assert.ok(report.scope[0].endsWith('safe.mjs'));
