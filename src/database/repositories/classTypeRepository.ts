import { getDatabase } from '../db';
import { ClassType } from '../../types';

export async function getAllClassTypes(): Promise<ClassType[]> {
  const db = await getDatabase();
  return db.getAllAsync<ClassType>('SELECT * FROM class_types ORDER BY name ASC');
}

export async function getClassTypeById(id: number): Promise<ClassType | null> {
  const db = await getDatabase();
  return (await db.getFirstAsync<ClassType>('SELECT * FROM class_types WHERE id = ?', [id])) ?? null;
}

export async function createClassType(name: string, color: string): Promise<ClassType> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO class_types (name, color, created_at) VALUES (?, ?, ?)',
    [name, color, now]
  );
  return { id: result.lastInsertRowId, name, color, created_at: now };
}

export async function updateClassType(id: number, name: string, color: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE class_types SET name = ?, color = ? WHERE id = ?', [name, color, id]);
}

export async function deleteClassType(id: number): Promise<void> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM class_series WHERE class_type_id = ?',
    [id]
  );
  if ((row?.count ?? 0) > 0) {
    throw new Error('CLASS_TYPE_IN_USE');
  }
  await db.runAsync('DELETE FROM class_types WHERE id = ?', [id]);
}
