import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createDatabase, databaseConfig } from '../src/db/connection.js';
import { migrateDatabase } from '../src/db/migrate.js';
import { RoomRepository } from '../src/rooms/roomRepository.js';

async function createTestApp(context) {
  const database = createDatabase({ DATABASE_URL: 'sqlite::memory:' });
  await migrateDatabase(database);
  context.after(() => database.destroy());
  return createApp(new RoomRepository(database));
}

test('creates and retrieves an interview room', async (context) => {
  const app = await createTestApp(context);
  const created = await request(app).post('/api/rooms').expect(201);

  assert.match(created.body.id, /^[a-f0-9]{8}$/);
  assert.equal(created.body.language, 'javascript');
  assert.match(created.body.code, /console\.log/);

  const loaded = await request(app).get('/api/rooms/' + created.body.id).expect(200);
  assert.deepEqual(loaded.body, created.body);
});

test('updates code and language for an existing room', async (context) => {
  const app = await createTestApp(context);
  const created = await request(app).post('/api/rooms').expect(201);

  const updated = await request(app)
    .patch('/api/rooms/' + created.body.id)
    .send({ language: 'python', code: 'print("hello")' })
    .expect(200);

  assert.equal(updated.body.language, 'python');
  assert.equal(updated.body.code, 'print("hello")');
  assert.notEqual(updated.body.updatedAt, '');
});

test('returns contract errors for missing rooms and invalid updates', async (context) => {
  const app = await createTestApp(context);

  const missing = await request(app).get('/api/rooms/missing').expect(404);
  assert.deepEqual(missing.body, {
    error: 'room_not_found',
    message: 'This interview room does not exist.',
  });

  const created = await request(app).post('/api/rooms').expect(201);
  const invalid = await request(app)
    .patch('/api/rooms/' + created.body.id)
    .send({ language: 'ruby' })
    .expect(400);
  assert.equal(invalid.body.error, 'validation_error');
});

test('persists rooms after closing and reopening a SQLite database', async (context) => {
  const directory = await mkdtemp(join(tmpdir(), 'paircode-db-'));
  const databaseUrl = 'sqlite:' + join(directory, 'rooms.sqlite3');
  context.after(() => rm(directory, { recursive: true, force: true }));

  const firstDatabase = createDatabase({ DATABASE_URL: databaseUrl });
  await migrateDatabase(firstDatabase);
  const firstRepository = new RoomRepository(firstDatabase);
  const created = await firstRepository.create();
  await firstRepository.update(created.id, { code: 'console.log("persisted")' });
  await firstDatabase.destroy();

  const secondDatabase = createDatabase({ DATABASE_URL: databaseUrl });
  await migrateDatabase(secondDatabase);
  context.after(() => secondDatabase.destroy());
  const restored = await new RoomRepository(secondDatabase).get(created.id);

  assert.equal(restored.code, 'console.log("persisted")');
  assert.equal(restored.language, 'javascript');
});

test('selects PostgreSQL through environment configuration', () => {
  const config = databaseConfig({
    DB_ENGINE: 'postgresql',
    DB_HOST: 'db.example.test',
    DB_PORT: '5433',
    DB_NAME: 'paircode',
    DB_USER: 'app_user',
    DB_PASSWORD: 'not-a-real-secret',
  });

  assert.equal(config.client, 'pg');
  assert.deepEqual(config.connection, {
    host: 'db.example.test',
    port: 5433,
    database: 'paircode',
    user: 'app_user',
    password: 'not-a-real-secret',
  });
});
