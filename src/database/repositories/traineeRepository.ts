import { getDatabase } from '../db';
import { Trainee } from '../../types';

type TraineeInput = Omit<Trainee, 'id' | 'created_at'>;

export async function getAllTrainees(): Promise<Trainee[]> {
  const db = await getDatabase();
  return db.getAllAsync<Trainee>('SELECT * FROM trainees ORDER BY name ASC');
}

export async function getTraineeById(id: number): Promise<Trainee | null> {
  const db = await getDatabase();
  return (await db.getFirstAsync<Trainee>('SELECT * FROM trainees WHERE id = ?', [id])) ?? null;
}

export async function createTrainee(data: TraineeInput): Promise<Trainee> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO trainees (name, phone, email, notes, created_at) VALUES (?, ?, ?, ?, ?)',
    [data.name, data.phone ?? null, data.email ?? null, data.notes ?? null, now]
  );
  return { ...data, id: result.lastInsertRowId, created_at: now };
}

export async function updateTrainee(id: number, data: TraineeInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE trainees SET name=?, phone=?, email=?, notes=? WHERE id=?',
    [data.name, data.phone ?? null, data.email ?? null, data.notes ?? null, id]
  );
}

export async function deleteTrainee(id: number): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM session_trainees WHERE trainee_id = ?', [id]);
    await db.runAsync('DELETE FROM trainee_packages WHERE trainee_id = ?', [id]);
    await db.runAsync('DELETE FROM trainees WHERE id = ?', [id]);
  });
}
