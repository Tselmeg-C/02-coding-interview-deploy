# AI Usage Report

## Purpose

This report records how AI assistance was used while building PairCode
Interview, including the review and verification applied to the generated work.

## AI-assisted tasks

| Area | AI-assisted work | Human review and verification |
| --- | --- | --- |
| Product planning | Structured the product specification, acceptance criteria, non-goals, and technical constraints. | Reviewed scope and kept accounts, persistence, video, and server-side code execution out of the first release. |
| Frontend | Created the React/Vite prototype, centralized room service boundary, CodeMirror editor, and UI states. | Ran the frontend locally and verified room creation, sharing, language selection, and visual behavior. |
| API and backend | Defined the OpenAPI contract, Express routes, in-memory store, and Socket.IO room protocol. | Ran endpoint tests and two-client Socket.IO synchronization tests. |
| Browser execution | Added JavaScript and Python Web Worker runners and Pyodide integration. | Confirmed Python execution in the browser and verified the backend never receives code for execution. |
| Containerization and deployment | Created the multi-stage Dockerfile, Docker Compose stack, Postgres readiness checks, and same-origin production serving arrangement. | Built the Compose stack, verified container health, and ran the Postgres integration smoke test. |
| End-to-end testing and CI/CD | Added a Playwright two-session collaboration test and GitHub Actions gates for unit, integration, E2E, deployment, and post-deploy health verification. | Ran the two-browser test locally against Compose. The hosted workflow has passed backend, frontend, Compose, and E2E jobs; its Railway deployment job lacked GitHub configuration values and must be rerun after they are added. |
| Documentation | Maintained local setup, test, container, deployment, and homework-answer documentation. | Reviewed commands against the project scripts and deployment approach. |

## Verification commands

~~~bash
npm test
npm run build --prefix frontend
docker build -t coding-interview .
docker run --rm -p 5181:3001 coding-interview
docker compose up --build --wait
npm run test:integration
npm run test:e2e
~~~

## Deployment status handoff

The local Compose stack and the hosted backend, frontend, integration, and E2E
CI jobs have passed. Earlier hosted deployment attempts stopped before Railway
deployment because GitHub did not inject `RAILWAY_PROJECT_ID` into the job.
Commit `747a878` accepts deployment identifiers from environment secrets as a
fallback. Its workflow has passed, including Railway deployment and public
health verification. A subsequent Playwright run against the public Railway
domain passed the two-browser collaboration journey; see
`docs/deployment-handoff.md` for the final state.

## Limitations and follow-up work

- Local development defaults to SQLite; the Railway production service must be
  configured with its managed PostgreSQL `DATABASE_URL` before production use.
- The collaboration implementation uses last-write-wins updates, not CRDT or
  operational-transform conflict resolution.
- Pyodide downloads in the participant's browser on first Python execution and
  requires network access to its configured runtime CDN.
- Browser Workers isolate code from the application UI and server, but are not
  a substitute for a hardened multi-tenant remote execution sandbox.
- Production observability, alerting, release environments, and incident
  response are future operational work.
- Railway CI configuration and authentication must be verified with a
  successful deployment and public health check before automatic deployment is
  considered complete.
