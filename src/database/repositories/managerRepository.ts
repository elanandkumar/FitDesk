import { getDatabase } from '../db';
import { Manager } from '../../types';

type ManagerInput = Omit<Manager, 'id' | 'created_at'>;

export async function getAllManagers(): Promise<Manager[]> {
  const db = await getDatabase();
  return db.getAllAsync<Manager>('SELECT * FROM managers ORDER BY name ASC');
}

export async function getManagerById(id: number): Promise<Manager | null> {
  const db = await getDatabase();
  return (await db.getFirstAsync<Manager>('SELECT * FROM managers WHERE id = ?', [id])) ?? null;
}

export async function createManager(data: ManagerInput): Promise<Manager> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO managers (name, phone, email, per_class_rate, currency, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [data.name, data.phone ?? null, data.email ?? null, data.per_class_rate, data.currency, data.notes ?? null, now]
  );
  return { ...data, id: result.lastInsertRowId, created_at: now };
}

export async function updateManager(id: number, data: ManagerInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE managers SET name=?, phone=?, email=?, per_class_rate=?, currency=?, notes=? WHERE id=?',
    [data.name, data.phone ?? null, data.email ?? null, data.per_class_rate, data.currency, data.notes ?? null, id]
  );
}

export async function deleteManager(id: number): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM manager_payments WHERE manager_id = ?', [id]);
    await db.runAsync(
      `DELETE FROM session_trainees WHERE session_id IN (
         SELECT id FROM class_sessions WHERE series_id IN (
           SELECT id FROM class_series WHERE manager_id = ?
         )
       )`,
      [id]
    );
    await db.runAsync(
      `DELETE FROM class_sessions WHERE series_id IN (
         SELECT id FROM class_series WHERE manager_id = ?
       )`,
      [id]
    );
    await db.runAsync('DELETE FROM class_series WHERE manager_id = ?', [id]);
    await db.runAsync('DELETE FROM managers WHERE id = ?', [id]);
  });
}
