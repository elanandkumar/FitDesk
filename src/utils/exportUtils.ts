import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getDatabase } from '../database/db';
import { getAllClassTypes } from '../database/repositories/classTypeRepository';
import { getAllManagers } from '../database/repositories/managerRepository';
import { getAllTrainees } from '../database/repositories/traineeRepository';
import { getAllClassSeries } from '../database/repositories/classSeriesRepository';
import {
  ClassType, Manager, Trainee, ClassSeries,
  ClassSession, SessionTrainee, ManagerPayment, TraineePackage, Setting,
} from '../types';

export interface FitDeskBackup {
  version: number;
  exported_at: string;
  class_types: ClassType[];
  managers: Manager[];
  trainees: Trainee[];
  class_series: ClassSeries[];
  class_sessions: ClassSession[];
  session_trainees: SessionTrainee[];
  manager_payments: ManagerPayment[];
  trainee_packages: TraineePackage[];
  settings: Setting[];
}

export async function exportData(): Promise<void> {
  const db = await getDatabase();

  const [
    class_types,
    managers,
    trainees,
    class_series,
    class_sessions,
    session_trainees,
    manager_payments,
    trainee_packages,
    settings,
  ] = await Promise.all([
    getAllClassTypes(),
    getAllManagers(),
    getAllTrainees(),
    getAllClassSeries(),
    db.getAllAsync<ClassSession>('SELECT * FROM class_sessions'),
    db.getAllAsync<SessionTrainee>('SELECT * FROM session_trainees'),
    db.getAllAsync<ManagerPayment>('SELECT * FROM manager_payments'),
    db.getAllAsync<TraineePackage>('SELECT * FROM trainee_packages'),
    db.getAllAsync<Setting>('SELECT * FROM settings'),
  ]);

  const backup: FitDeskBackup = {
    version: 1,
    exported_at: new Date().toISOString(),
    class_types,
    managers,
    trainees,
    class_series,
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
}

export async function pickAndImportData(): Promise<void> {
  const result = await File.pickFileAsync({ mimeTypes: ['application/json'] });
  if (result.canceled) return;

  const pickedFile = result.result as File;
  const raw = await pickedFile.text();

  let backup: FitDeskBackup;
  try {
    backup = JSON.parse(raw);
  } catch {
    throw new Error('Invalid file: could not parse JSON');
  }

  if (backup.version !== 1) {
    throw new Error(`Unsupported backup version: ${backup.version}`);
  }

  await importData(backup);
}

async function importData(backup: FitDeskBackup): Promise<void> {
  const db = await getDatabase();

  await db.withExclusiveTransactionAsync(async (txn) => {
    await txn.execAsync('DELETE FROM session_trainees');
    await txn.execAsync('DELETE FROM manager_payments');
    await txn.execAsync('DELETE FROM trainee_packages');
    await txn.execAsync('DELETE FROM class_sessions');
    await txn.execAsync('DELETE FROM class_series');
    await txn.execAsync('DELETE FROM trainees');
    await txn.execAsync('DELETE FROM managers');
    await txn.execAsync('DELETE FROM class_types');
    await txn.execAsync('DELETE FROM settings');

    for (const r of backup.class_types) {
      await txn.runAsync(
        'INSERT INTO class_types (id, name, color, created_at) VALUES (?, ?, ?, ?)',
        [r.id, r.name, r.color, r.created_at]
      );
    }
    for (const r of backup.managers) {
      await txn.runAsync(
        'INSERT INTO managers (id, name, phone, email, per_class_rate, currency, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.name, r.phone ?? null, r.email ?? null, r.per_class_rate, r.currency, r.notes ?? null, r.created_at]
      );
    }
    for (const r of backup.trainees) {
      await txn.runAsync(
        'INSERT INTO trainees (id, name, phone, email, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [r.id, r.name, r.phone ?? null, r.email ?? null, r.notes ?? null, r.created_at]
      );
    }
    for (const r of backup.class_series) {
      await txn.runAsync(
        'INSERT INTO class_series (id, title, class_type_id, source_type, manager_id, recurrence_type, recurrence_days, start_date, end_date, class_time, duration_minutes, location_type, location, notes, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [r.id, r.title, r.class_type_id, r.source_type, r.manager_id ?? null, r.recurrence_type, r.recurrence_days ?? null, r.start_date, r.end_date ?? null, r.class_time, r.duration_minutes, r.location_type, r.location ?? null, r.notes ?? null, r.is_active, r.created_at]
      );
    }
    for (const r of backup.class_sessions) {
      await txn.runAsync(
        'INSERT INTO class_sessions (id, series_id, session_date, class_time, status, student_count, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
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
