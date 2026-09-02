# Repository governance

This document implements the repository-controls portion of
[`backlog.md`](../backlog.md) Issue #1. It is intentionally secret-free.

## Branch model

| Branch | Purpose | Deployment target |
| --- | --- | --- |
| `main` | Release-ready code, updated only through a release PR from `dev` | Production, only through approved manual promotion of the tested image digest |
| `dev` | Integration branch, updated through reviewed feature PRs | Development after CI passes |
| `type/issue-number-summary` | Short-lived implementation branch from `dev` | None directly |

Feature PRs target `dev`. A release PR targets `main`. Required CI contexts
are `backend`, `frontend`, and `full-stack`; changes to deployment behaviour
also require the documented local release gate.

## Environments

The GitHub environments `development` and `production` exist in this
repository. They are configuration scopes only until their Railway app service,
managed PostgreSQL service, environment-specific variables, and secrets are
configured.

Production must receive its own `DATABASE_URL` from its Railway PostgreSQL
service. Never share a database, public URL, or telemetry credential between
development and production. `RAILWAY_API_TOKEN` belongs only in the matching
GitHub environment secret; Railway identifiers and public URL belong in GitHub
environment variables.

## Enforced controls

The repository is public and both `main` and `dev` require one approving
review, the `backend`, `frontend`, `lint`, `typecheck`, and `full-stack` CI
contexts, resolved conversations, linear history, and no force pushes or
deletions. Repository administrators may bypass the approval requirement while
the project has a single human reviewer. Reviews are dismissed when a new
commit is pushed.

An active GitHub ruleset automatically requests Copilot code review for every
pull request, including drafts and subsequent pushes. Copilot review is an
additional signal, not a substitute for an accountable human reviewer.

Configure production with a reviewer who is independent of the deployer; do
not use self-approval as a substitute.
