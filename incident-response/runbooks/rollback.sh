#!/usr/bin/env bash
set -euo pipefail

: "${ROLLBACK_COMMIT:?set ROLLBACK_COMMIT to the faulty release commit}"
[[ "$ROLLBACK_COMMIT" =~ ^[a-f0-9]{7,40}$ ]] || { echo 'rollback commit must be a Git commit SHA' >&2; exit 1; }
[[ "${HUMAN_APPROVED:-}" == 1 ]] || { echo 'set HUMAN_APPROVED=1 after human approval' >&2; exit 1; }
echo "Revert $ROLLBACK_COMMIT through a reviewed pull request; Railway will redeploy main after CI."
