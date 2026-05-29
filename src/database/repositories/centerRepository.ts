import { getDatabase } from '../db';
import { Center } from '../../types';

type CenterInput = Omit<Center, 'id' | 'created_at'>;

export async function getAllCenters(): Promise<Center[]> {
  const db = await getDatabase();
  return db.getAllAsync<Center>(
    'SELECT * FROM centers WHERE is_active = 1 ORDER BY name ASC'
  );
}

export async function getCenterById(id: number): Promise<Center | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<Center>('SELECT * FROM centers WHERE id = ?', [id])) ?? null
  );
}

export async function createCenter(data: Pick<Center, 'name' | 'address'>): Promise<Center> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO centers (name, address, is_active, created_at) VALUES (?, ?, 1, ?)',
    [data.name, data.address ?? null, now]
  );
  return { id: result.lastInsertRowId, name: data.name, address: data.address, is_active: 1, created_at: now };
}

export async function updateCenter(id: number, data: Pick<Center, 'name' | 'address'>): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE centers SET name=?, address=? WHERE id=?',
    [data.name, data.address ?? null, id]
  );
}

export async function deleteCenter(id: number): Promise<void> {
  const db = await getDatabase();
  const inUse = await db.getFirstAsync<{ n: number }>(
    `SELECT COUNT(*) AS n FROM class_series WHERE center_id = ?
     UNION ALL
     SELECT COUNT(*) AS n FROM class_sessions WHERE center_id = ?
     LIMIT 1`,
    [id, id]
  );
  if (inUse && inUse.n > 0) {
    await db.runAsync('UPDATE centers SET is_active = 0 WHERE id = ?', [id]);
  } else {
    await db.runAsync('DELETE FROM centers WHERE id = ?', [id]);
  }
}
