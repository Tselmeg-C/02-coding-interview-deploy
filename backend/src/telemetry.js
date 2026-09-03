import { logs } from '@opentelemetry/api-logs';
import { trace, metrics } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';

const resource = resourceFromAttributes({
  'service.name': 'paircode-interview',
  'deployment.environment.name': process.env.DEPLOYMENT_ENVIRONMENT ?? 'development',
  'service.version': process.env.SERVICE_VERSION ?? process.env.GITHUB_SHA ?? 'local',
});

const sdk = new NodeSDK({
  resource,
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

export const tracer = trace.getTracer('paircode-interview');
export const meter = metrics.getMeter('paircode-interview');
export const logger = logs.getLogger('paircode-interview');
export const roomsCreated = meter.createCounter('paircode.rooms.created', {
  description: 'Interview rooms created',
});
export const activeParticipants = meter.createUpDownCounter('paircode.participants.active', {
  description: 'Participants currently joined to rooms',
});
export const roomUpdateDuration = meter.createHistogram('paircode.room.update.duration', {
  description: 'Time spent processing room updates in milliseconds',
  unit: 'ms',
});

export function emitLog(severityText, body, attributes = {}) {
  logger.emit({ severityText, body, attributes });
}

export function shutdownTelemetry() {
  return sdk.shutdown();
}
