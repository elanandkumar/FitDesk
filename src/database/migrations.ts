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
  {
    version: 10,
    statements: [
      `ALTER TABLE trainee_packages ADD COLUMN series_id INTEGER`,
    ],
  },
  {
    version: 11,
    statements: [
      `DROP TABLE IF EXISTS trainee_packages_next`,
      `CREATE TABLE IF NOT EXISTS trainee_packages_next (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        trainee_id      INTEGER NOT NULL REFERENCES trainees(id),
        series_id       INTEGER REFERENCES class_series(id) ON DELETE SET NULL,
        month           TEXT NOT NULL,
        total_sessions  INTEGER NOT NULL DEFAULT 12,
        used_sessions   INTEGER NOT NULL DEFAULT 0,
        amount          REAL NOT NULL,
        status          TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid')),
        paid_date       TEXT,
        notes           TEXT,
        created_at      TEXT NOT NULL
      )`,
      `INSERT INTO trainee_packages_next (
        id, trainee_id, series_id, month, total_sessions, used_sessions,
        amount, status, paid_date, notes, created_at
      )
      SELECT
        id, trainee_id, series_id, month, total_sessions, used_sessions,
        amount, status, paid_date, notes, created_at
      FROM trainee_packages`,
      `DROP TABLE trainee_packages`,
      `ALTER TABLE trainee_packages_next RENAME TO trainee_packages`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_trainee_packages_pending_month
        ON trainee_packages(trainee_id, month)
        WHERE status = 'pending'`,
    ],
  },
  {
    version: 12,
    statements: [
      `UPDATE settings
        SET value = 'system'
        WHERE key = 'theme'
          AND value IN ('light', 'dark')
          AND NOT EXISTS (
            SELECT 1 FROM settings WHERE key = 'onboarding_done'
          )`,
    ],
  },
  {
    version: 13,
    statements: [
      `ALTER TABLE managers ADD COLUMN contact_type TEXT NOT NULL DEFAULT 'regular'
        CHECK(contact_type IN ('regular','one_time'))`,
      `ALTER TABLE class_sessions ADD COLUMN agreed_amount REAL`,
    ],
  },
  {
    version: 14,
    statements: [
      `ALTER TABLE managers ADD COLUMN contact_person TEXT`,
    ],
  },
  {
    version: 15,
    statements: [],
  },
];

async function migrateOrganizerTerminology(db: SQLite.SQLiteDatabase): Promise<void> {
  const legacyTable = await db.getFirstAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'managers'"
  );
  if (!legacyTable) return;

  await db.execAsync(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS organizer_payments;
    DROP TABLE IF EXISTS organizers;
    DROP TABLE IF EXISTS organizer_payments_next;
    DROP TABLE IF EXISTS class_series_next;
    DROP TABLE IF EXISTS organizers_next;

    CREATE TABLE organizers_next (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT,
      email TEXT,
      per_class_rate REAL NOT NULL DEFAULT 0,
      currency TEXT NOT NULL DEFAULT 'INR',
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      contact_type TEXT NOT NULL DEFAULT 'regular'
        CHECK(contact_type IN ('regular','one_time')),
      created_at TEXT NOT NULL
    );
    INSERT INTO organizers_next
      SELECT id, name, contact_person, phone, email, per_class_rate, currency,
             notes, is_active, contact_type, created_at
      FROM managers;

    CREATE TABLE class_series_next (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      class_type_id INTEGER NOT NULL REFERENCES class_types(id),
      source_type TEXT NOT NULL CHECK(source_type IN ('organizer','personal')),
      organizer_id INTEGER REFERENCES organizers(id),
      recurrence_type TEXT NOT NULL CHECK(recurrence_type IN ('daily','weekly','custom')),
      recurrence_days TEXT,
      start_date TEXT NOT NULL,
      end_date TEXT,
      class_time TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      location_type TEXT NOT NULL CHECK(location_type IN ('offline','online')),
      location TEXT,
      notes TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      center_id INTEGER REFERENCES centers(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL
    );
    INSERT INTO class_series_next
      SELECT id, title, class_type_id,
             CASE source_type WHEN 'manager' THEN 'organizer' ELSE source_type END,
             manager_id, recurrence_type, recurrence_days, start_date, end_date,
             class_time, duration_minutes, location_type, location, notes,
             is_active, center_id, created_at
      FROM class_series;

    CREATE TABLE organizer_payments_next (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL REFERENCES class_sessions(id),
      organizer_id INTEGER NOT NULL REFERENCES organizers(id),
      amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid')),
      paid_date TEXT,
      notes TEXT,
      created_at TEXT NOT NULL
    );
    INSERT INTO organizer_payments_next
      SELECT id, session_id, manager_id, amount, status, paid_date, notes, created_at
      FROM manager_payments;

    DROP TABLE manager_payments;
    DROP TABLE class_series;
    DROP TABLE managers;
    ALTER TABLE organizers_next RENAME TO organizers;
    ALTER TABLE class_series_next RENAME TO class_series;
    ALTER TABLE organizer_payments_next RENAME TO organizer_payments;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_series_date
      ON class_sessions(series_id, session_date);

    PRAGMA foreign_keys = ON;
  `);
}

async function runStatement(db: SQLite.SQLiteDatabase, sql: string): Promise<void> {
  try {
    await db.execAsync(sql);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    // Ignore "duplicate column" — column already added by base schema on fresh install
    if (msg.includes('duplicate column name')) return;
    if (msg.includes('no such table: managers')) return;
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
    if (migration.version === 15) {
      await migrateOrganizerTerminology(db);
    }
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
