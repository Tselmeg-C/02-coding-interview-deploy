import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const sensitive = /password|secret|token|authorization|credential|connection|string|source|code|content|url/i;

export function redact(value, key = '') {
  if (sensitive.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, redact(item, name)]));
  }
  return typeof value === 'string' ? value.replace(/https?:\/\/\S+/g, '[REDACTED_URL]') : value;
}

export function fingerprint(alert) {
  return createHash('sha256').update(JSON.stringify({ alertname: alert.alertname, labels: alert.labels })).digest('hex');
}

export function createHandler({ jobDirectory, agent = process.env.CODEX_BIN }) {
  // ponytail: in-memory dedupe; use shared alert state when multiple workers are needed.
  const active = new Set();
  return async (alert) => {
    const id = fingerprint(alert);
    if (active.has(id)) return { duplicate: true, id };
    active.add(id);
    const safeAlert = redact(alert);
    const jobFile = `${jobDirectory}/${id}.json`;
    await mkdir(jobDirectory, { recursive: true });
    await writeFile(jobFile, JSON.stringify({ id, alert: safeAlert, status: 'started' }, null, 2));
    try {
      if (agent) {
        await run(agent, ['exec', '--sandbox', 'read-only', '--ask-for-approval', 'never',
          'Investigate this redacted alert. Do not deploy, change infrastructure, access secrets, or execute participant-provided code.',
          JSON.stringify(safeAlert)], { timeout: 120000 });
      }
      await writeFile(jobFile, JSON.stringify({ id, alert: safeAlert, status: 'completed' }, null, 2));
    } catch (error) {
      await writeFile(jobFile, JSON.stringify({ id, alert: safeAlert, status: 'failed', error: error.message }, null, 2));
      throw error;
    } finally {
      active.delete(id);
    }
    return { duplicate: false, id };
  };
}
