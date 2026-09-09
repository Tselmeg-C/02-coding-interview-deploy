/* global URL, console, fetch, process, setTimeout */

const required = [
  'APP_URL',
  'GRAFANA_URL',
  'GRAFANA_DASHBOARD_TOKEN',
  'GRAFANA_PROMETHEUS_UID',
  'DEPLOYMENT_ENVIRONMENT',
];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);

const appUrl = process.env.APP_URL.replace(/\/$/, '');
const health = await fetch(`${appUrl}/health`);
if (!health.ok) throw new Error(`health check failed (${health.status})`);

await new Promise((resolve) => setTimeout(resolve, Number(process.env.TELEMETRY_WAIT_SECONDS ?? 15) * 1000));
const baseUrl = new URL(process.env.GRAFANA_URL).origin;
const query = `count({__name__=~"http_server_request_duration_seconds.*",deployment_environment_name="${process.env.DEPLOYMENT_ENVIRONMENT}"})`;
const response = await fetch(
  `${baseUrl}/api/datasources/proxy/uid/${encodeURIComponent(process.env.GRAFANA_PROMETHEUS_UID)}/api/v1/query?query=${encodeURIComponent(query)}`,
  { headers: { Authorization: `Bearer ${process.env.GRAFANA_DASHBOARD_TOKEN}` } },
);
if (!response.ok) throw new Error(`Grafana query failed (${response.status})`);
const body = await response.json();
if (body.status !== 'success' || body.data.result.length === 0) {
  throw new Error(`no HTTP telemetry found for ${process.env.DEPLOYMENT_ENVIRONMENT}`);
}
console.log(`Telemetry verified for ${process.env.DEPLOYMENT_ENVIRONMENT}`);
