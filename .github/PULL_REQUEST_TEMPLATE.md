## Summary

<!-- Explain the user or operational outcome and link the issue. -->

Closes #

## Architectural changes

<!-- Describe changes to component boundaries, data flow, transports, storage,
deployment, telemetry, or explain why there are none. -->

## Validation

<!-- Include commands and results. A documentation-only change may mark a
non-applicable check N/A and explain why. Code changes must not claim completion
when a required quality gate is missing. -->

- [ ] Linter run and passing
- [ ] Type check run and passing
- [ ] Unit tests run and passing
- [ ] Integration tests run and passing
- [ ] Regression test added for a bug fix, or not applicable
- [ ] Error, loading, empty, reconnecting, and unavailable states reviewed

## Design and safety checks

- [ ] Existing abstractions retained; UI components do not call HTTP or sockets directly
- [ ] Backend does not execute participant-provided code
- [ ] New dependencies are absent, or their justification and maintenance impact are documented
- [ ] Deployment/observability/rollback impact is documented, or not applicable
