import { getDatabase } from '../db';
import { Manager } from '../../types';

type ManagerInput = Omit<Manager, 'id' | 'created_at' | 'is_active'>;

export async function getAllManagers(): Promise<Manager[]> {
  const db = await getDatabase();
  return db.getAllAsync<Manager>('SELECT * FROM managers WHERE is_active = 1 ORDER BY name ASC');
}

export async function getManagerById(id: number): Promise<Manager | null> {
  const db = await getDatabase();
  return (await db.getFirstAsync<Manager>('SELECT * FROM managers WHERE id = ?', [id])) ?? null;
}

export async function createManager(data: ManagerInput): Promise<Manager> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO managers (name, phone, email, per_class_rate, currency, notes, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)',
    [data.name, data.phone ?? null, data.email ?? null, data.per_class_rate, data.currency, data.notes ?? null, now]
  );
  return { ...data, id: result.lastInsertRowId, is_active: 1, created_at: now };
}

export async function updateManager(id: number, data: ManagerInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE managers SET name=?, phone=?, email=?, per_class_rate=?, currency=?, notes=? WHERE id=?',
    [data.name, data.phone ?? null, data.email ?? null, data.per_class_rate, data.currency, data.notes ?? null, id]
  );
}

export async function getUpcomingSessionCountForManager(id: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM class_sessions cs
     JOIN class_series ser ON cs.series_id = ser.id
     WHERE ser.manager_id = ? AND cs.status = 'upcoming'`,
    [id]
  );
  return row?.cnt ?? 0;
}

export async function softDeleteManager(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE managers SET is_active = 0 WHERE id = ?', [id]);
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
