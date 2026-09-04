import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import process from 'node:process';

const root = process.env.AUDIT_ROOT ?? 'incident-response';
const files = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && entry.name === 'test') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(mjs|js|sh|yaml)$/.test(entry.name)) files.push(path);
  }
}

await walk(root);
const findings = [];
for (const path of files) {
  const source = await readFile(path, 'utf8');
  const name = relative(process.cwd(), path);
  if (/\b(eval|new Function)\s*\(/.test(source)) findings.push({ id: `unsafe-code-${findings.length + 1}`, severity: 'high', evidence: `${name} uses dynamic code execution`, disposition: 'escalate', owner: 'Security', remediation_pr: 'TBD', due_date: 'TBD' });
  if (/(password|secret|token|api[_-]?key)\s*[:=]\s*['"][^'"]+['"]/i.test(source)) findings.push({ id: `hardcoded-secret-${findings.length + 1}`, severity: 'critical', evidence: `${name} contains a possible hardcoded credential`, disposition: 'escalate', owner: 'Security', remediation_pr: 'TBD', due_date: 'TBD' });
}

process.stdout.write(`${JSON.stringify({
  audit_id: `responder-${new Date().toISOString().slice(0, 10)}`,
  audited_at_utc: new Date().toISOString(),
  scope: files.map((path) => relative(process.cwd(), path)).sort(),
  findings,
}, null, 2)}\n`);
