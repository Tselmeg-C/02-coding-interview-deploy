# PairCode metrics

OpenTelemetry exports these application metrics. Grafana Cloud exposes the
resource attributes as labels; dashboards filter on environment and version.

| Metric | Type | Labels | Boundary |
| --- | --- | --- | --- |
| `paircode_rooms_created` | counter | resource environment/version | One successful room insert |
| `paircode_room_events` | counter | `operation`, `result`, resource environment/version | One Socket.IO join/update handler |
| `paircode_participants_active` | up/down counter | resource environment/version | Successful room join/disconnect |
| `paircode_room_update_duration` | histogram | `result`, resource environment/version | One update handler, in milliseconds |

The HTTP and PostgreSQL instrumentations also emit standard request/database
latency and error telemetry. `canvas_elements_created` and
`component_creation_failures` are not emitted because the current product has
no canvas or component-creation workflow. `change_propagation_delay` requires
an end-to-end client timestamp protocol and remains deferred until that
measurement can be accurate.

Never add room IDs, participant IDs, request IDs, source code, credentials,
connection strings, or raw URLs as metric labels.
