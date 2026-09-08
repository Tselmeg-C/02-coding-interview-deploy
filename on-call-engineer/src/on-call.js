import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';

const sensitive = /password|secret|token|authorization|credential|connection|string|source|code|content|url/i;
const labelNames = [
  'alertname', 'service', 'deployment_environment_name', 'service_version',
  'operation', 'error_type', 'severity', 'owner',
];
const annotationNames = ['summary', 'environment', 'version', 'user_impact', 'first_action', 'escalation'];

function boundedString(value, limit = 500) {
  return typeof value === 'string' ? value.slice(0, limit) : '';
}

function selectStrings(value, names) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(names.flatMap((name) => {
    const selected = boundedString(value[name]);
    return selected ? [[name, selected]] : [];
  }));
}

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

export function normalizeWebhook(payload) {
  if (!payload || !Array.isArray(payload.alerts) || payload.alerts.length === 0 || payload.alerts.length > 20) {
    throw new Error('invalid alert payload');
  }
  return payload.alerts.map((item) => {
    const labels = selectStrings(item?.labels, labelNames);
    const alertname = labels.alertname;
    const status = item?.status;
    if (!alertname || labels.service !== 'paircode-interview' || !['firing', 'resolved'].includes(status)) {
      throw new Error('invalid alert');
    }
    const suppliedFingerprint = boundedString(item.fingerprint, 128);
    return {
      alertname,
      status,
      fingerprint: /^[a-f0-9]{8,128}$/i.test(suppliedFingerprint)
        ? suppliedFingerprint.toLowerCase()
        : fingerprint({ alertname, labels }),
      labels,
      annotations: selectStrings(item.annotations, annotationNames),
    };
  });
}

export function createGitHubDispatcher({
  token = process.env.GITHUB_TOKEN,
  repository = process.env.GITHUB_REPOSITORY,
  fetchImpl = globalThis.fetch,
} = {}) {
  if (!token || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository ?? '')) {
    throw new Error('GitHub dispatch configuration is missing');
  }
  return async (alert) => {
    const response = await fetchImpl(`https://api.github.com/repos/${repository}/dispatches`, {
      method: 'POST',
      headers: {
        accept: 'application/vnd.github+json',
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        'user-agent': 'paircode-on-call',
        'x-github-api-version': '2022-11-28',
      },
      body: JSON.stringify({ event_type: 'paircode_on_call', client_payload: alert }),
    });
    if (response.status !== 204) throw new Error(`GitHub dispatch failed (${response.status})`);
  };
}

export function createHandler({ jobDirectory, dispatch }) {
  if (typeof dispatch !== 'function') throw new Error('dispatch is required');
  // ponytail: in-memory dedupe; use shared alert state when multiple workers are needed.
  const active = new Set();
  return async (alert) => {
    const id = alert.fingerprint || fingerprint(alert);
    if (active.has(id)) return { duplicate: true, id };
    active.add(id);
    const safeAlert = redact(alert);
    const jobFile = `${jobDirectory}/${id}.json`;
    await mkdir(jobDirectory, { recursive: true });
    await writeFile(jobFile, JSON.stringify({ id, alert: safeAlert, status: 'started' }, null, 2));
    try {
      await dispatch(safeAlert);
      await writeFile(jobFile, JSON.stringify({ id, alert: safeAlert, status: 'dispatched' }, null, 2));
    } catch (cause) {
      await writeFile(jobFile, JSON.stringify({ id, alert: safeAlert, status: 'failed', error: 'dispatch_failed' }, null, 2));
      throw cause;
    } finally {
      active.delete(id);
    }
    return { duplicate: false, id };
  };
}
