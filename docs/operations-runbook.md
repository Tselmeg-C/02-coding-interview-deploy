# Release and incident operations

This is the operating path for PairCode Interview. The service owner is
`demo-owner`; the human escalation route is the repository owner and the
protected GitHub `production` environment.

## Release

1. Merge the reviewed change into `dev` and wait for backend, frontend, lint,
   type-check, Compose/PostgreSQL integration, and two-browser checks.
2. Confirm the development deployment health check and record the image tag,
   full `sha256:` digest, commit, and UTC deployment time.
3. Observe development in Grafana for one normal traffic window. Filter the
   PairCode dashboard by `deployment_environment_name` and `service_version`.
4. Run the production promotion workflow with the exact tag or digest. It
   verifies that the same digest is running in development and waits for the
   protected production approval.
5. Verify `/health`, room creation/update/retrieval, persistence after an app
   restart, and the two-browser collaboration check in production.

Never rebuild during promotion, use `latest`, share a `DATABASE_URL`, or point
production at development PostgreSQL.

## Rollback

Use the same promotion workflow with `action=rollback` and a recorded good
image tag or full digest. The workflow verifies the digest in development,
requires production approval, deploys that exact image, and checks `/health`.
Then rerun the production integration and two-browser checks. Database
restoration is separate; use [`database-backup-restore.md`](database-backup-restore.md)
only under an approved recovery plan.

## Incident response

Start with the alert and record:

```text
incident_id=
started_at_utc=
service=paircode-interview
environment=
version_or_digest=
alert=
dashboard_url=${DASHBOARD_URL}
trace_or_log_link=
user_impact=
first_action=
owner=demo-owner
escalated_to=
resolved_at_utc=
```

Follow [`alerting-runbooks.md`](alerting-runbooks.md). Capture the alert,
dashboard panel, trace, redacted log, deployment, rollback or fix PR, and
resolution. Do not capture room IDs, participant IDs, source code, URLs with
credentials, or secret values.

After recovery, add a regression test for the confirmed cause, rerun the full
release gate, and link the test and PR from the incident record. Confirm the
alert acknowledged, deduplicated, and resolved.

## Restore and cleanup

Run the restore exercise in an isolated target and record its backup identity,
restore time, target, verification result, and cleanup owner. Remove temporary
restore databases, test alerts, disposable services, and temporary image tags
after evidence is captured. Keep production resources and managed backups
outside disposable cleanup commands.
