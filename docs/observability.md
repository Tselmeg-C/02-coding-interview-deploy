# Managed observability

PairCode Interview uses Grafana Cloud as the managed OTLP backend. Railway
services send traces, metrics, and logs directly over HTTPS; no collector or
observability service runs inside the application container.

## Provider setup

Create one Grafana Cloud stack and an access policy with only the OTLP write
permissions required by the stack. The OpenTelemetry card supplies the
stack-specific OTLP endpoint and instance ID. Generate the Basic authentication
value from `instance-id:token` and store the resulting header as a secret.

Configure the same endpoint and separate environment identity in both Railway
application environments:

```text
OTEL_EXPORTER_OTLP_ENDPOINT=https://<stack-otlp-endpoint>
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic <base64-instance-id-and-token>
OTEL_TRACES_EXPORTER=otlp
OTEL_METRICS_EXPORTER=otlp
OTEL_LOGS_EXPORTER=otlp
DEPLOYMENT_ENVIRONMENT=development|production
SERVICE_VERSION=<image-tag-or-digest>
```

Keep the endpoint HTTPS, keep the header in a Railway secret, and do not place
the generated value in GitHub variables, this repository, or command output.
Use separate Grafana folders or stack labels for development and production;
the application resource attribute `deployment.environment.name` is the
authoritative environment filter.

## Retention and access

Use the Grafana Cloud plan's explicit metrics, logs, and traces retention
limits. Restrict Grafana users to the smallest team roles needed to read
telemetry and administer dashboards. Review retention and access quarterly;
the provider owns storage durability and TLS termination.

## Verification checklist

After setting the Railway variables in each environment:

1. Restart or redeploy the app and confirm the `/health` check remains green.
2. Create a room, join it from two browser sessions, and edit the code.
3. In Grafana Explore, verify one HTTP trace, one room event, and the startup
   log appear with the correct `service.name`, environment, and version.
4. Confirm telemetry contains no room IDs, participant IDs, source code,
   credentials, connection strings, or raw URLs.

Import the version-filterable dashboard from
[`observability/dashboards/paircode-overview.json`](../observability/dashboards/paircode-overview.json)
and select the Prometheus data source created by Grafana Cloud. Metric names,
boundaries, and intentionally deferred product metrics are listed in
[`metrics.md`](metrics.md).

The provider account, access policy, endpoint, retention choice, and Railway
secret values are operational state and must be recorded in the team's secure
handoff system, never committed here.
