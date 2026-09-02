# Deployment Handoff

## Current state

Updated: September 1, 2026.

- Branch: `main`
- Latest pushed commit: `747a878` — accepts Railway deployment identifiers
  from GitHub environment variables or environment secrets.
- Successful workflow: [CI and Railway deployment run 33498690097](https://github.com/Tselmeg-C/coding-interview/actions/runs/33498690097)
- Workflow conclusion: `success`. Backend, frontend, full-stack, deploy, and
  post-deployment public `/health` checks all passed.
- Public Playwright verification also passed after deployment: two independent
  browser contexts created/joined a real Railway-hosted room and synchronized
  an editor update.

## Verified work

- The multi-stage Docker image serves the built frontend, API, and Socket.IO
  endpoint from one origin.
- `docker-compose.yaml` starts the same app image and PostgreSQL 16 with
  readiness and application health checks.
- Local verification passed: backend tests, frontend tests, frontend build,
  Compose-backed HTTP integration smoke test, and Playwright two-browser room
  synchronization E2E test.
- Hosted CI has passed the backend, frontend, and full-stack jobs, including
  Compose/Postgres integration and Playwright E2E.
- Railway automatic GitHub deployment is disabled. GitHub Actions is the
  intended deployment gate.

## Previous deployment failures

1. Commit `66cec51`: Railway rejected the old token configuration.
2. Commit `c0d8765`: the CLI could not find a Railway project because the
   GitHub job received empty deployment configuration.
3. Commit `9f65c7e`: the workflow correctly targeted GitHub environment
   `helpful-intuition / production`, but the job still received an empty
   `RAILWAY_PROJECT_ID` value.

No secret or token value is stored in this repository or this handoff.

## Required GitHub environment configuration

Use GitHub repository Settings → Environments →
`helpful-intuition / production`.

Required secret:

- `RAILWAY_API_TOKEN`: Railway account/workspace token.

Required deployment identifiers, accepted as either environment variables or
environment secrets by commit `747a878`:

- `RAILWAY_PROJECT_ID`: Railway internal project ID, not the project name or
  URL.
- `RAILWAY_SERVICE`: Railway application service name, not the Postgres
  service.
- `RAILWAY_ENVIRONMENT`: Railway environment name.
- `RAILWAY_PUBLIC_URL`: public application base URL without a trailing slash.

Environment secrets are the recommended recovery path if GitHub does not make
the environment variables available to the workflow.

## Next-session work

Deployment is complete. Future work is operational hardening rather than a
release blocker:

1. Add production observability, alerting, and a documented incident response
   process.
2. Consider preview/staging environments before production for larger changes.
3. Keep the existing CI, health, and two-browser checks required for changes
   to the application or deployment stack.
4. Do not print, commit, or request secret values. Use
   `env -u GITHUB_TOKEN` for GitHub CLI and Git push operations.
