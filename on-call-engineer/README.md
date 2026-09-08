# On-call remediation

The receiver accepts signed Grafana webhooks at `POST /alerts`, reduces them to
bounded operational metadata, and sends a `paircode_on_call` repository
dispatch. GitHub then opens one incident per alert fingerprint, runs Codex in a
disposable credential-free checkout, validates any proposed source patch in a
fresh job, and opens a pull request to `dev`. A resolved Grafana notification
closes the incident.

Production deployment, merging, database changes, infrastructure changes,
secret access, and execution of participant-provided code are never automatic.
If a fix cannot stay within `backend/src`, `backend/test`, or `frontend/src`,
the workflow escalates without a patch.

## Receiver deployment

Create a separate Railway service from this repository with root directory
`on-call-engineer`, its Dockerfile builder, and `/health` as the health-check
path. Configure these variables in Railway, never in the repository:

- `GRAFANA_WEBHOOK_SECRET`: a random shared HMAC secret.
- `GITHUB_TOKEN`: a fine-grained token with Contents write access to this
  repository, used only for repository dispatch.
- `GITHUB_REPOSITORY`: `OWNER/REPOSITORY`.
- `JOB_LOG_DIR`: optional; defaults to `/tmp/paircode-on-call-jobs`.

The token owner must have repository write access so the Codex action accepts
the dispatch actor. The JSON job files are ephemeral diagnostics; GitHub issues
provide durable deduplication.

## GitHub configuration

The `on-call.yml` workflow must exist on the repository's default branch.
Configure these GitHub Actions secrets:

- `OPENAI_API_KEY`: used only through `openai/codex-action`'s protected proxy.
- `ON_CALL_GITHUB_TOKEN`: a separate fine-grained token with Contents and Pull
  requests write access, used by the clean publishing job so the resulting PR
  triggers normal CI.

Keep `dev` and `main` protected. The workflow creates a short-lived branch and
a PR into `dev`; it does not approve, merge, or deploy it.

## Grafana contact point

Point a webhook contact point at `https://RECEIVER_DOMAIN/alerts`. Enable
HMAC-SHA256 with the same shared secret, leave the signature header as
`X-Grafana-Alerting-Signature`, and set the timestamp header to
`X-Grafana-Alerting-Timestamp`. Keep resolved messages enabled and set Max
Alerts to no more than 20. Route the PairCode production policy to this contact
point.

## Local checks

```bash
npm test
docker build -t paircode-on-call on-call-engineer
```

The HTTP tests exercise a realistic signed Grafana envelope and reject unsigned
or malformed requests. No real token or provider connection is required.
