import { execFileSync } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { appendFile, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const allowedPath = /^(?:backend\/(?:src|test)\/|frontend\/src\/)/;

export function parseRemediation(input) {
  const value = JSON.parse(input);
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.keys(value).sort().join(',') !== 'disposition,patch,summary'
    || !['fix', 'escalate'].includes(value.disposition)
    || typeof value.summary !== 'string' || !value.summary || value.summary.length > 1000
    || typeof value.patch !== 'string' || value.patch.length > 100000) {
    throw new Error('invalid remediation response');
  }
  if (value.disposition === 'fix'
    && (!value.patch.startsWith('diff --git ') || value.patch.includes('\0') || value.patch.includes('GIT binary patch'))) {
    throw new Error('invalid remediation patch');
  }
  if (value.disposition === 'escalate' && value.patch) throw new Error('escalations cannot contain a patch');
  return value;
}

export function validateChangedPaths(paths) {
  if (!paths.length || paths.length > 20 || paths.some((path) => !allowedPath.test(path))) {
    throw new Error('remediation changed a disallowed path');
  }
}

export function checkStagedRemediation() {
  const git = (...args) => execFileSync('git', args, { encoding: 'utf8' });
  const paths = git('diff', '--cached', '--name-only', '--diff-filter=ACDMRTUXB', '--no-renames', '-z')
    .split('\0').filter(Boolean);
  validateChangedPaths(paths);
  if (git('diff', '--cached', '--name-only', '--diff-filter=D', '--no-renames')) {
    throw new Error('remediation cannot delete files');
  }
  if (/mode change|create mode (?!100644)/.test(git('diff', '--cached', '--summary', '--no-renames'))) {
    throw new Error('remediation cannot change file modes or create symlinks');
  }
  if (Buffer.byteLength(git('diff', '--cached', '--binary', '--no-renames')) > 100000) {
    throw new Error('remediation patch is too large');
  }
}

async function main() {
  const [command, patchPath] = process.argv.slice(2);
  if (command === 'prepare' && patchPath && process.env.GITHUB_OUTPUT) {
    const remediation = parseRemediation(process.env.CODEX_RESPONSE ?? '');
    await writeFile(patchPath, remediation.patch);
    await appendFile(process.env.GITHUB_OUTPUT, `disposition=${remediation.disposition}\n`);
    return;
  }
  if (command === 'check-index') {
    checkStagedRemediation();
    return;
  }
  throw new Error('usage: remediation.mjs prepare PATCH | check-index');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
