# Incident response

This directory contains the bounded evidence, authorization, responder, and
recovery artifacts tracked by [Issue #49](https://github.com/Tselmeg-C/02-coding-interview-deploy/issues/49).
Incident records belong in `incidents/`; reusable recovery procedures belong in
`runbooks/`. Keep both secret-free.

`collect-evidence.sh` always checks `/health` and optionally accepts only
size-limited `metrics.json`, `traces.json`, and `logs.json` files from
`EVIDENCE_DIR`. Provider-specific collection belongs outside the model and
must produce these redacted, bounded inputs.

Run `node incident-response/respond.mjs INCIDENT.json` to turn a record into
structured output. The adapter denies unknown actions and escalates recovery
actions until `HUMAN_APPROVED=1` is supplied.
