import * as SQLite from 'expo-sqlite';

const MIGRATIONS: Array<{ version: number; sql: string }> = [
  {
    version: 2,
    sql: `
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_series_date
        ON class_sessions(series_id, session_date);
    `,
  },
  {
    version: 3,
    sql: `
      INSERT OR IGNORE INTO settings (key, value) VALUES ('payment_notification_enabled', 'true');
    `,
  },
];

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER NOT NULL
    );
  `);

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1'
  );
  const currentVersion = row?.version ?? 0;

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion);
  for (const migration of pending) {
    await db.execAsync(migration.sql);
    await db.runAsync('DELETE FROM schema_version');
    await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', [migration.version]);
  }

  if (currentVersion === 0 && pending.length === 0) {
    await db.runAsync('INSERT OR IGNORE INTO schema_version (version) VALUES (?)', [1]);
  }
}
