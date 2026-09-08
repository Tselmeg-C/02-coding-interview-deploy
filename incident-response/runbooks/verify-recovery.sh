#!/usr/bin/env bash
set -euo pipefail

: "${APP_URL:?set APP_URL}"
[[ "$APP_URL" =~ ^https?://[^/@]+(:[0-9]+)?$ ]] || { echo 'APP_URL must be a credential-free URL' >&2; exit 1; }
export APP_URL
node --input-type=module <<'NODE'
const response = await fetch(`${process.env.APP_URL}/health`, { signal: AbortSignal.timeout(10000) });
if (!response.ok) throw new Error(`health check failed (${response.status})`);
process.stdout.write(await response.text());
NODE
echo 'Recovery health check passed.'
