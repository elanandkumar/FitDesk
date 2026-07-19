import { getDatabase } from '../db';

export async function hasBackupRelevantData(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    `SELECT (
      (SELECT COUNT(*) FROM centers) +
      (SELECT COUNT(*) FROM managers) +
      (SELECT COUNT(*) FROM trainees) +
      (SELECT COUNT(*) FROM class_series) +
      (SELECT COUNT(*) FROM class_sessions) +
      (SELECT COUNT(*) FROM manager_payments) +
      (SELECT COUNT(*) FROM trainee_packages)
    ) AS count`
  );

  return (row?.count ?? 0) > 0;
}
