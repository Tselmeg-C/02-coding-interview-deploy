# Agent instructions

- Work only within this 02-coding-interview project directory.
- Read product-spec.md before changing product behavior.
- Keep frontend transport calls behind frontend/src/services/.
- Do not execute user-provided code on the backend.
- Run the relevant tests before committing a completed workflow phase.
- Make a concise local Git commit after each verified phase. Do not push unless
  explicitly asked.
- Implementation phases must use short-lived branches from `dev` and open a
  pull request back into `dev`. Do not stack implementation phase PRs directly
  onto `main`.
- Merge phases into `dev` only after required checks and review pass. Promote
  the exact verified immutable image from `dev` to `main` through the protected
  production workflow; never bypass branch protection or push directly to
  `dev` or `main`.
- For deployment work, keep the app and Postgres runnable through Docker
  Compose; add an integration check and a two-browser end-to-end check before
  enabling deployment automation.
- Railway production deployments must use the managed PostgreSQL service via
  `DATABASE_URL`. Keep the Railway account/workspace token in the GitHub
  `RAILWAY_API_TOKEN` secret and deployment identifiers in GitHub variables;
  never commit credential values.
