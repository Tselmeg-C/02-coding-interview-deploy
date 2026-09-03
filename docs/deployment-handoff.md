# Deployment Handoff

See [`deployment-history.md`](deployment-history.md) for the chronological
record of releases, verification evidence, exceptions, and rollback context.

## Current state

Updated: September 3, 2026.

- Deployment branch: `dev`.
- Pull requests run CI only. Pushes to `dev` run CI and, after it passes,
  deploy to Railway's development environment and verify `/health`.
- The CI chain includes backend tests, frontend tests and build, lint,
  type-checking, a Compose/Postgres integration smoke test, and a two-browser
  Playwright collaboration test.
- Pushes to `main` run the same release gate and then wait for approval through
  the protected GitHub `production` environment before deploying.

## Verified work

- The multi-stage Docker image serves the built frontend, API, and Socket.IO
  endpoint from one origin.
- `docker-compose.yaml` starts the same app image and PostgreSQL 16 with
  readiness and application health checks.
- Local verification passed: backend tests, frontend tests, frontend build,
  Compose-backed HTTP integration smoke test, and Playwright two-browser room
  synchronization E2E test.
- The local lint and type-check commands pass with the current configuration.
- Railway automatic GitHub deployment is disabled. GitHub Actions is the
  intended development deployment gate.

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

## Required GitHub environment configuration

Use GitHub repository Settings → Environments → `development` or
`production`, with values for the corresponding Railway environment.

Required secret:

- `RAILWAY_API_TOKEN`: Railway account/workspace token.

Required GitHub environment variables:

- `RAILWAY_PROJECT_ID`: Railway internal project ID, not the project name or
  URL.
- `RAILWAY_SERVICE`: Railway application service name, not the Postgres
  service.
- `RAILWAY_ENVIRONMENT`: Railway development environment name.
- `RAILWAY_PUBLIC_URL`: public application base URL without a trailing slash.

The manual production release workflow also requires these repository or
production-environment variables to identify the development service used for
digest verification:

- `DEV_RAILWAY_PROJECT_ID`
- `DEV_RAILWAY_SERVICE`
- `DEV_RAILWAY_ENVIRONMENT`

Telemetry configuration belongs in each Railway environment: set
`OTEL_EXPORTER_OTLP_ENDPOINT`, keep `OTEL_EXPORTER_OTLP_HEADERS` in a secret,
enable `OTEL_TRACES_EXPORTER`, `OTEL_METRICS_EXPORTER`, and
`OTEL_LOGS_EXPORTER` with `otlp`, and set `DEPLOYMENT_ENVIRONMENT` plus
`SERVICE_VERSION`.

## Immutable release workflow

`.github/workflows/production-release.yml` accepts a timestamped release tag or
full `sha256:` digest. It resolves tags to digests, verifies the requested
digest in development, requires the protected `production` environment gate,
and connects production to that exact image. Select `promote` for a release or
`rollback` for a previously recorded known-good digest. It never builds an
image.

## Next-session work

The production environment split, immutable development deployment, and
approval-gated promotion/rollback workflow are in place. Future work can
include:

1. Add observability, alerting, and a documented incident response process.
2. Consider preview/staging environments before production for larger changes.
3. Keep the existing CI, health, and two-browser checks required for changes
   to the application or deployment stack.
4. Do not print, commit, or request secret values. Use
   `env -u GITHUB_TOKEN` for GitHub CLI and Git push operations.
