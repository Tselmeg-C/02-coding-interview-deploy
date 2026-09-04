# PairCode Interview

An online coding-interview application with a React frontend, an Express API,
and Socket.IO-based room synchronization. SQLite is the local default; the
production deployment is designed to use managed PostgreSQL.

## Full application

Install workspace dependencies once, then start frontend and backend together:

~~~bash
npm install
npm run dev
~~~

Run all automated checks with:

~~~bash
npm test
~~~

See [`docs/testing.md`](docs/testing.md) for the complete local and deployed
release gates, and [`docs/release-process.md`](docs/release-process.md) for
release and rollback.

Run the production-like stack, including Postgres, with:

~~~bash
npm run compose:up
npm run test:integration
npm run test:e2e
npm run compose:down
~~~

The frontend is available on port 5181 and the backend on port 3001. Open the
forwarded port 5181 URL in Codespaces; port 3001 is the API only.

## Browser-only code execution

JavaScript and Python run in a Web Worker in the participant's browser. Python
uses Pyodide, which downloads its runtime on the first Python execution. The
backend never executes submitted code. Use Stop to terminate an unresponsive
worker and create a fresh one.

## Frontend

~~~bash
cd frontend
npm install
npm run dev
~~~

Run frontend tests with:

~~~bash
cd frontend
npm test
~~~

## Backend

~~~bash
cd backend
npm install
npm run dev
~~~

The backend listens on port 3001 by default. Run its endpoint and real-time
integration tests with:

~~~bash
cd backend
npm test
~~~

## Database

The backend uses SQLite by default, storing its local data at
backend/data/coding-interview.sqlite3. It applies its schema migrations when
the server starts, so room state survives backend restarts.

Set DATABASE_URL to select a database explicitly:

~~~bash
DATABASE_URL=sqlite:./data/coding-interview.sqlite3 npm run dev --prefix backend
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DB_NAME npm run dev --prefix backend
~~~

Alternatively, set DB_ENGINE=postgresql with DB_NAME, DB_USER, DB_PASSWORD,
DB_HOST, and DB_PORT. See .env.example for the complete safe template.

## Container

Build the frontend and backend into one image:

~~~bash
docker build -t coding-interview .
docker run --rm -p 5181:3001 coding-interview
~~~

Open http://localhost:5181. The container serves the frontend, HTTP API, and
Socket.IO service from the same origin.

## Docker Compose and full-stack tests

`docker-compose.yaml` runs the production image with Postgres 16. It waits for
Postgres before starting the app, applies migrations on application startup,
and keeps local database data in the named `postgres-data` volume. The Compose
stack is deliberately for local development and CI; its trust-authenticated
database must not be exposed publicly.

Run the disposable PostgreSQL backup/restore check with
`npm run test:backup-restore` while the Compose stack is running. See
[`docs/database-backup-restore.md`](docs/database-backup-restore.md).

`npm run test:integration` verifies the health endpoint plus room creation,
update, and retrieval against that stack. `npm run test:e2e` uses Playwright to
create a room in one browser session and verify that an edit reaches a second
session through Socket.IO.

## Railway deployments

Railway deploys this repository using the root Dockerfile. The container reads
the platform-provided PORT environment variable and serves the frontend, API,
and Socket.IO endpoint from one public service.

Railway's public domain provides the HTTPS/WSS edge normally handled by Caddy
in a self-managed EC2 deployment, so this Railway deployment does not run a
second reverse-proxy container.

Each Railway environment must use its own Railway PostgreSQL service, not the
container's default SQLite file or another environment's database. Set each app
service's `DATABASE_URL` to the reference supplied by the PostgreSQL service in
that same environment. Railway keeps the database storage persistent and the
application creates its schema migrations at startup.

After a successful Railway deployment, use the service's generated public
domain to open the application and verify that two browser sessions can join
the same room and synchronize edits.

## Telemetry

The backend initializes OpenTelemetry before loading Express, Socket.IO, or
the database client. Automatic instrumentation covers HTTP and PostgreSQL;
manual spans and bounded counters cover room join/update events. Set
`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`, and the three
`OTEL_*_EXPORTER=otlp` settings in each Railway environment. Set
`DEPLOYMENT_ENVIRONMENT` to `development` or `production` and
`SERVICE_VERSION` to the deployed commit or Railway version. The application does
not emit room IDs, participant IDs, source code, credentials, connection
strings, or raw URLs to telemetry.

For local runs, copy `.env.example` to `.env` and fill in the OTLP endpoint and
header. The backend loads that file automatically, and Docker Compose passes it
to the app container. Restart the backend or recreate the Compose stack after
changing telemetry variables.

## CI/CD configuration

`.github/workflows/ci-cd.yml` runs backend and frontend checks in parallel,
then runs lint and type checks, builds Docker Compose, runs the Postgres
integration smoke test, and runs the two-session Playwright test. Railway
services are connected to this repository: `dev` deploys the `dev` branch and
production deploys `main`. Enable Railway **Wait for CI** so either service
deploys only after the corresponding GitHub checks pass. After each deployment,
verify health, HTTP behavior, persistence, and two-browser collaboration.

Configure the Railway GitHub integration for this repository with the `dev`
branch in development and `main` in production. Enable **Wait for CI** on both
services. Keep production restricted to protected branches and require an
approving reviewer. Store `DATABASE_URL` and telemetry secrets only in their
matching Railway environments; no credential values belong in the repository
or workflow logs.

Use [`docs/operations-runbook.md`](docs/operations-runbook.md) for the release,
rollback, incident evidence, and recovery checklist.

## Project progress

As of September 3, 2026:

- The local production-like Compose stack, backed by Postgres, has passed its
  HTTP integration smoke test and two-browser collaboration E2E test.
- GitHub Actions has successfully run the backend, frontend, Compose, and E2E
  jobs for the deployment pipeline.
- Lint and type-check gates are part of the CI dependency chain before the
  full-stack job and development deployment.
- Railway production has a dedicated app service and managed PostgreSQL
  service connected through `DATABASE_URL`.
- The production deployment passed health, room persistence, and two-browser
  collaboration checks before production automation was enabled.
