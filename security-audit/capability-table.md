# Responder capability inventory

| Capability | Data access | Network/command access | Credential | Owner | Approval |
| --- | --- | --- | --- | --- | --- |
| Read incident record | Incident metadata and redacted evidence only | None | None | Operations | Policy level |
| Collect allowlisted evidence | `/health` and fixed evidence files | HTTPS GET only; no shell | None | Operations | Observe |
| Write investigation record | Secret-free decision metadata | Filesystem output only | None | Operations | Propose |
| Run recovery check | Public `/health` response | HTTPS GET only; no shell | None | Operations | Human approval |
| Roll back production | Release tag/digest only | GitHub workflow dispatch | GitHub/Railway workflow secret, never exposed to responder | Release owner | Human approval |

The responder never receives participant code, credentials, database contents, or
an unrestricted command channel. Security, privacy, data-loss, production
deployment, infrastructure changes, and repeated failures escalate to a human.
