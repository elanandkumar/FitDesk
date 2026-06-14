import { getDatabase } from '../db';
import { AppNotification, AppNotificationType } from '../../types';

export async function insertNotificationIfNew(
  type: AppNotificationType,
  title: string,
  body: string
): Promise<void> {
  const db = await getDatabase();
  const today = new Date().toISOString().slice(0, 10);
  const existing = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM app_notifications WHERE type = ? AND created_at LIKE ?",
    [type, today + '%']
  );
  if ((existing?.count ?? 0) > 0) return;
  await db.runAsync(
    'INSERT INTO app_notifications (type, title, body, created_at) VALUES (?, ?, ?, ?)',
    [type, title, body, new Date().toISOString()]
  );
}

export async function getRecentNotifications(): Promise<AppNotification[]> {
  const db = await getDatabase();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  return db.getAllAsync<AppNotification>(
    'SELECT * FROM app_notifications WHERE created_at >= ? ORDER BY created_at DESC',
    [cutoff]
  );
}

export async function getUnreadCount(): Promise<number> {
  const db = await getDatabase();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM app_notifications WHERE read_at IS NULL AND created_at >= ?',
    [cutoff]
  );
  return row?.count ?? 0;
}

export async function markAllRead(): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE app_notifications SET read_at = ? WHERE read_at IS NULL",
    [new Date().toISOString()]
  );
}

export async function purgeOldNotifications(): Promise<void> {
  const db = await getDatabase();
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  await db.runAsync('DELETE FROM app_notifications WHERE created_at < ?', [cutoff]);
}
