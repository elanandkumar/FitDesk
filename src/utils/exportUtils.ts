import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../database/db';
import { runMigrations } from '../database/migrations';
import { getAllClassTypes } from '../database/repositories/classTypeRepository';
import { getAllOrganizers } from '../database/repositories/organizerRepository';
import { getAllTrainees } from '../database/repositories/traineeRepository';
import { getAllClassSeries } from '../database/repositories/classSeriesRepository';
import {
  Center, ClassType, Organizer, Trainee, ClassSeries, SeriesTrainee,
  ClassSession, SessionTrainee, OrganizerPayment, TraineePackage, Setting,
} from '../types';

const BACKUP_VERSION = 4;
const SQLITE_BACKUP_MIME_TYPES = [
  'application/vnd.sqlite3',
  'application/x-sqlite3',
  'application/octet-stream',
  'application/json',
];
const REQUIRED_COMMON_SQLITE_TABLES = [
  'centers',
  'class_types',
  'trainees',
  'class_series',
  'series_trainees',
  'class_sessions',
  'session_trainees',
  'trainee_packages',
  'settings',
];

const SQLITE_MAIN_DATABASE = 'main';

function sqliteTempFile(prefix: string): { name: string; file: File; directory: string } {
  const name = `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.db`;
  return {
    name,
    file: new File(Paths.cache, name),
    directory: Paths.cache.uri,
  };
}

export interface FitDeskBackup {
  version: number;
  exported_at: string;
  centers: Center[];
  class_types: ClassType[];
  organizers: Organizer[];
  trainees: Trainee[];
  class_series: ClassSeries[];
  series_trainees: SeriesTrainee[];
  class_sessions: ClassSession[];
  session_trainees: SessionTrainee[];
  organizer_payments: OrganizerPayment[];
  trainee_packages: TraineePackage[];
  settings: Setting[];
}

type LegacyClassSeries = Omit<ClassSeries, 'source_type' | 'organizer_id'> & {
  source_type: 'manager' | 'personal';
  manager_id?: number;
};

type LegacyOrganizerPayment = Omit<OrganizerPayment, 'organizer_id'> & {
  manager_id: number;
};

type LegacyFitDeskBackup = Omit<
  FitDeskBackup,
  'organizers' | 'class_series' | 'organizer_payments'
> & {
  managers: Organizer[];
  class_series: LegacyClassSeries[];
  manager_payments: LegacyOrganizerPayment[];
};

function normalizeLegacyBackup(backup: LegacyFitDeskBackup): FitDeskBackup {
  return {
    ...backup,
    organizers: backup.managers,
    class_series: backup.class_series.map((series) => ({
      ...series,
      source_type: series.source_type === 'manager' ? 'organizer' : 'personal',
      organizer_id: series.manager_id,
    })),
    organizer_payments: backup.manager_payments.map((payment) => ({
      ...payment,
      organizer_id: payment.manager_id,
    })),
  };
}

export async function exportData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `solo_class_hq_backup_${date}.fitdeskbackup`;
  const file = new File(Paths.cache, filename);
  if (file.exists) {
    file.delete();
  }

  const temp = await SQLite.openDatabaseAsync(filename, { useNewConnection: true }, Paths.cache.uri);
  try {
    await SQLite.backupDatabaseAsync({
      sourceDatabase: db,
      sourceDatabaseName: SQLITE_MAIN_DATABASE,
      destDatabase: temp,
      destDatabaseName: SQLITE_MAIN_DATABASE,
    });
  } finally {
    await temp.closeAsync();
  }

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing not available on this device');

  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'Export Solo Class HQ Backup',
  });

  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('last_backup_at', ?)",
    [new Date().toISOString()]
  );
}

export async function exportJsonData(): Promise<void> {
  const db = await getDatabase();

  const [
    centers,
    class_types,
    organizers,
    trainees,
    class_series,
    series_trainees,
    class_sessions,
    session_trainees,
    organizer_payments,
    trainee_packages,
    settings,
  ] = await Promise.all([
    db.getAllAsync<Center>('SELECT * FROM centers'),
    getAllClassTypes(),
    getAllOrganizers(),
    getAllTrainees(),
    getAllClassSeries(),
    db.getAllAsync<SeriesTrainee>('SELECT * FROM series_trainees'),
    db.getAllAsync<ClassSession>('SELECT * FROM class_sessions'),
    db.getAllAsync<SessionTrainee>('SELECT * FROM session_trainees'),
    db.getAllAsync<OrganizerPayment>('SELECT * FROM organizer_payments'),
    db.getAllAsync<TraineePackage>('SELECT * FROM trainee_packages'),
    db.getAllAsync<Setting>('SELECT * FROM settings'),
  ]);

  const backup: FitDeskBackup = {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    centers,
    class_types,
    organizers,
    trainees,
    class_series,
    series_trainees,
    class_sessions,
    session_trainees,
    organizer_payments,
    trainee_packages,
    settings,
  };

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `solo_class_hq_backup_${date}.json`;
  const file = new File(Paths.cache, filename);
  file.write(JSON.stringify(backup, null, 2));

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing not available on this device');

  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export Solo Class HQ Backup' });

  await db.runAsync(
    "INSERT OR REPLACE INTO settings (key, value) VALUES ('last_backup_at', ?)",
    [new Date().toISOString()]
  );
}

export async function pickAndImportData(): Promise<void> {
  const result = await File.pickFileAsync({ mimeTypes: SQLITE_BACKUP_MIME_TYPES });
  if (result.canceled) return;

  const pickedFile = result.result as File;
  if (pickedFile.name.toLowerCase().endsWith('.json')) {
    await importJsonFile(pickedFile);
    return;
  }

  await importSqliteFile(pickedFile);
}

async function importSqliteFile(file: File): Promise<void> {
  const temp = await copyPickedFileToCache(file);
  const sourceDb = await SQLite.openDatabaseAsync(temp.name, { useNewConnection: true }, temp.directory);
  try {
    await validateSqliteBackup(sourceDb);

    const db = await getDatabase();
    await SQLite.backupDatabaseAsync({
      sourceDatabase: sourceDb,
      sourceDatabaseName: SQLITE_MAIN_DATABASE,
      destDatabase: db,
      destDatabaseName: SQLITE_MAIN_DATABASE,
    });
    await db.execAsync('PRAGMA foreign_keys = ON;');
    await db.execAsync('PRAGMA journal_mode = WAL;');
    await runMigrations(db);
  } finally {
    await sourceDb.closeAsync();
    if (temp.file.exists) {
      try {
        temp.file.delete();
      } catch {
        // Best-effort cleanup only; import already completed or failed with the original error.
      }
    }
  }
}

async function copyPickedFileToCache(file: File): Promise<{ name: string; file: File; directory: string }> {
  const temp = sqliteTempFile('fitdesk_import');

  try {
    await file.copy(temp.file, { overwrite: true });
  } catch {
    temp.file.write(await file.bytes());
  }

  return temp;
}

async function validateSqliteBackup(db: SQLite.SQLiteDatabase): Promise<void> {
  const integrity = await db.getFirstAsync<{ integrity_check: string }>('PRAGMA integrity_check');
  if (integrity?.integrity_check !== 'ok') {
    throw new Error('Invalid backup: the file appears to be damaged');
  }

  const rows = await db.getAllAsync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table'"
  );
  const tableNames = new Set(rows.map((row) => row.name));
  const missingCommonTables = REQUIRED_COMMON_SQLITE_TABLES.filter((table) => !tableNames.has(table));
  const hasOrganizerTables =
    tableNames.has('organizers') && tableNames.has('organizer_payments');
  const hasLegacyTables =
    tableNames.has('managers') && tableNames.has('manager_payments');
  if (missingCommonTables.length > 0 || (!hasOrganizerTables && !hasLegacyTables)) {
    throw new Error('Invalid backup: not a supported Solo Class HQ or FitDesk backup file');
  }
}

async function importJsonFile(pickedFile: File): Promise<void> {
  const raw = await pickedFile.text();

  let parsed: FitDeskBackup | LegacyFitDeskBackup;
  try {
    parsed = JSON.parse(raw) as FitDeskBackup | LegacyFitDeskBackup;
  } catch {
    throw new Error('Invalid file: could not parse JSON');
  }

  if (parsed.version === 1) {
    await importDataV1(normalizeLegacyBackup(parsed as LegacyFitDeskBackup));
  } else if (parsed.version === 2 || parsed.version === 3) {
    await importData(normalizeLegacyBackup(parsed as LegacyFitDeskBackup));
  } else if (parsed.version === 4) {
    await importData(parsed as FitDeskBackup);
  } else {
    throw new Error(`Unsupported backup version: ${parsed.version}`);
  }
}

async function importData(backup: FitDeskBackup): Promise<void> {
  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync('DELETE FROM series_trainees');
    await txn.execAsync('DELETE FROM session_trainees');
    await txn.execAsync('DELETE FROM organizer_payments');
    await txn.execAsync('DELETE FROM trainee_packages');
    await txn.execAsync('DELETE FROM class_sessions');
    await txn.execAsync('DELETE FROM class_series');
    await txn.execAsync('DELETE FROM trainees');
    await txn.execAsync('DELETE FROM organizers');
    await txn.execAsync('DELETE FROM class_types');
    await txn.execAsync('DELETE FROM centers');
    await txn.execAsync('DELETE FROM settings');

    for (const r of backup.centers ?? []) {
      await txn.runAsync(
        'INSERT INTO centers (id, name, address, is_active, created_at) VALUES (?, ?, ?, ?, ?)',
        [r.id, r.name, r.address ?? null, r.is_active, r.created_at]
      );
    }
    for (const r of backup.class_types) {
      await txn.runAsync(
        'INSERT INTO class_types (id, name, color, is_active, created_at) VALUES (?, ?, ?, ?, ?)',
        [r.id, r.name, r.color, r.is_active ?? 1, r.created_at]
      );
    }
    for (const r of backup.organizers) {
      await txn.runAsync(
        'INSERT INTO organizers (id, name, contact_person, phone, email, per_class_rate, currency, notes, is_active, contact_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.name, r.contact_person ?? null, r.phone ?? null, r.email ?? null, r.per_class_rate, r.currency, r.notes ?? null, r.is_active ?? 1, r.contact_type ?? 'regular', r.created_at]
      );
    }
    for (const r of backup.trainees) {
      await txn.runAsync(
        'INSERT INTO trainees (id, name, phone, email, notes, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.name, r.phone ?? null, r.email ?? null, r.notes ?? null, r.is_active ?? 1, r.created_at]
      );
    }
    for (const r of backup.class_series) {
      await txn.runAsync(
        'INSERT INTO class_series (id, title, class_type_id, source_type, organizer_id, recurrence_type, recurrence_days, start_date, end_date, class_time, duration_minutes, location_type, location, notes, is_active, center_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.title, r.class_type_id, r.source_type, r.organizer_id ?? null, r.recurrence_type, r.recurrence_days ?? null, r.start_date, r.end_date ?? null, r.class_time, r.duration_minutes, r.location_type, r.location ?? null, r.notes ?? null, r.is_active, r.center_id ?? null, r.created_at]
      );
    }
    for (const r of backup.series_trainees ?? []) {
      await txn.runAsync(
        'INSERT INTO series_trainees (id, series_id, trainee_id) VALUES (?, ?, ?)',
        [r.id, r.series_id, r.trainee_id]
      );
    }
    for (const r of backup.class_sessions) {
      await txn.runAsync(
        'INSERT INTO class_sessions (id, series_id, session_date, class_time, status, student_count, notes, guest_name, center_id, agreed_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.series_id, r.session_date, r.class_time, r.status, r.student_count, r.notes ?? null, r.guest_name ?? null, r.center_id ?? null, r.agreed_amount ?? null, r.created_at]
      );
    }
    for (const r of backup.session_trainees) {
      await txn.runAsync(
        'INSERT INTO session_trainees (id, session_id, trainee_id) VALUES (?, ?, ?)',
        [r.id, r.session_id, r.trainee_id]
      );
    }
    for (const r of backup.organizer_payments) {
      await txn.runAsync(
        'INSERT INTO organizer_payments (id, session_id, organizer_id, amount, status, paid_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.session_id, r.organizer_id, r.amount, r.status, r.paid_date ?? null, r.notes ?? null, r.created_at]
      );
    }
    for (const r of backup.trainee_packages) {
      await txn.runAsync(
        'INSERT INTO trainee_packages (id, trainee_id, series_id, month, total_sessions, used_sessions, amount, status, paid_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.trainee_id, r.series_id ?? null, r.month, r.total_sessions, r.used_sessions, r.amount, r.status, r.paid_date ?? null, r.notes ?? null, r.created_at]
      );
    }
    for (const r of backup.settings) {
      await txn.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?)',
        [r.key, r.value]
      );
    }
  });
}

// Handles v1 backups (pre-refactor: no centers, series_trainees, guest_name, center_id, is_active columns)
async function importDataV1(backup: FitDeskBackup): Promise<void> {
  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync('DELETE FROM series_trainees');
    await txn.execAsync('DELETE FROM session_trainees');
    await txn.execAsync('DELETE FROM organizer_payments');
    await txn.execAsync('DELETE FROM trainee_packages');
    await txn.execAsync('DELETE FROM class_sessions');
    await txn.execAsync('DELETE FROM class_series');
    await txn.execAsync('DELETE FROM trainees');
    await txn.execAsync('DELETE FROM organizers');
    await txn.execAsync('DELETE FROM class_types');
    await txn.execAsync('DELETE FROM centers');
    await txn.execAsync('DELETE FROM settings');

    for (const r of backup.class_types) {
      await txn.runAsync(
        'INSERT INTO class_types (id, name, color, is_active, created_at) VALUES (?, ?, ?, 1, ?)',
        [r.id, r.name, r.color, r.created_at]
      );
    }
    for (const r of backup.organizers) {
      await txn.runAsync(
        'INSERT INTO organizers (id, name, contact_person, phone, email, per_class_rate, currency, notes, is_active, contact_type, created_at) VALUES (?, ?, NULL, ?, ?, ?, ?, ?, 1, ?, ?)',
        [r.id, r.name, r.phone ?? null, r.email ?? null, r.per_class_rate, r.currency, r.notes ?? null, 'regular', r.created_at]
      );
    }
    for (const r of backup.trainees) {
      await txn.runAsync(
        'INSERT INTO trainees (id, name, phone, email, notes, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)',
        [r.id, r.name, r.phone ?? null, r.email ?? null, r.notes ?? null, r.created_at]
      );
    }
    for (const r of backup.class_series) {
      await txn.runAsync(
        'INSERT INTO class_series (id, title, class_type_id, source_type, organizer_id, recurrence_type, recurrence_days, start_date, end_date, class_time, duration_minutes, location_type, location, notes, is_active, center_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)',
        [r.id, r.title, r.class_type_id, r.source_type, r.organizer_id ?? null, r.recurrence_type, r.recurrence_days ?? null, r.start_date, r.end_date ?? null, r.class_time, r.duration_minutes, r.location_type, r.location ?? null, r.notes ?? null, r.is_active, r.created_at]
      );
    }
    for (const r of backup.class_sessions) {
      await txn.runAsync(
        'INSERT INTO class_sessions (id, series_id, session_date, class_time, status, student_count, notes, guest_name, center_id, agreed_amount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?)',
        [r.id, r.series_id, r.session_date, r.class_time, r.status, r.student_count, r.notes ?? null, r.created_at]
      );
    }
    for (const r of backup.session_trainees) {
      await txn.runAsync(
        'INSERT INTO session_trainees (id, session_id, trainee_id) VALUES (?, ?, ?)',
        [r.id, r.session_id, r.trainee_id]
      );
    }
    for (const r of backup.organizer_payments) {
      await txn.runAsync(
        'INSERT INTO organizer_payments (id, session_id, organizer_id, amount, status, paid_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.session_id, r.organizer_id, r.amount, r.status, r.paid_date ?? null, r.notes ?? null, r.created_at]
      );
    }
    for (const r of backup.trainee_packages) {
      await txn.runAsync(
        'INSERT INTO trainee_packages (id, trainee_id, month, total_sessions, used_sessions, amount, status, paid_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.trainee_id, r.month, r.total_sessions, r.used_sessions, r.amount, r.status, r.paid_date ?? null, r.notes ?? null, r.created_at]
      );
    }
    for (const r of backup.settings) {
      await txn.runAsync(
        'INSERT INTO settings (key, value) VALUES (?, ?)',
        [r.key, r.value]
      );
    }
  });
}
