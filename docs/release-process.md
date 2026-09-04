# Release process

1. Create a short-lived branch from `dev` and open a pull request into `dev`.
2. Wait for backend, frontend, lint, type-check, Compose/PostgreSQL
   integration, and two-browser checks to pass.
3. Merge the reviewed phase into `dev`. The `dev` workflow builds one tagged
   GHCR image, records its digest, deploys that exact digest to Railway
   development, and checks `/health`.
4. Observe development using the version-filtered dashboard and record the
   image tag, full digest, commit, and deployment time.
5. Run the manual production workflow with `action=promote` and the verified
   tag or digest. The protected `production` environment supplies the approval
   gate and the workflow verifies the digest is running in development.
6. After promotion, the workflow checks production health, HTTP behavior, and
   two-browser collaboration. Record the results in the deployment history.

Rollback uses the same manual workflow with `action=rollback` and a recorded
known-good digest. It never rebuilds from source, deploys `latest`, or changes
the production database. Database recovery follows the separate backup and
restore procedure.

Pull requests and pushes to `main` validate only. Do not push directly to
`dev` or `main`, bypass branch protection, or place credentials in commits,
logs, variables, or documentation.
