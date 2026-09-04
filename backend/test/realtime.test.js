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

test('broadcasts a room update only to other clients in the room', async (context) => {
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

  let echoedToCandidate = false;
  candidate.once('room:updated', () => {
    echoedToCandidate = true;
  });
  const finalCode = 'print("shared from candidate")';
  const interviewerUpdate = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('timed out waiting for final room update')), 1000);
    interviewer.on('room:updated', (updatedRoom) => {
      if (updatedRoom.code === finalCode) {
        clearTimeout(timeout);
        resolve(updatedRoom);
      }
    });
  });
  for (let index = 1; index <= finalCode.length; index += 1) {
    candidate.emit('room:update', { roomId: room.id, code: finalCode.slice(0, index), language: 'python' });
  }

  const fromInterviewer = await interviewerUpdate;
  assert.equal(fromInterviewer.code, finalCode);
  assert.equal(fromInterviewer.language, 'python');
  assert.equal(echoedToCandidate, false);
});
