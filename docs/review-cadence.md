# Security, scale, and cost reviews

Owner: `demo-owner`. Escalate security or data-loss findings to the repository
owner immediately; record all other findings as a reviewed PR or an explicit
accepted risk.

## Cadence

- Every release: verify image provenance, dependency checks, rollback digest,
  health checks, and production telemetry.
- Monthly: review alert noise, access, resource usage, image/telemetry
  retention, and open remediation items.
- Quarterly: review least privilege, private networking, secret rotation,
  dependency vulnerabilities, backup restoration, rollback, scale limits, and
  provider cost.
- Before deletion: record an owner, recovery plan, retention requirement, and
  approval. Delete only disposable non-production resources.

## Checklist

```text
reviewed_at_utc=
reviewer=demo-owner
environment=

security: least privilege, private networking, secrets, dependency findings
resilience: backup restore evidence, rollback evidence, alert delivery
observability: retention, access, missing telemetry, alert noise
scale: request/event rates, database capacity, websocket limits, next trigger
cost: Railway, Grafana, registry retention, disposable resource cleanup

finding_id=
severity=
owner=
evidence_link=
remediation_pr=
due_at_utc=
status=open|accepted|resolved
recovery_plan_before_deletion=
```

Plan load balancing or orchestration before traffic requires it; do not add it
speculatively. Remove learning/demo resources only after confirming they are
not production dependencies and recording the recovery plan. Keep provider
identifiers and credentials in the provider or GitHub settings, not here.
