import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import test from 'node:test';
import { Server } from 'socket.io';
import { io as createClient } from 'socket.io-client';
import { createApp } from '../src/app.js';
import { createDatabase } from '../src/db/connection.js';
import { migrateDatabase } from '../src/db/migrate.js';
import { attachRealtimeHandlers } from '../src/realtime.js';
import { RoomRepository } from '../src/rooms/roomRepository.js';

function once(socket, event) {
  return new Promise((resolve) => socket.once(event, resolve));
}

test('broadcasts a room update to every client in the room', async (context) => {
  const database = createDatabase({ DATABASE_URL: 'sqlite::memory:' });
  await migrateDatabase(database);
  const store = new RoomRepository(database);
  const room = await store.create();
  const server = createServer(createApp(store));
  const io = new Server(server);
  attachRealtimeHandlers(io, store);

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  const url = 'http://127.0.0.1:' + port;
  const interviewer = createClient(url, { transports: ['websocket'] });
  const candidate = createClient(url, { transports: ['websocket'] });

  context.after(() => {
    interviewer.disconnect();
    candidate.disconnect();
    io.close();
    server.close();
    database.destroy();
  });

  await Promise.all([once(interviewer, 'connect'), once(candidate, 'connect')]);
  const interviewerState = once(interviewer, 'room:state');
  const candidateState = once(candidate, 'room:state');
  interviewer.emit('room:join', { roomId: room.id });
  candidate.emit('room:join', { roomId: room.id });
  await Promise.all([interviewerState, candidateState]);

  const interviewerUpdate = once(interviewer, 'room:updated');
  const candidateUpdate = once(candidate, 'room:updated');
  candidate.emit('room:update', { roomId: room.id, code: 'print("shared")', language: 'python' });

  const [fromInterviewer, fromCandidate] = await Promise.all([interviewerUpdate, candidateUpdate]);
  assert.equal(fromInterviewer.code, 'print("shared")');
  assert.equal(fromCandidate.code, 'print("shared")');
  assert.equal(fromInterviewer.language, 'python');
});
