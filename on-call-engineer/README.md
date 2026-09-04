# On-call engineer proof of concept

This webhook-only proof of concept accepts Grafana alert payloads at
`POST /alerts`. It deduplicates active alerts, redacts secrets, URLs, source,
code, and participant content, and persists one JSON job record per alert.

Set `CODEX_BIN` only in an isolated development environment to start the fixed
read-only investigation command. The agent receives redacted alert metadata;
it must not deploy, change infrastructure, access secrets, or execute
participant-provided code. Without `CODEX_BIN`, the persisted record is the
investigation handoff and no agent process starts.

```bash
npm test
node src/server.js
```

The incident-lifecycle test uses a temporary directory and a fake fixed agent;
it never contacts Grafana, Railway, or production.

Use a short-lived disposable checkout and a restricted service account for a
real agent runner. Contact points, tokens, repository credentials, and
observability access remain external configuration.
