import Constants from 'expo-constants';
import { getDatabase } from '../database/db';
import { insertNotificationIfNew } from '../database/repositories/appNotificationRepository';

const isExpoGo = Constants.appOwnership === 'expo';

const PAYMENT_TIER_REMINDER_ID = 'fitdesk-payment-tier-reminder';
const PAYMENT_TIER_HIGH_ID = 'fitdesk-payment-tier-high';
const PAYMENT_TIER_URGENT_ID = 'fitdesk-payment-tier-urgent';
const BACKUP_REMINDER_ID = 'fitdesk-backup-reminder';
const BACKUP_OVERDUE_DAYS = 7;

interface UpcomingSession {
  id: number;
  session_date: string;
  class_time: string;
  series_title: string;
}

export async function schedulePendingPaymentNotification(): Promise<void> {
  if (isExpoGo) return;

  const Notifications = await import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const db = await getDatabase();

  const enabledRow = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'payment_notification_enabled'"
  );

  for (const id of [PAYMENT_TIER_REMINDER_ID, PAYMENT_TIER_HIGH_ID, PAYMENT_TIER_URGENT_ID]) {
    try { await Notifications.cancelScheduledNotificationAsync(id); } catch { /* no-op */ }
  }

  if (enabledRow?.value !== 'true') return;

  const [reminderRow, highRow, urgentRow, timeRow] = await Promise.all([
    db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'payment_threshold_reminder'"),
    db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'payment_threshold_high'"),
    db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'payment_threshold_urgent'"),
    db.getFirstAsync<{ value: string }>("SELECT value FROM settings WHERE key = 'payment_notification_time'"),
  ]);

  const thresholdReminder = parseInt(reminderRow?.value ?? '3', 10);
  const thresholdHigh = parseInt(highRow?.value ?? '10', 10);
  const thresholdUrgent = parseInt(urgentRow?.value ?? '15', 10);

  const managerDays = await db.getAllAsync<{ days: number }>(
    `SELECT CAST(julianday('now') - julianday(cs.session_date) AS INTEGER) AS days
     FROM manager_payments mp
     JOIN class_sessions cs ON mp.session_id = cs.id
     WHERE mp.status = 'pending'`
  );
  const traineeDays = await db.getAllAsync<{ days: number }>(
    `SELECT CAST(julianday('now') - julianday(month || '-01', '+1 month', '-1 day') AS INTEGER) AS days
     FROM trainee_packages
     WHERE status = 'pending'`
  );

  const allDays = [...managerDays, ...traineeDays].map((r) => r.days);

  const reminderCount = allDays.filter((d) => d >= thresholdReminder && d < thresholdHigh).length;
  const highCount = allDays.filter((d) => d >= thresholdHigh && d < thresholdUrgent).length;
  const urgentCount = allDays.filter((d) => d >= thresholdUrgent).length;

  const [notifHour, notifMin] = (timeRow?.value ?? '09:00').split(':').map(Number);
  const now = new Date();

  async function scheduleTier(
    id: string,
    count: number,
    title: string,
    body: string,
  ): Promise<void> {
    if (count === 0) return;
    const notifyAt = new Date(now);
    notifyAt.setHours(notifHour, notifMin, 0, 0);
    if (notifyAt <= now) notifyAt.setDate(notifyAt.getDate() + 1);
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title, body, data: { type: 'payment-reminder' } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: notifyAt },
    });
  }

  const p = (n: number) => `${n} payment${n === 1 ? '' : 's'}`;

  await scheduleTier(PAYMENT_TIER_REMINDER_ID, reminderCount,
    'Payment Due', `${p(reminderCount)} due — collect soon`);
  await scheduleTier(PAYMENT_TIER_HIGH_ID, highCount,
    'Payment Overdue', `${p(highCount)} overdue — ${thresholdHigh}+ days unpaid`);
  await scheduleTier(PAYMENT_TIER_URGENT_ID, urgentCount,
    'Urgent: Payment Overdue', `${p(urgentCount)} unpaid for ${thresholdUrgent}+ days`);

  if (reminderCount > 0)
    await insertNotificationIfNew('payment_reminder', 'Payment Due',
      `${p(reminderCount)} due — collect soon`).catch(() => {});
  if (highCount > 0)
    await insertNotificationIfNew('payment_overdue', 'Payment Overdue',
      `${p(highCount)} overdue — ${thresholdHigh}+ days unpaid`).catch(() => {});
  if (urgentCount > 0)
    await insertNotificationIfNew('payment_urgent', 'Urgent: Payment Overdue',
      `${p(urgentCount)} unpaid for ${thresholdUrgent}+ days`).catch(() => {});
}

export async function scheduleBackupReminderNotification(): Promise<void> {
  if (isExpoGo) return;

  const Notifications = await import('expo-notifications');

  try {
    await Notifications.cancelScheduledNotificationAsync(BACKUP_REMINDER_ID);
  } catch {
    // no-op
  }

  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'last_backup_at'"
  );

  const now = new Date();
  let notifyAt: Date;

  if (!row?.value) {
    notifyAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else {
    const sevenDaysAfter = new Date(new Date(row.value).getTime() + BACKUP_OVERDUE_DAYS * 24 * 60 * 60 * 1000);
    notifyAt = sevenDaysAfter > now ? sevenDaysAfter : new Date(now.getTime() + 24 * 60 * 60 * 1000);
  }

  await Notifications.scheduleNotificationAsync({
    identifier: BACKUP_REMINDER_ID,
    content: {
      title: 'Back up FitDesk',
      body: "Your data hasn't been backed up in a while. Tap to export.",
      data: { type: 'backup-reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: notifyAt,
    },
  });
}

export async function scheduleUpcomingNotifications(): Promise<void> {
  if (isExpoGo) return;

  const Notifications = await import('expo-notifications');

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const db = await getDatabase();

  const enabledRow = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'notification_enabled'"
  );
  if (enabledRow?.value !== 'true') {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }

  const minutesRow = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'notification_minutes_before'"
  );
  const minutesBefore = parseInt(minutesRow?.value ?? '60', 10);

  await Notifications.cancelAllScheduledNotificationsAsync();

  const sessions = await db.getAllAsync<UpcomingSession>(
    `SELECT cs.id, cs.session_date, cs.class_time, ser.title AS series_title
     FROM class_sessions cs
     JOIN class_series ser ON cs.series_id = ser.id
     WHERE cs.status = 'upcoming'
     ORDER BY cs.session_date ASC`
  );

  const now = new Date();
  for (const session of sessions) {
    const [h, m] = session.class_time.split(':').map(Number);
    const sessionAt = new Date(session.session_date + 'T00:00:00');
    sessionAt.setHours(h, m, 0, 0);

    const notifyAt = new Date(sessionAt.getTime() - minutesBefore * 60 * 1000);
    if (notifyAt <= now) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Class in ${minutesBefore} min`,
        body: session.series_title,
        data: { sessionId: session.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: notifyAt,
      },
    });
  }
}
