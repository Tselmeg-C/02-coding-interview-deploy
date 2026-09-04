#!/usr/bin/env bash
set -euo pipefail

: "${APP_URL:?set APP_URL}"
[[ "$APP_URL" =~ ^https?://[^/@]+(:[0-9]+)?$ ]] || { echo 'APP_URL must be a credential-free URL' >&2; exit 1; }
curl --fail --silent --show-error --max-time 10 "$APP_URL/health"
echo 'Recovery health check passed.'
