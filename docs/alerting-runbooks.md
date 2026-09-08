# Alerting and runbooks

The version-controlled alert rules are in
[`observability/alerts.yaml`](../observability/alerts.yaml).
Load them into the managed Grafana alerting system and set
`DASHBOARD_URL` to the saved PairCode dashboard URL. Keep contact points and
authentication outside the repository.

Route production alerts to the Railway receiver's `/alerts` endpoint. Configure
HMAC-SHA256 with `X-Grafana-Alerting-Signature`, set the timestamp header to
`X-Grafana-Alerting-Timestamp`, and use the receiver's
`GRAFANA_WEBHOOK_SECRET`. Keep resolved notifications enabled so resolved
alerts close their incident issues. See
[`on-call-engineer/README.md`](../on-call-engineer/README.md) for the complete
external configuration.

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

In a disposable development environment, use Grafana's contact-point test and
then temporarily lower one rule's threshold. Verify that a signed notification
returns HTTP 202, one GitHub incident opens, a repeated firing notification
does not rerun the investigation, and a resolved notification closes the
incident. A safe source fix may open a PR into `dev`; it must still pass normal
CI and review. Restore the original threshold and remove the test alert after
verification.
