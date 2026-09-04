# Responder security audit

Scope: `incident-response/respond.mjs` and its policy-controlled runbooks.

The responder is an adapter, not an executor: it reads a validated incident
record, applies the autonomy level, and emits a JSON decision. Production
changes, security/privacy concerns, participant content, and missing evidence
remain human-controlled.

Run the deterministic audit with:

```sh
npm run security-audit
```

The command writes a secret-free JSON record to stdout. Store reviewed runs in
`security-audit/runs/` only after removing environment-specific details.
