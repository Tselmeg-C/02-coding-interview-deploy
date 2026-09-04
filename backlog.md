# Production operations backlog

This is the delivery backlog for production-grade DevOps and observability for
PairCode Interview. It adapts [DevOps and Observability for an AI-Built App](https://aishippingblog.com/p/devops-and-observability-for-an-ai)
to the existing Node/React/Socket.IO app, Docker Compose, Railway, and managed
PostgreSQL setup. Complete issues in dependency order. Every implementation
issue requires tests, documentation, a concise commit, and a reviewed PR.

## Railway CD decision

Railway's native GitHub-source deployment is the chosen CD path. Connect
development to `dev` and production to `main`, enable Railway **Wait for CI**,
and use protected pull requests as the release gate. The GHCR build-once and
manual digest-promotion work described in Issues 3 and 4 is superseded; do not
add registry or digest configuration for this project.

## Team workflow

- `main` is production-ready and protected: no direct pushes; require passing
  CI and a review.
- `dev` is the integration branch. Changes arrive through short-lived feature
  branches and PRs; a validated `dev` commit deploys to development.
- Production is changed only through a reviewed release PR from `dev` to
  protected `main`; Railway deploys the connected source after CI and its
  production approval gate.
- Use independent Railway `development` and `production` environments, each
  with its own app service, managed PostgreSQL service, public URL, and
  telemetry credentials.
- Keep Railway credentials and environment values in Railway's project
  configuration or its GitHub integration. Never commit, print, or request
  secret values.
- The backend must never execute participant-provided code. Browser Web
  Workers remain the only execution environment.

## Milestone 0 — repository and release controls

### Issue 1 — Create environment and branch-protection baseline

**Labels:** `platform`, `priority:high`, `type:chore`

Create protected GitHub environments `development` and `production`; require
production approval. Protect `main` and `dev` with required pull-request
reviews and successful CI checks. Document owners and escalation contacts.

**Acceptance criteria:** Direct pushes are rejected; an approved PR is needed
to change either branch; production job cannot run without environment review.

### Issue 2 — Split Railway into independent development and production stacks

**Depends on:** #1  
**Labels:** `platform`, `priority:high`, `type:infra`

Create isolated Railway application services and managed PostgreSQL databases
for development and production. Set each app's own Railway-provided
`DATABASE_URL`; verify development can never connect to production. Use
different public URLs and `DEPLOYMENT_ENVIRONMENT` values.

**Acceptance criteria:** Both environments pass `/health`, room creation, and
two independent browser sessions synchronizing an edit. No SQLite production
storage or shared database is used.

### Issue 3 — Replace source deploys with build-once immutable images

**Status:** Superseded by the Railway CD decision above.

**Depends on:** #1, #2  
**Labels:** `platform`, `priority:high`, `type:ci`

Add a registry-backed image build job. Tag images
`YYYYMMDD-HHMMSS-shortsha`, retain their digest, and deploy that published
image to development. Record tag, digest, commit, and deployment time.

**Acceptance criteria:** A development deployment identifies its image digest;
CI separates build from deploy; the build fails before any deploy begins.

### Issue 4 — Add approved production promotion and rollback workflows

**Status:** Superseded by the Railway CD decision above.

**Depends on:** #3  
**Labels:** `platform`, `priority:high`, `type:ci`

Add `workflow_dispatch` promotion that accepts an image tag/digest, verifies it
is running in development, requires production approval, and deploys that same
digest. Add a similarly approval-gated rollback to a recorded good digest.

**Acceptance criteria:** Production never rebuilds from source or deploys
`latest`; the current and previous version can be identified and restored.

## Milestone 1 — telemetry foundation

### Issue 5 — Instrument HTTP, Socket.IO, database, logs, and traces with OTel

**Depends on:** #2  
**Labels:** `observability`, `priority:high`, `type:feature`

Export OTLP metrics, structured logs, and traces from Express and Socket.IO.
Cover HTTP room APIs, collaboration events, database operations, latency, and
failures. Resource attributes on every signal: `service.name`,
`deployment.environment.name`, and `service.version` (image tag/digest or
commit).

**Acceptance criteria:** An exercised request appears as a metric, trace, and
correlated log. Do not use room IDs, participant IDs, raw URLs, or request IDs
as metric labels; redact source code, credentials, connection strings, and
participant content from logs.

### Issue 6 — Deploy authenticated observability infrastructure

**Depends on:** #5  
**Labels:** `observability`, `priority:high`, `type:infra`

Choose and document either an OTLP-compatible managed service (preferred for
Railway) or a separate self-managed `observability/` Compose project containing
OTel Collector, Prometheus, Loki, Tempo, and Grafana. The app and the platform
must be independently deployable.

**Acceptance criteria:** Both environments export to authenticated TLS
endpoints. If self-managed, collector routes metrics/logs/traces to
Prometheus/Loki/Tempo and Grafana reads those stores. Restrict network access,
configure retention/storage limits, and version-control secret-free dashboard
and alert provisioning.

### Issue 7 — Add application metrics and a version-filterable dashboard

**Depends on:** #5, #6  
**Labels:** `observability`, `priority:high`, `type:feature`

Define event boundaries and metrics documentation, then collect: rooms created,
active participants, canvas elements created, component-creation failures,
HTTP/WebSocket latency and errors, and change-propagation delay. Use bounded
dimensions only (`environment`, `version`, route/event, status class, and
bounded failure class).

**Acceptance criteria:** Grafana filters by environment and deployed version;
two-browser activity visibly changes the appropriate panels without retries or
reconnects double-counting events.

## Milestone 2 — detection and response

### Issue 8 — Build actionable alerting and runbooks

**Depends on:** #7  
**Labels:** `observability`, `priority:high`, `type:feature`

Create sustained, baseline-informed alerts for repeated component-creation
failures, health failures, elevated error rate/latency, missing telemetry, and
database connectivity. Every alert must name service, environment, deployed
version, owner, severity, dashboard URL, user impact, first action, and human
escalation route.

**Acceptance criteria:** A controlled test alert reaches the accountable
responder with grouping/deduplication/acknowledgement/resolution tested. Each
alert has a runbook with dashboard queries, trace/log lookup, rollback, and
escalation conditions.

### Issue 9 — Add a bounded AI on-call proof of concept

**Depends on:** #8  
**Labels:** `on-call`, `priority:medium`, `type:feature`

Add `on-call-engineer/` that deduplicates alerts and polls at most once per
minute (prefer webhook/event delivery in production). It starts a short-lived,
isolated coding-agent job with alert details, a repository checkout, redacted
logs, and read-only observability access. Persist job logs and terminate the
job when complete.

**Acceptance criteria:** The agent investigates and reproduces a fault. For a
real bug it creates a smallest-possible, tested, reviewable PR; for a false
positive it changes no code and explains why. It cannot access secrets, deploy,
alter infrastructure, or execute participant code. Security, data-loss,
privacy, outage, repeated failure, and out-of-runbook events escalate directly
to a human.

### Issue 10 — Exercise the full incident lifecycle safely

**Depends on:** #9  
**Labels:** `on-call`, `priority:medium`, `type:test`

Introduce a safe, reproducible component-creation fault only in a disposable
development/test environment. Verify telemetry, alert, agent investigation,
fix proposal, tests, review, promotion, and resolution. Remove the fault.

**Acceptance criteria:** Evidence links from alert to dashboard, trace, logs,
PR, and resolution are captured. No test fault or development data remains in
production.

## Milestone 3 — operational resilience

### Issue 11 — Implement and test database backup restoration

**Depends on:** #2  
**Labels:** `platform`, `priority:high`, `type:infra`

Configure managed-Postgres backups outside disposable app infrastructure,
retain multiple independent copies, and regularly restore into an isolated
environment.

**Acceptance criteria:** A documented restore exercise proves that recovered
data is usable without touching production.

### Issue 12 — Add release, rollback, and incident operating documentation

**Depends on:** #4, #7, #8, #11  
**Labels:** `docs`, `priority:medium`, `type:chore`

Document release gate, exact-digest promotion, post-deploy health and
two-browser verification, initial version-filtered observation period,
rollback, incident evidence capture, post-incident regression tests, owners,
and cost/resource cleanup.

**Acceptance criteria:** An engineer unfamiliar with the setup can deploy,
diagnose, roll back, and restore from the documentation alone.

### Issue 13 — Perform recurring security, scale, and cost reviews

**Depends on:** #12  
**Labels:** `platform`, `priority:medium`, `type:chore`

Schedule reviews of least privilege, private networking, alert noise,
telemetry/image retention, backup restores, rollback, dependencies, and
security findings. Plan load balancing/container orchestration before traffic
demands it. Remove non-production learning/demo resources and verify deletion
in the provider console.

**Acceptance criteria:** Owners, cadence, findings, and remediation PRs are
tracked; no resource is deleted without an approved recovery plan.

## Milestone 4 — operations and security report

These follow-ups cover the remaining deliverables from the 2026 DevOps lesson:
bounded evidence, responder authorization, security audit, and a final
secret-free reconstruction of a production incident.

### Issue 14 — Add bounded incident evidence and response controls

**GitHub:** [#49](https://github.com/Tselmeg-C/02-coding-interview-deploy/issues/49)
**Depends on:** #8, #9, #10
**Labels:** `on-call`, `priority:high`, `type:feature`

Add the `incident-response/` evidence collector, responder task, structured
response schema, autonomy policy, rollback/recovery runbooks, and incident
records. Evidence queries must be allowlisted and bounded, with redaction and
human escalation enforced outside the model.

**Acceptance criteria:** One incident ID reconstructs alert, evidence,
model/configuration, proposed action, policy decision, executed command, and
recovery or escalation without secrets, participant content, source code, or
credential-bearing URLs. A disposable test covers evidence collection, policy
denial, escalation, and recovery verification.

### Issue 15 — Add responder security audit and capability inventory

**GitHub:** [#50](https://github.com/Tselmeg-C/02-coding-interview-deploy/issues/50)
**Depends on:** #14
**Labels:** `platform`, `priority:high`, `type:chore`

Add the `security-audit/` brief, deterministic Semgrep or approved-equivalent
scan, findings schema and runs, and a capability/credential/provenance table.
Require human validation and remediation tracking for security, privacy,
data-loss, and repeated-failure findings.

**Acceptance criteria:** Every responder capability and credential has a least-
privilege owner. Findings include severity, evidence, disposition, owner,
remediation PR, and due date. Audit artifacts are secret-free.

### Issue 16 — Publish operations and security report with final production evidence

**GitHub:** [#51](https://github.com/Tselmeg-C/02-coding-interview-deploy/issues/51)
**Depends on:** #14, #15
**Labels:** `docs`, `priority:medium`, `type:chore`

Publish `docs/operations-and-security-report.md` linking observability,
alerting, incident response, security audit, release, rollback, backup, and
final production verification evidence.

**Acceptance criteria:** The report identifies deployed version, user impact,
alert, evidence, model/configuration, proposed action, policy decision,
executed command, recovery verification, and security disposition. It records
the final production health, HTTP integration, persistence, two-browser,
image-digest, deployment-time, and rollback-readiness evidence without secrets.

## Definition of done for every backlog item

1. Work on a short-lived branch from `dev` (or `main` only for release-control
   changes) named `type/issue-number-short-description`.
2. Add or update unit, integration, and/or two-browser E2E coverage in
   proportion to the change. Deployment changes must run the full local release
   gate: `npm test`, `npm run compose:up`, `npm run test:integration`,
   `npm run test:e2e`, then `npm run compose:down`.
3. Update docs and safe configuration templates. Keep frontend transports in
   `frontend/src/services/`.
4. Create a concise commit, open a PR into the appropriate protected branch,
   link the issue, obtain review, and wait for CI.
5. Merge only after checks and approvals pass; verify the environment required
   by the issue and record the deployed digest/version.
