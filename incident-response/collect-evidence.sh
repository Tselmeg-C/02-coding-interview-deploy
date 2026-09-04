#!/usr/bin/env bash
set -euo pipefail

: "${INCIDENT_ID:?set INCIDENT_ID}"
: "${APP_URL:?set APP_URL}"
[[ "$INCIDENT_ID" =~ ^[A-Za-z0-9_-]+$ ]] || { echo 'invalid incident ID' >&2; exit 1; }
[[ "$APP_URL" =~ ^https?://[^/@]+(:[0-9]+)?$ ]] || { echo 'APP_URL must be a credential-free URL' >&2; exit 1; }

incident_dir="${INCIDENT_DIR:-incident-response/incidents}"
mkdir -p "$incident_dir"
health="$(curl --fail --silent --show-error --max-time 5 "$APP_URL/health")"
export INCIDENT_ID APP_URL health incident_dir EVIDENCE_DIR

node --input-type=module <<'NODE'
import { readFile, writeFile } from 'node:fs/promises';

const sensitiveKey = /password|secret|token|authorization|credential|connection|string|source|code|content/i;
const sensitiveValue = /https?:\/\/\S+|postgres(?:ql)?:\/\/\S+|Bearer\s+\S+/gi;
function redact(value, key = '') {
  if (sensitiveKey.test(key)) return '[REDACTED]';
  if (Array.isArray(value)) return value.map((item) => redact(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([name, item]) => [name, redact(item, name)]));
  }
  return typeof value === 'string' ? value.replace(sensitiveValue, '[REDACTED]') : value;
}

async function evidenceFile(name) {
  if (!process.env.EVIDENCE_DIR) return { source: name.slice(0, -5), status: 'not_configured' };
  try {
    const contents = await readFile(`${process.env.EVIDENCE_DIR}/${name}`, 'utf8');
    if (Buffer.byteLength(contents) > 32768) return { source: name.slice(0, -5), status: 'rejected_size' };
    let value;
    try { value = JSON.parse(contents); } catch { value = contents; }
    return { source: name.slice(0, -5), data: redact(value) };
  } catch {
    return { source: name.slice(0, -5), status: 'unavailable' };
  }
}

const record = {
  incident_id: process.env.INCIDENT_ID,
  collected_at_utc: new Date().toISOString(),
  service: 'paircode-interview',
  environment: process.env.DEPLOYMENT_ENVIRONMENT ?? 'unknown',
  version_or_digest: process.env.SERVICE_VERSION ?? 'unknown',
  alert: process.env.ALERT_NAME ?? 'unknown',
  evidence: [
    { source: 'health_endpoint', target: '/health', response: JSON.parse(process.env.health) },
    ...(await Promise.all(['metrics.json', 'traces.json', 'logs.json'].map(evidenceFile))),
  ],
  proposed_action: 'inspect the bounded evidence and follow the matching runbook',
  policy_decision: 'escalated',
  recovery: { status: 'not_verified' },
};
await writeFile(`${process.env.incident_dir}/${process.env.INCIDENT_ID}.json`, `${JSON.stringify(record, null, 2)}\n`);
NODE
