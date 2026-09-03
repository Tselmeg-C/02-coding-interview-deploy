# Deployment history

This log records deployment milestones, verification evidence, exceptions, and
rollback context. It intentionally excludes credentials and Railway identifier
values. Add a dated entry whenever deployment behavior or environment state
changes, a release is promoted, or an operational check fails.

## September 3, 2026 — production rollout

### Milestones

1. Confirmed the upgraded Railway project could provision an isolated managed
   PostgreSQL service in the `production` environment.
2. Created the dedicated production app service and configured
   `DEPLOYMENT_ENVIRONMENT=production` plus a Railway-managed `DATABASE_URL`
   reference to production PostgreSQL.
3. Deployed the root Dockerfile manually to establish the production service
   before enabling automation.
4. Generated the production public domain and verified `/health` returned
   `{"status":"ok"}`.
5. Ran the HTTP integration check against production. Room creation, update,
   and retrieval passed.
6. Ran the Playwright two-browser check against production. Both independent
   browser contexts connected to one room and synchronized the candidate edit.
7. Restarted the production app service and retrieved a room created before
   the restart, confirming state persisted in managed PostgreSQL.
8. Added the `main`-branch production deployment job and configured the GitHub
   `production` environment's existing secret and non-secret variables.
9. Re-ran backend tests, frontend tests, lint, type-check, the local
   Compose/PostgreSQL integration check, and the two-browser check. All passed.
10. Merged feature PR #24 into `dev`. Push workflow run `33728601764` passed
    all quality gates, deployed development, and passed the development health
    check.
11. Opened release PR #25 from `dev` to `main`.
12. Re-ran the complete push workflow after repairing branch ancestry. Workflow
    run `33728961404` passed all five quality gates, deployed development, and
    passed its post-deploy health check.
13. Merged PR #26 to put this deployment record on `dev`. The final development
    push run `33729365093` passed all gates, deployed development, and passed
    health verification.
14. Admin-merged release PR #25 into `main` as `5a998e4` after its required
    checks passed on `dev`.
15. Production workflow run `33729586837` passed its backend, frontend, lint,
    type-check, Compose startup, and HTTP integration steps, but the two-browser
    check failed before deployment. The interviewer received
    `console.log("shared from candid")` instead of the candidate's complete
    edit. Production deployment was skipped.
16. The sender-echo repair passed backend and frontend tests, lint, type-check,
    the Compose/PostgreSQL integration check, and 10 consecutive runs of the
    two-browser Playwright scenario before commit.
17. PR #27 merged the repair into `dev`; development run `33730149873` passed
    all gates, deployment, and health. After the release-history sync, run
    `33730483139` repeated those checks successfully.
18. PR #28 merged the repair into `main` as `5fa2105`, retaining `dev` as a
    parent to avoid another squash-history conflict. Production run
    `33730733908` passed all quality gates, the recorded demo-owner approval,
    Railway deployment, and post-deploy health. Final live HTTP integration and
    two-browser checks also passed.
19. Issue #29 upgraded the workflow actions to their verified Node.js 24
    releases. Before commit, backend and frontend tests, lint, type-check,
    Compose/PostgreSQL integration, and the two-browser check passed locally.

### Commits and pull requests

- `3ddb110` — recorded the original Railway capacity blocker.
- `4aaae1f` — added production automation and documented the verified rollout.
- PR #24 — merged the production rollout into `dev` as `a02e7c0`.
- `c282f65` — merged `main` ancestry into `dev` without changing the verified
  tree, resolving conflicts caused by earlier independent squash merges.
- PR #25 — promotes the verified `dev` state to `main`.
- PR #26 — added this deployment history to `dev` as `af5795a`.

### Failed-gate diagnosis

- The failed two-browser check exposed a sender echo race rather than a
  production infrastructure failure. The server broadcast every incremental
  editor update back to the sender, while the sender's controlled React editor
  relied on those asynchronous echoes for state. A stale echo could overwrite
  newer local keystrokes.
- The repair updates local React room state optimistically and broadcasts a
  saved room update only to the other sockets in the room, matching the product
  requirement. Backend regression coverage asserts that the sender receives no
  echo; the two-browser E2E remains the end-to-end regression gate.

### Deliberate exceptions

- The project has one human owner. The owner authorized the documented demo
  administrator exception for required PR review and production-environment
  approval. Automated tests and health checks remain mandatory.
- The `main`/`dev` ancestry repair required an administrator push to `dev`
  because earlier squash merges left the long-lived branches with conflicting
  histories. The repair commit's tree was verified byte-for-byte against the
  already tested `dev` tree before it was pushed.

### Follow-up signal

- Issue #29 tracks removal of the Node.js 20 action-runtime warning. Official
  action metadata was verified before changing the workflow:
  `actions/checkout@v7.0.1` and `actions/setup-node@v7.0.0` both declare the
  Node.js 24 runtime.

### Rollback and diagnosis

- Start with the failing GitHub run and identify whether the failure occurred
  in quality gates, Railway upload/deploy, or the post-deploy health check.
- For an application regression, revert the release commit through a pull
  request and let the `main` workflow redeploy the reverted tree.
- Do not replace, delete, or point production at development PostgreSQL during
  an app rollback. Database recovery requires a separate reviewed plan.
- Re-run `APP_URL=<environment-url> npm run test:integration` and
  `APP_URL=<environment-url> npm run test:e2e` after recovery, then record the
  result here.
