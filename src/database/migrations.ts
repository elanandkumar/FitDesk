import * as SQLite from 'expo-sqlite';

type Migration = {
  version: number;
  statements: string[];
};

const MIGRATIONS: Migration[] = [
  {
    version: 2,
    statements: [
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_series_date ON class_sessions(series_id, session_date)`,
    ],
  },
  {
    version: 3,
    statements: [
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('payment_notification_enabled', 'true')`,
    ],
  },
  {
    version: 4,
    statements: [
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('payment_notification_time', '09:00')`,
    ],
  },
  {
    version: 5,
    statements: [
      `CREATE TABLE IF NOT EXISTS centers (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        name       TEXT NOT NULL,
        address    TEXT,
        is_active  INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS series_trainees (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        series_id  INTEGER NOT NULL REFERENCES class_series(id) ON DELETE CASCADE,
        trainee_id INTEGER NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
        UNIQUE(series_id, trainee_id)
      )`,
      `ALTER TABLE class_series ADD COLUMN center_id INTEGER`,
      `ALTER TABLE class_sessions ADD COLUMN guest_name TEXT`,
      `ALTER TABLE class_sessions ADD COLUMN center_id INTEGER`,
      `ALTER TABLE managers ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`,
      `ALTER TABLE trainees ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`,
    ],
  },
  {
    version: 6,
    statements: [
      `ALTER TABLE class_types ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`,
    ],
  },
  {
    version: 7,
    statements: [
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('last_backup_at', '')`,
    ],
  },
  {
    version: 8,
    statements: [
      `CREATE TABLE IF NOT EXISTS app_notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        created_at TEXT NOT NULL,
        read_at TEXT
      )`,
    ],
  },
  {
    version: 9,
    statements: [
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('payment_threshold_reminder', '3')`,
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('payment_threshold_high', '10')`,
      `INSERT OR IGNORE INTO settings (key, value) VALUES ('payment_threshold_urgent', '15')`,
    ],
  },
];

async function runStatement(db: SQLite.SQLiteDatabase, sql: string): Promise<void> {
  try {
    await db.execAsync(sql);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Ignore "duplicate column" — column already added by base schema on fresh install
    if (msg.includes('duplicate column name')) return;
    throw e;
  }
}

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(
    `CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)`
  );

  const row = await db.getFirstAsync<{ version: number }>(
    'SELECT version FROM schema_version LIMIT 1'
  );
  const currentVersion = row?.version ?? 0;

  const pending = MIGRATIONS.filter((m) => m.version > currentVersion);
  for (const migration of pending) {
    for (const sql of migration.statements) {
      await runStatement(db, sql);
    }
    await db.runAsync('DELETE FROM schema_version');
    await db.runAsync('INSERT INTO schema_version (version) VALUES (?)', [migration.version]);
  }

  if (currentVersion === 0 && pending.length === 0) {
    await db.runAsync('INSERT OR IGNORE INTO schema_version (version) VALUES (?)', [MIGRATIONS[MIGRATIONS.length - 1].version]);
  }
}
