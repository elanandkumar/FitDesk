export const CREATE_CLASS_TYPES = `
  CREATE TABLE IF NOT EXISTS class_types (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,
    color      TEXT NOT NULL DEFAULT '#6200ee',
    is_active  INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
`;

export const CREATE_MANAGERS = `
  CREATE TABLE IF NOT EXISTS managers (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    phone           TEXT,
    email           TEXT,
    per_class_rate  REAL NOT NULL DEFAULT 0,
    currency        TEXT NOT NULL DEFAULT 'INR',
    notes           TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL
  );
`;

export const CREATE_TRAINEES = `
  CREATE TABLE IF NOT EXISTS trainees (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    phone      TEXT,
    email      TEXT,
    notes      TEXT,
    is_active  INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
`;

export const CREATE_CLASS_SERIES = `
  CREATE TABLE IF NOT EXISTS class_series (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    title             TEXT NOT NULL,
    class_type_id     INTEGER NOT NULL REFERENCES class_types(id),
    source_type       TEXT NOT NULL CHECK(source_type IN ('manager','personal')),
    manager_id        INTEGER REFERENCES managers(id),
    recurrence_type   TEXT NOT NULL CHECK(recurrence_type IN ('daily','weekly','custom')),
    recurrence_days   TEXT,
    start_date        TEXT NOT NULL,
    end_date          TEXT,
    class_time        TEXT NOT NULL,
    duration_minutes  INTEGER NOT NULL DEFAULT 60,
    location_type     TEXT NOT NULL CHECK(location_type IN ('offline','online')),
    location          TEXT,
    notes             TEXT,
    is_active         INTEGER NOT NULL DEFAULT 1,
    center_id         INTEGER REFERENCES centers(id) ON DELETE SET NULL,
    created_at        TEXT NOT NULL
  );
`;

export const CREATE_CLASS_SESSIONS = `
  CREATE TABLE IF NOT EXISTS class_sessions (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    series_id     INTEGER NOT NULL REFERENCES class_series(id),
    session_date  TEXT NOT NULL,
    class_time    TEXT NOT NULL,
    status        TEXT NOT NULL DEFAULT 'upcoming'
                    CHECK(status IN ('upcoming','completed','cancelled','skipped')),
    student_count INTEGER DEFAULT 0,
    notes         TEXT,
    guest_name    TEXT,
    center_id     INTEGER REFERENCES centers(id) ON DELETE SET NULL,
    created_at    TEXT NOT NULL
  );
`;

export const CREATE_CENTERS = `
  CREATE TABLE IF NOT EXISTS centers (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    address    TEXT,
    is_active  INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );
`;

export const CREATE_SERIES_TRAINEES = `
  CREATE TABLE IF NOT EXISTS series_trainees (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    series_id  INTEGER NOT NULL REFERENCES class_series(id) ON DELETE CASCADE,
    trainee_id INTEGER NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
    UNIQUE(series_id, trainee_id)
  );
`;

export const CREATE_SESSION_TRAINEES = `
  CREATE TABLE IF NOT EXISTS session_trainees (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES class_sessions(id),
    trainee_id INTEGER NOT NULL REFERENCES trainees(id),
    UNIQUE(session_id, trainee_id)
  );
`;

export const CREATE_MANAGER_PAYMENTS = `
  CREATE TABLE IF NOT EXISTS manager_payments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES class_sessions(id),
    manager_id INTEGER NOT NULL REFERENCES managers(id),
    amount     REAL NOT NULL,
    status     TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid')),
    paid_date  TEXT,
    notes      TEXT,
    created_at TEXT NOT NULL
  );
`;

export const CREATE_TRAINEE_PACKAGES = `
  CREATE TABLE IF NOT EXISTS trainee_packages (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    trainee_id      INTEGER NOT NULL REFERENCES trainees(id),
    month           TEXT NOT NULL,
    total_sessions  INTEGER NOT NULL DEFAULT 12,
    used_sessions   INTEGER NOT NULL DEFAULT 0,
    amount          REAL NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid')),
    paid_date       TEXT,
    notes           TEXT,
    created_at      TEXT NOT NULL,
    UNIQUE(trainee_id, month)
  );
`;

export const CREATE_SETTINGS = `
  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

export const ALL_TABLES = [
  CREATE_CLASS_TYPES,
  CREATE_CENTERS,
  CREATE_MANAGERS,
  CREATE_TRAINEES,
  CREATE_CLASS_SERIES,
  CREATE_CLASS_SESSIONS,
  CREATE_SERIES_TRAINEES,
  CREATE_SESSION_TRAINEES,
  CREATE_MANAGER_PAYMENTS,
  CREATE_TRAINEE_PACKAGES,
  CREATE_SETTINGS,
];

export const DEFAULT_SETTINGS = [
  { key: 'theme', value: 'light' },
  { key: 'notification_enabled', value: 'true' },
  { key: 'notification_minutes_before', value: '60' },
  { key: 'payment_notification_enabled', value: 'true' },
  { key: 'accent_color', value: 'purple' },
];

export const DEFAULT_CLASS_TYPES = [
  { name: 'Zumba', color: '#e91e63' },
  { name: 'Yoga', color: '#00897b' },
  { name: 'Dance Fitness', color: '#6200ee' },
];
