# Alerting and runbooks

The version-controlled alert rules are in
[`observability/alerts.yaml`](../observability/alerts.yaml).
Load them into the managed Grafana alerting system and set
`DASHBOARD_URL` to the saved PairCode dashboard URL. Keep contact points and
authentication outside the repository.

Every notification must retain the alert name, service, environment, version,
owner, severity, dashboard URL, user impact, first action, and escalation
message from the rule annotations. Group by service, environment, alert name,
and version; repeat notifications no more than once every 15 minutes.

## Response

### Room errors

Check the room event rate by operation and result, then inspect the matching
trace and redacted application log. If the error follows a release, revert the
release through a reviewed PR or redeploy the previous successful Railway
deployment. Do not change either environment's database connection during an
application rollback.

### High room-update latency

Check the p95 panel, database traces, and Railway resource health. Verify the
health endpoint and run the integration check against the affected environment.
If latency remains high after confirming database health, roll back the image
and escalate to the service owner.

### Missing telemetry

Confirm the service is running, then verify the OTLP endpoint, TLS, exporter
settings, and Railway secret without printing the secret. Treat a healthy
application with missing telemetry as an operational incident because failures
cannot be observed.

### Service down

Open `/health`, inspect the Railway deployment and managed PostgreSQL service,
and check the latest deployment logs. If the app is unhealthy, revert the
release or redeploy the previous successful Railway deployment. Database
restoration is a separate reviewed operation; never point production at
development PostgreSQL.

## Safe verification

In a disposable development environment, temporarily lower one rule's
threshold or use a synthetic test alert in Grafana. Verify that one grouped
notification reaches the accountable responder, acknowledgement suppresses
duplicates, resolution closes the notification, and the alert links to the
dashboard and this runbook. Restore the original threshold and remove the test
alert after verification.
