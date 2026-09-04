# Operations and security report

This report is the final evidence index for [Issue #51](https://github.com/Tselmeg-C/02-coding-interview-deploy/issues/51).
The incident-response controls are in [PR #52](https://github.com/Tselmeg-C/02-coding-interview-deploy/pull/52),
and the security-audit controls are in [PR #55](https://github.com/Tselmeg-C/02-coding-interview-deploy/pull/55).

## Evidence index

- Deployment and release: [`release-process.md`](release-process.md)
- Testing: [`testing.md`](testing.md)
- Observability: [`observability.md`](observability.md)
- Alerting: [`alerting-runbooks.md`](alerting-runbooks.md)
- Incident response: [`../incident-response/`](../incident-response/)
- Security audit: [`../security-audit/`](../security-audit/)
- Backup and restore: [`database-backup-restore.md`](database-backup-restore.md)

## Final production record

| Field | Final record |
| --- | --- |
| Incident or release ID | Production workflow `33730733908` |
| Deployed version or digest | Commit `5fa2105`; image `sha256:ed9d6c98ce7578fff12636fb55f4ee0b9a29a1278699f6089a77f9ff33509ce5` |
| Deployment time | 2026-09-03 08:00 UTC; workflow completed successfully |
| User impact | None observed; production health, room persistence, and two-browser collaboration passed |
| Alert | No production alert; release verification was the control |
| Evidence | [successful production workflow](https://github.com/Tselmeg-C/02-coding-interview-deploy/actions/runs/33730733908), [deployment history](deployment-history.md), [release process](release-process.md) |
| Model and configuration | Bounded responder policy in [`autonomy-policy.yaml`](../incident-response/autonomy-policy.yaml); production actions require human approval |
| Proposed action | Promote the verified immutable image; use the recorded digest for rollback if required |
| Policy decision | Allowed after protected production-environment approval |
| Executed command | `production-release.yml`, `action=promote`, exact image digest |
| Recovery verification | `/health`, room create/update/retrieve, persistence after restart, and two-browser synchronization passed |
| Security finding and disposition | Responder capabilities are documented in [`security-audit/`](../security-audit/); artifacts are secret-free and security/privacy/data-loss findings remain human-reviewable |
| Rollback ready | Yes; [`rollback.sh`](../incident-response/runbooks/rollback.sh) accepts only an immutable tag or full digest and requires human approval |

Do not record secrets, participant content, source code, credential-bearing
URLs, or raw credentials in this report.
