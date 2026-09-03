import { emitLog, shutdownTelemetry } from './telemetry.js';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Server } from 'socket.io';
import { createApp } from './app.js';
import { createDatabase } from './db/connection.js';
import { migrateDatabase } from './db/migrate.js';
import { attachRealtimeHandlers } from './realtime.js';
import { RoomRepository } from './rooms/roomRepository.js';

const port = Number(process.env.PORT ?? 3001);
const database = createDatabase();
await migrateDatabase(database);
const store = new RoomRepository(database);
const sourceDirectory = dirname(fileURLToPath(import.meta.url));
const frontendDirectory = resolve(sourceDirectory, '../../frontend/dist');
const app = createApp(store, { frontendDirectory });
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
  },
});

attachRealtimeHandlers(io, store);

server.listen(port, () => {
  emitLog('INFO', 'PairCode backend listening', { port });
  console.log('PairCode backend listening on port ' + port);
});

async function shutdown() {
  await new Promise((resolve) => server.close(resolve));
  await database.destroy();
  await shutdownTelemetry();
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
