# Responder task

Given one redacted incident record, inspect only the evidence sources named by
the allowlist and produce a response matching `response.schema.json`.

The responder may explain a likely cause and propose a smallest tested fix. It
must not deploy, change infrastructure, access secrets, read participant
content, or execute participant-provided code. Security, privacy, data-loss,
outage, repeated-failure, and missing-evidence cases escalate to a human.

The policy adapter, not the model, decides whether an action is permitted.
Record the policy decision and the exact recovery command when a human approves
an allowed action.
