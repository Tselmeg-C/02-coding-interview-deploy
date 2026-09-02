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

## Railway environment split status

- The Railway project has distinct `development` and `production`
  environments. GitHub's `production` environment is restricted to protected
  branches and requires the demo project's owner approval.
- Development has a running app service, its own running managed PostgreSQL
  service, a public domain, and `DEPLOYMENT_ENVIRONMENT=development`.
- Production currently has no running app or PostgreSQL service instance and
  no public domain. It must not be pointed at the development database.
- On September 2, 2026, Railway rejected creation of a new production
  PostgreSQL service because the project's free-plan resource provision limit
  was reached. No production resource was created or changed by that attempt.

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

The development deployment workflow is in place. Resume the environment split
as follows:

1. Resolve Railway capacity by upgrading the project or, only after an
   inventory and approved recovery plan, removing unused resources. Do not
   reuse the development Postgres service for production.
2. Provision isolated production app and managed PostgreSQL services; set the
   app's `DATABASE_URL` from its production PostgreSQL service and
   `DEPLOYMENT_ENVIRONMENT=production`.
3. Configure the production GitHub environment's secret and non-secret
   deployment identifiers, then add the approval-gated production promotion
   workflow. Keep values out of source control and command output.
4. Verify `/health`, room creation, persistence, and two independent browser
   sessions synchronizing an edit in each environment.
5. Keep the existing CI, health, and two-browser checks required for changes
   to the application or deployment stack.
6. Do not print, commit, or request secret values. Use
   `env -u GITHUB_TOKEN` for GitHub CLI and Git push operations.
