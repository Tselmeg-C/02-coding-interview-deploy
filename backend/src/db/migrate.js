import { ensureDatabaseDirectory } from './connection.js';

const migrations = [
  {
    name: '001_create_rooms',
    async up(database) {
      await database.schema.createTable('rooms', (table) => {
        table.string('id', 64).primary();
        table.string('language', 16).notNullable();
        table.text('code').notNullable();
        table.string('updated_at', 40).notNullable();
      });
    },
  },
];

export async function migrateDatabase(database) {
  await ensureDatabaseDirectory(database);
  const migrationTableExists = await database.schema.hasTable('schema_migrations');
  if (!migrationTableExists) {
    await database.schema.createTable('schema_migrations', (table) => {
      table.string('name', 128).primary();
      table.string('applied_at', 40).notNullable();
    });
  }

  const applied = new Set((await database('schema_migrations').select('name')).map((row) => row.name));
  for (const migration of migrations) {
    if (applied.has(migration.name)) continue;
    await database.transaction(async (transaction) => {
      await migration.up(transaction);
      await transaction('schema_migrations').insert({
        name: migration.name,
        applied_at: new Date().toISOString(),
      });
    });
  }
}
