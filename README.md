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

`npm run test:integration` verifies the health endpoint plus room creation,
update, and retrieval against that stack. `npm run test:e2e` uses Playwright to
create a room in one browser session and verify that an edit reaches a second
session through Socket.IO.

## Railway deployment

Railway deploys this repository using the root Dockerfile. The container reads
the platform-provided PORT environment variable and serves the frontend, API,
and Socket.IO endpoint from one public service.

Railway's public domain provides the HTTPS/WSS edge normally handled by Caddy
in a self-managed EC2 deployment, so this Railway deployment does not run a
second reverse-proxy container.

Production must use a Railway PostgreSQL service, not the container's default
SQLite file. Create a PostgreSQL service in the same Railway environment, then
set the app service's `DATABASE_URL` to the reference supplied by Railway for
that PostgreSQL service. Railway keeps the database storage persistent and the
application creates its schema migrations at startup.

Live application: https://coding-interview-production-d138.up.railway.app/

After a successful Railway deployment, use the service's generated public
domain to open the application and verify that two browser sessions can join
the same room and synchronize edits.

## CI/CD configuration

`.github/workflows/ci-cd.yml` runs backend and frontend checks in parallel,
then builds Docker Compose, runs the Postgres integration smoke test, and runs
the two-session Playwright test. A push to `main` deploys only after those
checks pass and verifies `/health` afterwards.

Before enabling the deployment job, configure these GitHub repository values:

The workflow uses the GitHub environment named `helpful-intuition / production`.
This GitHub configuration scope is separate from the Railway environment named
by `RAILWAY_ENVIRONMENT`.

- Secret: `RAILWAY_API_TOKEN` — a Railway account or workspace token. Prefer
  workspace scope when Railway offers that choice.
- Variables: `RAILWAY_PROJECT_ID`, `RAILWAY_SERVICE`,
  `RAILWAY_ENVIRONMENT`, and `RAILWAY_PUBLIC_URL` — the Railway project ID,
  existing app service, production environment, and public base URL
  respectively.

The workflow also accepts these four deployment identifiers as environment
secrets when the GitHub environment UI does not expose them through the
variables context. The values are not credentials, but this fallback avoids
blocking deployment because of GitHub environment-variable scope behavior.

No credential values belong in the repository, GitHub variables, command
output, or documentation. The workflow invokes Railway's CI mode and uses the
configured service and environment explicitly.

## Project progress

As of September 1, 2026:

- The application is publicly available at the Railway domain above.
- The local production-like Compose stack, backed by Postgres, has passed its
  HTTP integration smoke test and two-browser collaboration E2E test.
- GitHub Actions has successfully run the backend, frontend, Compose, and E2E
  jobs for the deployment pipeline.
- Continuous deployment is not yet verified: the Railway CLI job received no
  GitHub deployment values, so it could not select a Railway project and the
  post-deploy public health check was skipped. Add the exact secret and
  variables named in the CI/CD section to the GitHub
  `helpful-intuition / production` environment, then rerun the workflow before
  treating this pipeline as active production CD.
- Commit `747a878` adds a fallback that accepts the deployment identifiers as
  GitHub environment secrets as well as variables. Its GitHub Actions run
  passed every CI, Railway deployment, and public health-check job.
- Public browser verification passed: two independent browser sessions created
  and joined a Railway-hosted room, then synchronized an editor update.
