import cors from 'cors';
import express from 'express';
import { isRoomUpdate } from './rooms/roomRepository.js';
import { emitLog } from './telemetry.js';

function errorResponse(error, message) {
  return { error, message };
}

/**
 * @param {*} store
 * @param {{ frontendDirectory?: string }} [options]
 */
export function createApp(store, options = {}) {
  const { frontendDirectory } = options;
  const app = express();
  const api = express.Router();
  app.use(cors());
  app.use(express.json({ limit: '256kb' }));

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  api.post('/rooms', async (_request, response) => {
    response.status(201).json(await store.create());
  });

  api.get('/rooms/:roomId', async (request, response) => {
    const room = await store.get(request.params.roomId);
    if (!room) {
      response.status(404).json(errorResponse('room_not_found', 'This interview room does not exist.'));
      return;
    }
    response.status(200).json(room);
  });

  api.patch('/rooms/:roomId', async (request, response) => {
    if (!isRoomUpdate(request.body)) {
      response.status(400).json(errorResponse('validation_error', 'Provide at least one supported room field.'));
      return;
    }
    const room = await store.update(request.params.roomId, request.body);
    if (!room) {
      response.status(404).json(errorResponse('room_not_found', 'This interview room does not exist.'));
      return;
    }
    response.status(200).json(room);
  });

  api.use((_request, response) => {
    response.status(404).json(errorResponse('not_found', 'The requested endpoint does not exist.'));
  });

  api.use((error, request, response, next) => {
    if (response.headersSent) return next(error);
    emitLog('ERROR', 'HTTP room operation failed', {
      operation: request.method,
      'error.type': error instanceof Error ? error.name : 'Error',
    });
    response.status(500).json(errorResponse('internal_error', 'The room operation failed. Try again.'));
  });

  app.use('/api', api);

  if (frontendDirectory) {
    app.use(express.static(frontendDirectory));
    app.get(/.*/, (_request, response) => {
      response.sendFile('index.html', { root: frontendDirectory });
    });
  } else {
    app.use((_request, response) => {
      response.status(404).json(errorResponse('not_found', 'The requested endpoint does not exist.'));
    });
  }

  return app;
}
