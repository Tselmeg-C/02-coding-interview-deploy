#!/usr/bin/env bash
set -euo pipefail

: "${INCIDENT_ID:?set INCIDENT_ID}"
: "${APP_URL:?set APP_URL}"
[[ "$INCIDENT_ID" =~ ^[A-Za-z0-9_-]+$ ]] || { echo 'invalid incident ID' >&2; exit 1; }
[[ "$APP_URL" =~ ^https?://[^/@]+(:[0-9]+)?$ ]] || { echo 'APP_URL must be a credential-free URL' >&2; exit 1; }

incident_dir="${INCIDENT_DIR:-incident-response/incidents}"
mkdir -p "$incident_dir"
health="$(curl --fail --silent --show-error --max-time 5 "$APP_URL/health")"
export INCIDENT_ID APP_URL health incident_dir

node --input-type=module <<'NODE'
import { writeFile } from 'node:fs/promises';

const record = {
  incident_id: process.env.INCIDENT_ID,
  collected_at_utc: new Date().toISOString(),
  service: 'paircode-interview',
  environment: process.env.DEPLOYMENT_ENVIRONMENT ?? 'unknown',
  version_or_digest: process.env.SERVICE_VERSION ?? 'unknown',
  alert: process.env.ALERT_NAME ?? 'unknown',
  evidence: [{ source: 'health_endpoint', target: '/health', response: JSON.parse(process.env.health) }],
  proposed_action: 'inspect the bounded evidence and follow the matching runbook',
  policy_decision: 'escalated',
  recovery: { status: 'not_verified' },
};
await writeFile(`${process.env.incident_dir}/${process.env.INCIDENT_ID}.json`, `${JSON.stringify(record, null, 2)}\n`);
NODE
