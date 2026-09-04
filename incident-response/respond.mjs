import { readFile } from 'node:fs/promises';
import process from 'node:process';

const [recordPath] = process.argv.slice(2);
if (!recordPath) throw new Error('usage: node incident-response/respond.mjs RECORD.json');

const record = JSON.parse(await readFile(recordPath, 'utf8'));
const level = process.env.AUTONOMY_LEVEL ?? 'observe';
const action = process.env.PROPOSED_ACTION ?? 'collect_allowlisted_evidence';
const allowed = new Set({
  observe: ['collect_allowlisted_evidence'],
  propose: ['collect_allowlisted_evidence', 'write_investigation_record'],
  act: ['collect_allowlisted_evidence', 'write_investigation_record', 'run_recovery_check'],
}[level] ?? []);
const policyDecision = !allowed.has(action) ? 'denied' : level === 'act' && process.env.HUMAN_APPROVED !== '1' ? 'escalated' : 'allowed';

process.stdout.write(`${JSON.stringify({
  incident_id: record.incident_id,
  alert: record.alert,
  evidence: record.evidence,
  proposed_action: action,
  policy_decision: policyDecision,
  executed_command: '',
  recovery: { status: policyDecision === 'allowed' ? 'pending' : 'not_verified' },
}, null, 2)}\n`);
