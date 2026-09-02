import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import knex from 'knex';

function sqliteFilename(databaseUrl) {
  return databaseUrl.slice('sqlite:'.length);
}

function postgresConnection(environment) {
  if (environment.DATABASE_URL) return environment.DATABASE_URL;
  return {
    host: environment.DB_HOST ?? 'localhost',
    port: Number(environment.DB_PORT ?? 5432),
    database: environment.DB_NAME ?? 'coding_interview',
    user: environment.DB_USER ?? 'postgres',
    password: environment.DB_PASSWORD,
  };
}

export function databaseConfig(environment = process.env) {
  const databaseUrl = environment.DATABASE_URL
    ?? (environment.DB_ENGINE === 'postgresql' ? 'postgresql:' : 'sqlite:./data/coding-interview.sqlite3');

  if (databaseUrl.startsWith('postgresql:') || databaseUrl.startsWith('postgres:')) {
    return {
      client: 'pg',
      connection: postgresConnection(environment),
      pool: { min: 0, max: 10 },
    };
  }

  if (!databaseUrl.startsWith('sqlite:')) {
    throw new Error('DATABASE_URL must use sqlite:, postgresql:, or postgres:.');
  }

  return {
    client: 'sqlite3',
    connection: { filename: sqliteFilename(databaseUrl) },
    useNullAsDefault: true,
    pool: { min: 1, max: 1 },
  };
}

export function createDatabase(environment = process.env) {
  return knex(databaseConfig(environment));
}

export async function ensureDatabaseDirectory(database) {
  const filename = database.client.config.connection?.filename;
  if (database.client.config.client !== 'sqlite3' || !filename || filename === ':memory:') return;
  await mkdir(dirname(resolve(filename)), { recursive: true });
}
