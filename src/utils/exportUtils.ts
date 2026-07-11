import { File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../database/db';
import { runMigrations } from '../database/migrations';
import { getAllClassTypes } from '../database/repositories/classTypeRepository';
import { getAllManagers } from '../database/repositories/managerRepository';
import { getAllTrainees } from '../database/repositories/traineeRepository';
import { getAllClassSeries } from '../database/repositories/classSeriesRepository';
import {
  Center, ClassType, Manager, Trainee, ClassSeries, SeriesTrainee,
  ClassSession, SessionTrainee, ManagerPayment, TraineePackage, Setting,
} from '../types';

const BACKUP_VERSION = 2;
const SQLITE_BACKUP_MIME_TYPES = [
  'application/vnd.sqlite3',
  'application/x-sqlite3',
  'application/octet-stream',
  'application/json',
];
const REQUIRED_SQLITE_TABLES = [
  'centers',
  'class_types',
  'managers',
  'trainees',
  'class_series',
  'series_trainees',
  'class_sessions',
  'session_trainees',
  'manager_payments',
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
  managers: Manager[];
  trainees: Trainee[];
  class_series: ClassSeries[];
  series_trainees: SeriesTrainee[];
  class_sessions: ClassSession[];
  session_trainees: SessionTrainee[];
  manager_payments: ManagerPayment[];
  trainee_packages: TraineePackage[];
  settings: Setting[];
}

export async function exportData(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('PRAGMA wal_checkpoint(TRUNCATE);');

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `fitdesk_backup_${date}.fitdeskbackup`;
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
    dialogTitle: 'Export FitDesk Backup',
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
    managers,
    trainees,
    class_series,
    series_trainees,
    class_sessions,
    session_trainees,
    manager_payments,
    trainee_packages,
    settings,
  ] = await Promise.all([
    db.getAllAsync<Center>('SELECT * FROM centers'),
    getAllClassTypes(),
    getAllManagers(),
    getAllTrainees(),
    getAllClassSeries(),
    db.getAllAsync<SeriesTrainee>('SELECT * FROM series_trainees'),
    db.getAllAsync<ClassSession>('SELECT * FROM class_sessions'),
    db.getAllAsync<SessionTrainee>('SELECT * FROM session_trainees'),
    db.getAllAsync<ManagerPayment>('SELECT * FROM manager_payments'),
    db.getAllAsync<TraineePackage>('SELECT * FROM trainee_packages'),
    db.getAllAsync<Setting>('SELECT * FROM settings'),
  ]);

  const backup: FitDeskBackup = {
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    centers,
    class_types,
    managers,
    trainees,
    class_series,
    series_trainees,
    class_sessions,
    session_trainees,
    manager_payments,
    trainee_packages,
    settings,
  };

  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const filename = `fitdesk_backup_${date}.json`;
  const file = new File(Paths.cache, filename);
  file.write(JSON.stringify(backup, null, 2));

  const canShare = await Sharing.isAvailableAsync();
  if (!canShare) throw new Error('Sharing not available on this device');

  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Export FitDesk Backup' });

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
  const missingTables = REQUIRED_SQLITE_TABLES.filter((table) => !tableNames.has(table));
  if (missingTables.length > 0) {
    throw new Error('Invalid backup: not a FitDesk backup file');
  }
}

async function importJsonFile(pickedFile: File): Promise<void> {
  const raw = await pickedFile.text();

  let backup: FitDeskBackup;
  try {
    backup = JSON.parse(raw);
  } catch {
    throw new Error('Invalid file: could not parse JSON');
  }

  if (backup.version === 1) {
    await importDataV1(backup);
  } else if (backup.version === 2) {
    await importData(backup);
  } else {
    throw new Error(`Unsupported backup version: ${backup.version}`);
  }
}

async function importData(backup: FitDeskBackup): Promise<void> {
  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync('DELETE FROM series_trainees');
    await txn.execAsync('DELETE FROM session_trainees');
    await txn.execAsync('DELETE FROM manager_payments');
    await txn.execAsync('DELETE FROM trainee_packages');
    await txn.execAsync('DELETE FROM class_sessions');
    await txn.execAsync('DELETE FROM class_series');
    await txn.execAsync('DELETE FROM trainees');
    await txn.execAsync('DELETE FROM managers');
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
    for (const r of backup.managers) {
      await txn.runAsync(
        'INSERT INTO managers (id, name, phone, email, per_class_rate, currency, notes, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.name, r.phone ?? null, r.email ?? null, r.per_class_rate, r.currency, r.notes ?? null, r.is_active ?? 1, r.created_at]
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
        'INSERT INTO class_series (id, title, class_type_id, source_type, manager_id, recurrence_type, recurrence_days, start_date, end_date, class_time, duration_minutes, location_type, location, notes, is_active, center_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.title, r.class_type_id, r.source_type, r.manager_id ?? null, r.recurrence_type, r.recurrence_days ?? null, r.start_date, r.end_date ?? null, r.class_time, r.duration_minutes, r.location_type, r.location ?? null, r.notes ?? null, r.is_active, r.center_id ?? null, r.created_at]
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
        'INSERT INTO class_sessions (id, series_id, session_date, class_time, status, student_count, notes, guest_name, center_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.series_id, r.session_date, r.class_time, r.status, r.student_count, r.notes ?? null, r.guest_name ?? null, r.center_id ?? null, r.created_at]
      );
    }
    for (const r of backup.session_trainees) {
      await txn.runAsync(
        'INSERT INTO session_trainees (id, session_id, trainee_id) VALUES (?, ?, ?)',
        [r.id, r.session_id, r.trainee_id]
      );
    }
    for (const r of backup.manager_payments) {
      await txn.runAsync(
        'INSERT INTO manager_payments (id, session_id, manager_id, amount, status, paid_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.session_id, r.manager_id, r.amount, r.status, r.paid_date ?? null, r.notes ?? null, r.created_at]
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

// Handles v1 backups (pre-refactor: no centers, series_trainees, guest_name, center_id, is_active columns)
async function importDataV1(backup: FitDeskBackup): Promise<void> {
  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync('DELETE FROM series_trainees');
    await txn.execAsync('DELETE FROM session_trainees');
    await txn.execAsync('DELETE FROM manager_payments');
    await txn.execAsync('DELETE FROM trainee_packages');
    await txn.execAsync('DELETE FROM class_sessions');
    await txn.execAsync('DELETE FROM class_series');
    await txn.execAsync('DELETE FROM trainees');
    await txn.execAsync('DELETE FROM managers');
    await txn.execAsync('DELETE FROM class_types');
    await txn.execAsync('DELETE FROM centers');
    await txn.execAsync('DELETE FROM settings');

    for (const r of backup.class_types) {
      await txn.runAsync(
        'INSERT INTO class_types (id, name, color, is_active, created_at) VALUES (?, ?, ?, 1, ?)',
        [r.id, r.name, r.color, r.created_at]
      );
    }
    for (const r of backup.managers) {
      await txn.runAsync(
        'INSERT INTO managers (id, name, phone, email, per_class_rate, currency, notes, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)',
        [r.id, r.name, r.phone ?? null, r.email ?? null, r.per_class_rate, r.currency, r.notes ?? null, r.created_at]
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
        'INSERT INTO class_series (id, title, class_type_id, source_type, manager_id, recurrence_type, recurrence_days, start_date, end_date, class_time, duration_minutes, location_type, location, notes, is_active, center_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)',
        [r.id, r.title, r.class_type_id, r.source_type, r.manager_id ?? null, r.recurrence_type, r.recurrence_days ?? null, r.start_date, r.end_date ?? null, r.class_time, r.duration_minutes, r.location_type, r.location ?? null, r.notes ?? null, r.is_active, r.created_at]
      );
    }
    for (const r of backup.class_sessions) {
      await txn.runAsync(
        'INSERT INTO class_sessions (id, series_id, session_date, class_time, status, student_count, notes, guest_name, center_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)',
        [r.id, r.series_id, r.session_date, r.class_time, r.status, r.student_count, r.notes ?? null, r.created_at]
      );
    }
    for (const r of backup.session_trainees) {
      await txn.runAsync(
        'INSERT INTO session_trainees (id, session_id, trainee_id) VALUES (?, ?, ?)',
        [r.id, r.session_id, r.trainee_id]
      );
    }
    for (const r of backup.manager_payments) {
      await txn.runAsync(
        'INSERT INTO manager_payments (id, session_id, manager_id, amount, status, paid_date, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.session_id, r.manager_id, r.amount, r.status, r.paid_date ?? null, r.notes ?? null, r.created_at]
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
