import { isRoomUpdate } from './rooms/roomRepository.js';

function roomError(socket, error, message) {
  socket.emit('room:error', { error, message });
}

export function attachRealtimeHandlers(io, store) {
  io.on('connection', (socket) => {
    socket.on('room:join', async (payload) => {
      const roomId = payload?.roomId;
      const room = typeof roomId === 'string' ? await store.get(roomId) : null;
      if (!room) {
        roomError(socket, 'room_not_found', 'This interview room does not exist.');
        return;
      }
      socket.join(room.id);
      socket.emit('room:state', room);
    });

    socket.on('room:update', async (payload) => {
      const roomId = payload?.roomId;
      const patch = payload && typeof payload === 'object'
        ? { code: payload.code, language: payload.language }
        : null;
      if (patch && patch.code === undefined) delete patch.code;
      if (patch && patch.language === undefined) delete patch.language;
      if (typeof roomId !== 'string' || !isRoomUpdate(patch)) {
        roomError(socket, 'validation_error', 'Provide a room ID and at least one supported room field.');
        return;
      }
      const room = await store.update(roomId, patch);
      if (!room) {
        roomError(socket, 'room_not_found', 'This interview room does not exist.');
        return;
      }
      io.to(room.id).emit('room:updated', room);
    });
  });
}
