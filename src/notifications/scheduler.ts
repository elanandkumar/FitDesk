import Constants from 'expo-constants';
import { getDatabase } from '../database/db';

const isExpoGo = Constants.appOwnership === 'expo';

interface UpcomingSession {
  id: number;
  session_date: string;
  class_time: string;
  series_title: string;
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
