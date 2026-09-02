# Copilot pull-request review instructions

Review every changed path against the product specification, `AGENTS.md`, and
the following completion rules. Do not approve a code-changing pull request
that does not give clear evidence for every applicable item.

1. Confirm the author ran the repository linter, type check, unit tests, and
   integration tests. If a required check has no configured command, flag it as
   a blocking engineering gap; do not treat an omitted command as a pass.
2. Require a regression test for every fixed bug, covering the reported failure
   before the fix and passing after it.
3. Verify existing abstractions are respected. In particular, frontend HTTP
   and Socket.IO transport calls must stay behind `frontend/src/services/`;
   React UI components must not call HTTP or sockets directly.
4. Verify the backend never executes participant-provided code. Browser Web
   Workers remain the only execution location.
5. Check affected error, loading, empty, reconnecting, and unavailable states;
   require coverage or a justified manual verification for each relevant state.
6. Flag any dependency addition unless the PR explains why an existing package
   or platform capability cannot meet the need, states the security/maintenance
   impact, and updates lockfiles deliberately.
7. Check that the PR describes architectural changes, transport/data-flow
   changes, operational impact, and rollback considerations where applicable.
8. Treat automated Copilot review as advisory. A human reviewer remains
   responsible for approval, risk assessment, and production promotion.
