# Disposable incident lifecycle

Issue #10 is exercised locally by
`on-call-engineer/test/incident-lifecycle.test.js`. It uses a room-operation
error alert, because PairCode has no component-creation workflow, and verifies
the safe boundary that exists today:

1. Receive an alert.
2. Redact source, participant content, secrets, and URLs.
3. Deduplicate while the investigation is running.
4. Persist the completed investigation record.

The test uses a temporary directory and a fake fixed agent. It does not alter
the application, database, observability provider, Railway, or production
data. The remaining provider actions—notification delivery, acknowledgement,
resolution, and promotion of a reviewed fix—are covered by the safe checklist
in [`alerting-runbooks.md`](alerting-runbooks.md).
