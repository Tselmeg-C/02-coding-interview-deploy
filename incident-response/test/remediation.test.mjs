import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import test from 'node:test';
import { checkStagedRemediation, parseRemediation, validateChangedPaths } from '../remediation.mjs';

test('accepts a bounded source patch and rejects unsafe remediation output', () => {
  const patch = 'diff --git a/backend/src/app.js b/backend/src/app.js\n--- a/backend/src/app.js\n+++ b/backend/src/app.js\n';
  assert.equal(parseRemediation(JSON.stringify({ disposition: 'fix', summary: 'Fix it', patch })).patch, patch);
  assert.doesNotThrow(() => validateChangedPaths(['backend/src/app.js', 'frontend/src/App.test.jsx']));
  assert.throws(() => validateChangedPaths(['.github/workflows/ci-cd.yml']), /disallowed path/);
  assert.throws(() => parseRemediation(JSON.stringify({ disposition: 'escalate', summary: 'Needs a human', patch })), /cannot contain/);
});

test('accepts a regular source file staged in a disposable Git index', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'paircode-remediation-'));
  const originalDirectory = process.cwd();
  try {
    execFileSync('git', ['init', '--quiet'], { cwd: directory });
    await mkdir(join(directory, 'backend/src'), { recursive: true });
    await writeFile(join(directory, 'backend/src/fix.js'), 'export const fixed = true;\n');
    execFileSync('git', ['add', 'backend/src/fix.js'], { cwd: directory });
    process.chdir(directory);
    assert.doesNotThrow(checkStagedRemediation);
  } finally {
    process.chdir(originalDirectory);
    await rm(directory, { recursive: true, force: true });
  }
});
