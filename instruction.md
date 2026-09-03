# Production operations workflow

This is the executable operating workflow for PairCode Interview. It adapts
Alexey Grigorev's ["DevOps and Observability for an AI-Built App"](https://aishippingblog.com/p/devops-and-observability-for-an-ai)
to this repository and its Railway deployment. Follow the phases in order. A
phase is complete only when its verification commands pass, its documentation
is updated, and its changes are committed locally.

## Operating rules

- Keep `main` continuously deployable. Pull requests must pass backend,
  frontend, Compose/Postgres integration, and two-browser E2E checks before
  merge.
- Treat development and production as independent environments. A validated
  push to `dev` deploys development; a validated push to `main` waits for the
  protected production-environment approval before deploying production.
  Phase 2 replaces these source deployments with exact-digest promotion.
- Build once, deploy the resulting immutable image many times. Never rebuild
  source code during promotion.
- The Railway production application must use the managed PostgreSQL service
  through `DATABASE_URL`. Do not substitute a container SQLite file.
- Do not put telemetry backends, Grafana, databases, credentials, or tokens on
  the public internet without authentication and network restrictions.
- Never commit, echo, or add a credential to documentation. Keep the Railway
  account/workspace token only in GitHub's `RAILWAY_API_TOKEN` secret; store
  Railway IDs and public URL in GitHub variables.
- The backend must never run participant-provided code. Browser Web Workers
  remain the only code-execution location.

## Phase 0 — establish the release baseline

1. Read `product-spec.md`, `AGENTS.md`, `README.md`, and
   `docs/deployment-handoff.md`. Confirm the intended release behaviour before
   changing it.
2. Record the commit SHA, current production image/version, Railway service,
   environment, database service, public URL, dashboard URL, and responsible
   owner in the deployment handoff. Store identifiers, not secret values.
3. Run the current local release gate:

   ```bash
   npm test
   npm run compose:up
   npm run test:integration
   npm run test:e2e
   npm run compose:down
   ```

4. Ensure `docker compose down` also runs after a failed check. In CI use an
   `always()` cleanup step.
5. Commit only if the baseline documentation itself changed.

**Exit criterion:** a new contributor can run the same image with Postgres,
pass the HTTP smoke test, and prove real-time synchronization between two
independent browser sessions.

## Phase 1 — split development and production

1. Create an independent Railway development environment/service and managed
   PostgreSQL database. Keep production's app and database separate. Use
   distinct public URLs and telemetry resource attributes.
2. Configure each app service with its own Railway-provided `DATABASE_URL`.
   Confirm that no development connection string targets production.
3. Reuse the Dockerfile and configuration structure, varying only explicit
   environment-specific values such as sizing, URL, `DEPLOYMENT_ENVIRONMENT`,
   and telemetry endpoint/credentials.
4. Change CI/CD semantics:

   - Pull requests run the complete release gate without deploying.
   - A successful push to `dev` deploys to development.
   - A successful push to `main` runs the same gate, waits for approval through
     the protected GitHub `production` environment, and deploys production.
   - Protect the GitHub production environment with required reviewer
     approval. The documented single-owner demo exception may satisfy this
     gate only after every automated check passes.
   - Treat this as a transitional source-deployment baseline. Issue #3 and
     Phase 2 replace it with build-once immutable images before exact-digest
     promotion and rollback are enabled.

5. In each environment, run `/health`, create a room, join it from two
   browsers, and synchronize an edit.

**Exit criterion:** `dev` changes development only; `main` can alter production
only after the full release gate and an explicitly recorded production
approval.

## Phase 2 — make releases immutable

1. Add a `build-image` CI job before deployment. It must build the root
   `Dockerfile`, run the release gate, and push the image to a container
   registry that Railway can pull from.
2. Tag every image with a timestamp and source revision in this format:

   ```text
   YYYYMMDD-HHMMSS-shortsha
   ```

   Also record the immutable image digest. The digest, rather than a mutable
   tag, is the authoritative promoted artifact.
3. Make the development deploy job pull/deploy that published image. Record
   its tag, digest, commit SHA, and deployment time as the deployed version.
4. Have the manual production workflow accept the already-tested development
   tag/digest and deploy exactly that artifact. It must verify that the
   requested digest is the one currently running in development before
   proceeding.
5. Add a rollback input/workflow that redeploys a prior known-good digest. Do
   not roll back by rebuilding an old branch.

**Exit criterion:** development and production report the same image digest
for a promoted release, and a previous digest can be restored deliberately.

## Phase 3 — instrument application and runtime telemetry

1. Instrument the Express and Socket.IO backend with OpenTelemetry. Export
   metrics, logs, and traces using OTLP; use supported library instrumentation
   where possible and add manual spans only around meaningful application work.
2. Attach these resource attributes to every signal:

   ```text
   service.name=paircode-interview
   deployment.environment.name=<development|production>
   service.version=<image-tag-or-commit>
   ```

   Avoid high-cardinality values (room IDs, participant IDs, request IDs, or
   raw URLs) as metric labels. They belong in traces/logs when needed, with
   privacy review.
3. Ensure request traces cover HTTP room APIs and real-time collaboration
   events, including database calls and failures. Log structured errors with
   trace/span correlation IDs; do not log source code, auth data, full
   connection strings, or participant content unless it is explicitly approved
   and redacted.
4. Provide a liveness/readiness health signal independent from telemetry:

   ```bash
   curl --fail --show-error "$APP_URL/health"
   ```

5. Test locally by exercising the app, then confirm an HTTP request appears as
   a metric, trace, and correlated log entry in the chosen backend.

**Exit criterion:** an operator can filter every signal by environment and
deployed version, then move from an error metric to its trace and relevant log.

## Phase 4 — deploy a private observability platform

Choose one supported architecture and document its endpoints, retention,
access owner, and costs.

- **Managed (preferred for Railway):** use an OTLP-compatible managed service
  such as Grafana Cloud, Datadog, Sentry, or the platform's compatible
  offering. Configure authenticated OTLP export through Railway secrets.
- **Self-managed:** create a separate `observability/` Compose project with an
  OpenTelemetry Collector, Prometheus (metrics), Loki (logs), Tempo (traces),
  and Grafana (dashboards). Deploy it separately from the app stack; connect
  both app environments to the collector.

For either architecture:

1. Use TLS, authentication, least-privilege credentials, private networking or
   IP restrictions, and non-public database/storage endpoints.
2. Send application OTLP to the collector/service. Route metrics to Prometheus,
   logs to Loki, and traces to Tempo when self-managed; Grafana reads those
   stores rather than the application directly.
3. Set retention and storage limits deliberately. Back up dashboard and alert
   configuration as version-controlled, secret-free provisioning files.
4. From both development and production, create a room and an edit, then
   verify telemetry reaches the correct environment filter.

**Exit criterion:** authenticated operators can view telemetry for both
environments without exposing the observability stack publicly.

## Phase 5 — measure user-impacting behaviour

Create counters, gauges, and histograms that answer operational questions;
document their names, units, labels, and expected cardinality beside the
instrumentation. Start with these metrics:

| Measurement | Type | Safe dimensions |
| --- | --- | --- |
| Interview rooms created | counter | environment, version |
| Connected active participants | up/down counter or gauge | environment, version |
| Canvas elements created | counter | environment, version, element type if bounded |
| Component-creation failures | counter | environment, version, bounded failure class |
| HTTP/WebSocket latency and errors | histogram/counter | environment, version, route/event name, status class |
| Change-propagation delay | histogram | environment, version |

1. Define an event boundary before instrumenting each metric so retries and
   reconnects cannot double-count it.
2. Create a version-controlled Grafana dashboard. Include overview panels for
   traffic, errors, latency, resources, rooms, active participants, elements,
   failures, and propagation delay.
3. Add dashboard variables for `environment` and `service.version` so a
   production incident can be compared to development and to the previous
   version.
4. Locally create a room and canvas element, join it in a second browser, and
   verify that the relevant dashboard values change. Repeat after deployment.

**Exit criterion:** the dashboard shows real, correctly attributed activity
from both browser sessions and can distinguish a release regression from a
traffic change.

## Phase 6 — alert on actionable symptoms

1. Define alerts only for a condition with an owner, a user impact, a first
   diagnostic action, and an escalation route. Use sustained thresholds to
   avoid noise.
2. Begin with an alert for repeated component-creation failures. Its labels
   and annotations must include service, environment, deployed version, owner,
   dashboard URL, severity, a plain-language symptom, and the first response
   step.
3. Add complementary alerts for sustained health-check failures, elevated
   error rate, excessive latency, missing telemetry, and database connectivity
   failures. Establish thresholds from observed baselines; do not copy them
   blindly between environments.
4. Route production alerts to the human on-call path first. Test every route
   with a controlled, non-destructive test alert; verify deduplication,
   grouping, acknowledgement, and resolution behaviour.
5. Link each alert to a short runbook with dashboard queries, trace/log lookup,
   rollback procedure, owner, and escalation conditions.

**Exit criterion:** a test alert reaches an accountable responder with enough
context to begin investigation, and the runbook works without tribal knowledge.

## Phase 7 — bounded AI on-call proof of concept

Automated diagnosis must be isolated and must not have unrestricted production
credentials or direct production mutation authority.

1. Add `on-call-engineer/` with a scheduler/worker that polls the alert API at
   most once per minute, deduplicates firing alerts, and records each handling
   attempt. Prefer alert webhooks/event delivery over polling in a production
   design.
2. When an alert fires, start a short-lived, isolated coding-agent job with
   only the alert payload, read-only observability access, a checked-out
   repository, and redacted logs. Save job logs and terminate the compute when
   it finishes.
3. Use this task contract:

   ```text
   You are the on-call engineer for this repository. An alert just fired.

   Investigate the root cause. Read the code and reproduce the failure.
   If you find a real bug, make the smallest correction, run the backend tests,
   and commit the fix with a clear message.

   If the alert is a false positive, explain why and do not change the code.
   ```

4. For production, change "commit the fix" to "open a reviewable branch or
   pull request". A human must approve CI and the manual promotion; the agent
   must not deploy, alter infrastructure, access secrets, or execute
   participant-provided code.
5. Escalate immediately to a human for security incidents, data loss/corruption,
   privacy exposure, unavailable production, repeated agent failure, or any
   action outside the runbook.
6. Introduce one safe, reproducible fault in a disposable development/test
   environment. Confirm the metric, alert, agent investigation, proposed fix,
   tests, review gate, and resolution lifecycle. Remove the fault afterwards.

**Exit criterion:** the agent produces a contained, auditable investigation
and a human-controlled fix proposal; it has no path to make an unreviewed
production change.

## Phase 8 — release and incident loop

For every release:

1. Run the Phase 0 release gate and inspect the development deployment.
2. Confirm development telemetry, dashboards, and no relevant firing alerts.
3. Record the exact image digest/version approved for production.
4. Manually promote it; verify `/health`, a room lifecycle, and two-browser
   synchronization in production.
5. Watch the version-filtered production dashboard during the agreed initial
   observation period. If user impact appears, use the documented rollback
   workflow to redeploy the prior digest, then investigate.
6. After an incident, preserve alert/trace/log links, write the root cause and
   remediation, tune the alert if necessary, and add a regression test.

## Periodic production hardening

- Restore a database backup into an isolated environment and prove it is
  usable. Keep backups independent of disposable application infrastructure
  and maintain more than one independent copy.
- Review least privilege, network exposure, telemetry retention, dashboard and
  alert ownership, image retention, and alert noise monthly.
- Use managed Postgres with tested backups; use managed/container orchestration
  suitable for scaling instead of relying on ad-hoc shell deployment to an
  instance.
- Test rollback periodically, including the version attribution seen in
  telemetry after rollback.
- Audit dependencies and application/infrastructure security repeatedly with
  independent review; remediate findings through the normal tested release
  path.
- Remove learning/demo cloud resources and verify deletion in the provider
  console to avoid surprise cost. Do not delete a production resource without
  an approved recovery plan.
