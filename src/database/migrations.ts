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
  {
    version: 4,
    sql: `
      INSERT OR IGNORE INTO settings (key, value) VALUES ('payment_notification_time', '09:00');
    `,
  },
  {
    version: 5,
    sql: `
      CREATE TABLE IF NOT EXISTS centers (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        address    TEXT,
        is_active  INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS series_trainees (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        series_id  INTEGER NOT NULL REFERENCES class_series(id) ON DELETE CASCADE,
        trainee_id INTEGER NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
        UNIQUE(series_id, trainee_id)
      );

      ALTER TABLE class_series ADD COLUMN center_id INTEGER;
      ALTER TABLE class_sessions ADD COLUMN guest_name TEXT;
      ALTER TABLE class_sessions ADD COLUMN center_id INTEGER;
      ALTER TABLE managers ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE trainees ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
    `,
  },
  {
    version: 6,
    sql: `
      ALTER TABLE class_types ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1;
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
