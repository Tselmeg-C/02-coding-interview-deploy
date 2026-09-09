import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const required = [
  'GRAFANA_URL',
  'GRAFANA_DASHBOARD_TOKEN',
  'GRAFANA_PROMETHEUS_UID',
  'GRAFANA_LOKI_UID',
  'GRAFANA_TEMPO_UID',
];
for (const name of required) if (!process.env[name]) throw new Error(`${name} is required`);

const dashboard = JSON.parse(await readFile(resolve(process.env.GRAFANA_DASHBOARD_FILE ?? 'observability/dashboards/paircode-overview.json')));
const datasources = {
  DS_PROMETHEUS: process.env.GRAFANA_PROMETHEUS_UID,
  DS_LOKI: process.env.GRAFANA_LOKI_UID,
  DS_TEMPO: process.env.GRAFANA_TEMPO_UID,
};
const replace = (value) => typeof value === 'string'
  ? value.replace(/\$\{(DS_[A-Z]+)\}/g, (_, key) => datasources[key] ?? value)
  : value;

for (const panel of dashboard.panels ?? []) {
  if (panel.datasource?.uid) panel.datasource.uid = replace(panel.datasource.uid);
}
for (const variable of dashboard.templating?.list ?? []) {
  if (variable.datasource?.uid) variable.datasource.uid = replace(variable.datasource.uid);
}
delete dashboard.__inputs;
dashboard.id = null;

const baseUrl = new URL(process.env.GRAFANA_URL).origin;
const response = await fetch(`${baseUrl}/api/dashboards/db`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${process.env.GRAFANA_DASHBOARD_TOKEN}`,
    'content-type': 'application/json',
  },
  body: JSON.stringify({ dashboard, folderId: 0, overwrite: true, message: 'Provision version-controlled PairCode dashboard' }),
});
if (!response.ok) throw new Error(`Grafana dashboard provisioning failed (${response.status})`);
const result = await response.json();
console.log(`Provisioned ${result.uid} version ${result.version}`);
