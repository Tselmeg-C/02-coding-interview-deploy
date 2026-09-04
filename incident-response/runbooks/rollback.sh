#!/usr/bin/env bash
set -euo pipefail

: "${ROLLBACK_IMAGE:?set ROLLBACK_IMAGE to a release tag or full sha256 digest}"
[[ "$ROLLBACK_IMAGE" =~ ^sha256:[a-f0-9]{64}$ || "$ROLLBACK_IMAGE" =~ ^[0-9]{8}-[0-9]{6}-[a-f0-9]{7}$ ]] || {
  echo 'rollback image must be an immutable digest or release tag' >&2
  exit 1
}
[[ "${HUMAN_APPROVED:-}" == 1 ]] || { echo 'set HUMAN_APPROVED=1 after human approval' >&2; exit 1; }
exec gh workflow run production-release.yml -f action=rollback -f image="$ROLLBACK_IMAGE"
