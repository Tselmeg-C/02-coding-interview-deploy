# Deployment Handoff

## Current state

Updated: September 2, 2026.

- Deployment branch: `dev`.
- Pull requests run CI only. Pushes to `dev` run CI and, after it passes,
  deploy to Railway's development environment and verify `/health`.
- The CI chain includes backend tests, frontend tests and build, lint,
  type-checking, a Compose/Postgres integration smoke test, and a two-browser
  Playwright collaboration test.
- Production deployment is not configured in the active workflow.

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

## Required GitHub environment configuration

Use GitHub repository Settings → Environments → `development`.

Required secret:

- `RAILWAY_API_TOKEN`: Railway account/workspace token.

Required GitHub environment variables:

- `RAILWAY_PROJECT_ID`: Railway internal project ID, not the project name or
  URL.
- `RAILWAY_SERVICE`: Railway application service name, not the Postgres
  service.
- `RAILWAY_ENVIRONMENT`: Railway development environment name.
- `RAILWAY_PUBLIC_URL`: public application base URL without a trailing slash.

## Next-session work

The development deployment workflow is in place. Future work can include:

1. Configure and verify a separate production workflow when production CD is
   required.
2. Add observability, alerting, and a documented incident response process.
3. Consider preview/staging environments before production for larger changes.
4. Keep the existing CI, health, and two-browser checks required for changes
   to the application or deployment stack.
5. Do not print, commit, or request secret values. Use
   `env -u GITHUB_TOKEN` for GitHub CLI and Git push operations.
