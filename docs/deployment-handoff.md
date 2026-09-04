# Deployment Handoff

See [`deployment-history.md`](deployment-history.md) for the chronological
record of releases, verification evidence, exceptions, and rollback context.

## Current state

Updated: September 3, 2026.

- Deployment branch: `dev`.
- Pull requests and pushes run the GitHub quality gates. Railway's GitHub
  integration deploys the `dev` source after its checks pass.
- The CI chain includes backend tests, frontend tests and build, lint,
  type-checking, a Compose/Postgres integration smoke test, and a two-browser
  Playwright collaboration test.
- A release PR from `dev` to protected `main` is required for production.
  Railway production uses the `main` GitHub source with **Wait for CI** and
  the protected production approval.

## Verified work

- The multi-stage Docker image serves the built frontend, API, and Socket.IO
  endpoint from one origin.
- `docker-compose.yaml` starts the same app image and PostgreSQL 16 with
  readiness and application health checks.
- Local verification passed: backend tests, frontend tests, frontend build,
  Compose-backed HTTP integration smoke test, and Playwright two-browser room
  synchronization E2E test.
- The local lint and type-check commands pass with the current configuration.
- Railway GitHub autodeploy must be enabled for the matching branch in each
  environment, with **Wait for CI** enabled.

No secret or token value is stored in this repository or this handoff.

## Railway environment split status

- The Railway project has distinct `development` and `production`
  environments. GitHub's `production` environment is restricted to protected
  branches and requires the demo project's owner approval.
- Development has a running app service, its own running managed PostgreSQL
  service, a public domain, and `DEPLOYMENT_ENVIRONMENT=development`.
- Production has a dedicated `app-production` service, its own running managed
  PostgreSQL service, a public domain, and
  `DEPLOYMENT_ENVIRONMENT=production`. Its `DATABASE_URL` is a Railway reference
  to the PostgreSQL service in the production environment.
- Production passed `/health`, room creation/update/retrieval, room retrieval
  after an app restart, and the two-browser synchronization check on September
  3, 2026.

## Required Railway configuration

Connect the development app service to this repository's `dev` branch and the
production app service to `main`. Enable **Wait for CI** on both services. Keep
each service's `DATABASE_URL`, telemetry settings, and public URL in its own
Railway environment.

Telemetry configuration belongs in each Railway environment: set
`OTEL_EXPORTER_OTLP_ENDPOINT`, keep `OTEL_EXPORTER_OTLP_HEADERS` in a secret,
enable `OTEL_TRACES_EXPORTER`, `OTEL_METRICS_EXPORTER`, and
`OTEL_LOGS_EXPORTER` with `otlp`, and set `DEPLOYMENT_ENVIRONMENT` plus
`SERVICE_VERSION`. The provider setup, retention, access, and verification
checklist are documented in [`observability.md`](observability.md). Grafana
Cloud account and Railway secret configuration remain operator actions.

## Railway deployment workflow

Railway builds and deploys the connected GitHub source after **Wait for CI**.
Production changes arrive through the protected `dev`-to-`main` release PR.
Rollback uses a reviewed revert or a redeploy of the previous successful
Railway deployment.

## Next-session work

The production environment split is in place. After the Railway GitHub-source
connections and **Wait for CI** settings are verified, future work can
include:

1. Add observability, alerting, and a documented incident response process.
2. Consider preview/staging environments before production for larger changes.
3. Keep the existing CI, health, and two-browser checks required for changes
   to the application or deployment stack.
4. Do not print, commit, or request secret values. Use
   `env -u GITHUB_TOKEN` for GitHub CLI and Git push operations.
