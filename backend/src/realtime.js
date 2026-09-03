import { isRoomUpdate } from './rooms/roomRepository.js';
import { meter, tracer } from './telemetry.js';

const roomEvents = meter.createCounter('paircode.room.events', {
  description: 'Room join and update events processed by Socket.IO',
});

function recordException(span, error) {
  span.recordException(error instanceof Error ? error : new Error(String(error)));
}

function roomError(socket, error, message) {
  socket.emit('room:error', { error, message });
}

export function attachRealtimeHandlers(io, store) {
  io.on('connection', (socket) => {
    socket.on('room:join', (payload) => tracer.startActiveSpan('room.join', async (span) => {
      try {
        const roomId = payload?.roomId;
        const room = typeof roomId === 'string' ? await store.get(roomId) : null;
        if (!room) {
          roomEvents.add(1, { operation: 'join', result: 'not_found' });
          roomError(socket, 'room_not_found', 'This interview room does not exist.');
          return;
        }
        socket.join(room.id);
        socket.emit('room:state', room);
        roomEvents.add(1, { operation: 'join', result: 'success' });
      } catch (error) {
        recordException(span, error);
        span.setStatus({ code: 2 });
        roomEvents.add(1, { operation: 'join', result: 'error' });
        throw error;
      } finally {
        span.end();
      }
    }));

    socket.on('room:update', (payload) => tracer.startActiveSpan('room.update', async (span) => {
      try {
        const roomId = payload?.roomId;
        const patch = payload && typeof payload === 'object'
          ? { code: payload.code, language: payload.language }
          : null;
        if (patch && patch.code === undefined) delete patch.code;
        if (patch && patch.language === undefined) delete patch.language;
        if (typeof roomId !== 'string' || !isRoomUpdate(patch)) {
          roomEvents.add(1, { operation: 'update', result: 'validation_error' });
          roomError(socket, 'validation_error', 'Provide a room ID and at least one supported room field.');
          return;
        }
        const room = await store.update(roomId, patch);
        if (!room) {
          roomEvents.add(1, { operation: 'update', result: 'not_found' });
          roomError(socket, 'room_not_found', 'This interview room does not exist.');
          return;
        }
        socket.to(room.id).emit('room:updated', room);
        roomEvents.add(1, { operation: 'update', result: 'success' });
      } catch (error) {
        recordException(span, error);
        span.setStatus({ code: 2 });
        roomEvents.add(1, { operation: 'update', result: 'error' });
        throw error;
      } finally {
        span.end();
      }
    }));
  });
}
