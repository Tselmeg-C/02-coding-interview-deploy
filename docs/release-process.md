# Release process

1. Create a short-lived branch from `dev` and open a pull request into `dev`.
2. Wait for backend, frontend, lint, type-check, Compose/PostgreSQL
   integration, and two-browser checks to pass.
3. Merge the reviewed phase into `dev`. Railway's `dev` service deploys its
   GitHub source only after **Wait for CI** sees the push checks pass.
4. Verify development health and the two-browser journey in Railway, then
   record the commit and deployment time.
5. Open a release pull request from `dev` to protected `main`. After review and
   required checks pass, merge it; Railway's production service deploys the
   `main` GitHub source with its protected environment controls.
6. Verify production health, HTTP behavior, persistence, and two-browser
   collaboration, then record the result in deployment history.

Rollback uses a reviewed revert of the faulty release commit, allowing Railway
to redeploy `main` after CI. For urgent recovery, redeploy the known-good
deployment from the Railway dashboard. It never changes the production
database; database recovery follows the separate backup and restore procedure.

Pull requests and pushes to `main` validate only. Do not push directly to
`dev` or `main`, bypass branch protection, or place credentials in commits,
logs, variables, or documentation.
