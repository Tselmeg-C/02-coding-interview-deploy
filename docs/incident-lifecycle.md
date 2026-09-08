# Incident lifecycle

The production path is:

1. An unhandled room operation emits a structured error log and increments the
   `paircode_operation_errors` counter.
2. Grafana evaluates `PairCodeRoomErrors` and sends a timestamped HMAC webhook.
3. The Railway on-call receiver verifies the signature, drops non-allowlisted
   data, and dispatches the alert to GitHub.
4. GitHub opens one incident issue per fingerprint. Repeated notifications
   reuse it and do not start another investigation.
5. Codex investigates in a disposable checkout without production or GitHub
   credentials. A second job constrains and tests any proposed source patch.
6. A clean job opens a PR into `dev`; protected-branch review and CI remain the
   production-change gate.
7. When Grafana reports the alert resolved, GitHub comments on and closes the
   incident automatically.

The local lifecycle and remediation-parser tests use temporary data and fake
dispatches. They do not alter GitHub, Grafana, Railway, the application
database, or production.
