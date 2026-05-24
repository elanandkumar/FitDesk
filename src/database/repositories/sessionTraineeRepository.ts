import { getDatabase } from '../db';
import { Trainee } from '../../types';

export async function getTraineesForSession(sessionId: number): Promise<Trainee[]> {
  const db = await getDatabase();
  return db.getAllAsync<Trainee>(
    `SELECT t.* FROM trainees t
     JOIN session_trainees st ON st.trainee_id = t.id
     WHERE st.session_id = ?
     ORDER BY t.name ASC`,
    [sessionId]
  );
}

export async function setTraineesForSession(
  sessionId: number,
  traineeIds: number[]
): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM session_trainees WHERE session_id = ?', [sessionId]);
    for (const tid of traineeIds) {
      await db.runAsync(
        'INSERT OR IGNORE INTO session_trainees (session_id, trainee_id) VALUES (?, ?)',
        [sessionId, tid]
      );
    }
  });
}
