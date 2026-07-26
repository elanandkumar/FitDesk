import { getDatabase } from '../db';
import { ClassSession, EnrichedSession, LocationType, SessionStatus, SourceType } from '../../types';
import { isSessionInFuture } from '../../utils/dateUtils';

const ENRICHED_SELECT = `
  SELECT
    cs.id, cs.series_id, cs.session_date, cs.class_time, cs.status,
    cs.student_count, cs.notes, cs.guest_name, cs.center_id, cs.agreed_amount,
    (SELECT mp.amount
     FROM organizer_payments mp
     WHERE mp.session_id = cs.id
     ORDER BY mp.id DESC
     LIMIT 1) AS finalized_payment_amount,
    cs.created_at,
    ser.title AS series_title,
    ct.name AS class_type_name,
    ct.color AS class_type_color,
    ser.source_type,
    ser.organizer_id,
    m.name AS organizer_name,
    m.contact_type AS organizer_contact_type,
    COALESCE(m.per_class_rate, 0) AS per_class_rate,
    COALESCE(m.currency, 'INR') AS currency,
    ser.duration_minutes,
    ser.location_type,
    ser.location,
    COALESCE(
      (SELECT GROUP_CONCAT(t.name, ', ')
       FROM series_trainees st2
       JOIN trainees t ON st2.trainee_id = t.id
       WHERE st2.series_id = ser.id),
      (SELECT GROUP_CONCAT(t.name, ', ')
       FROM session_trainees st3
       JOIN trainees t ON st3.trainee_id = t.id
       WHERE st3.session_id = cs.id)
    ) AS trainee_names
  FROM class_sessions cs
  JOIN class_series ser ON cs.series_id = ser.id
  JOIN class_types ct ON ser.class_type_id = ct.id
  LEFT JOIN organizers m ON ser.organizer_id = m.id
`;

export async function getSessionsBySeriesId(seriesId: number): Promise<ClassSession[]> {
  const db = await getDatabase();
  return db.getAllAsync<ClassSession>(
    'SELECT * FROM class_sessions WHERE series_id = ? ORDER BY session_date ASC',
    [seriesId]
  );
}

export async function getSessionsByDateRange(startDate: string, endDate: string): Promise<ClassSession[]> {
  const db = await getDatabase();
  return db.getAllAsync<ClassSession>(
    'SELECT * FROM class_sessions WHERE session_date >= ? AND session_date <= ? ORDER BY session_date ASC, class_time ASC',
    [startDate, endDate]
  );
}

export async function getSessionById(id: number): Promise<ClassSession | null> {
  const db = await getDatabase();
  return (await db.getFirstAsync<ClassSession>('SELECT * FROM class_sessions WHERE id = ?', [id])) ?? null;
}

export async function getLastSessionDateForSeries(seriesId: number): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ session_date: string }>(
    'SELECT session_date FROM class_sessions WHERE series_id = ? ORDER BY session_date DESC LIMIT 1',
    [seriesId]
  );
  return row?.session_date ?? null;
}

export async function createSessionsBatch(
  seriesId: number,
  dates: string[],
  classTime: string,
  agreedAmount?: number
): Promise<void> {
  if (dates.length === 0) return;
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    for (const date of dates) {
      await db.runAsync(
        'INSERT OR IGNORE INTO class_sessions (series_id, session_date, class_time, status, student_count, agreed_amount, created_at) VALUES (?, ?, ?, "upcoming", 0, ?, ?)',
        [seriesId, date, classTime, agreedAmount ?? null, now]
      );
    }
  });
}

export async function deleteUpcomingSessionsForSeries(seriesId: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM class_sessions WHERE series_id = ? AND status = "upcoming"',
    [seriesId]
  );
}

export async function deleteAdHocSession(sessionId: number, seriesId: number): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM session_trainees WHERE session_id = ?', [sessionId]);
    await db.runAsync('DELETE FROM class_sessions WHERE id = ?', [sessionId]);
    await db.runAsync('DELETE FROM class_series WHERE id = ?', [seriesId]);
  });
}

export async function updateSessionStatus(
  id: number,
  status: SessionStatus,
  studentCount: number,
  notes?: string
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE class_sessions SET status=?, student_count=?, notes=? WHERE id=?',
    [status, studentCount, notes ?? null, id]
  );
}

export async function updateSessionNotes(id: number, notes: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE class_sessions SET notes = ? WHERE id = ?', [notes || null, id]);
}

export async function updateSessionDateTime(id: number, date: string, time: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE class_sessions SET session_date=?, class_time=? WHERE id=?', [date, time, id]);
}

export async function updateSessionAgreedAmount(id: number, agreedAmount: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE class_sessions SET agreed_amount=? WHERE id=? AND status="upcoming"',
    [agreedAmount, id]
  );
}

export async function getEnrichedSessionsByDateRange(
  startDate: string,
  endDate: string
): Promise<EnrichedSession[]> {
  const db = await getDatabase();
  return db.getAllAsync<EnrichedSession>(
    `${ENRICHED_SELECT} WHERE cs.session_date >= ? AND cs.session_date <= ? ORDER BY cs.session_date ASC, cs.class_time ASC`,
    [startDate, endDate]
  );
}

export async function getEnrichedSessionById(id: number): Promise<EnrichedSession | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<EnrichedSession>(`${ENRICHED_SELECT} WHERE cs.id = ?`, [id])) ?? null
  );
}

export async function completeOrganizerSession(
  sessionId: number,
  organizerId: number,
  amount: number,
  studentCount: number,
  notes?: string
): Promise<void> {
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error('Enter a valid non-negative amount.');
  }
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    const session = await db.getFirstAsync<ClassSession>(
      'SELECT * FROM class_sessions WHERE id = ?',
      [sessionId]
    );
    if (!session) throw new Error('Session not found.');
    if (session.status !== 'upcoming') {
      throw new Error('Only upcoming sessions can be completed.');
    }
    if (isSessionInFuture(session.session_date, session.class_time)) {
      throw new Error('Future sessions cannot be marked complete.');
    }
    const existingPayment = await db.getFirstAsync<{ id: number }>(
      'SELECT id FROM organizer_payments WHERE session_id = ? LIMIT 1',
      [sessionId]
    );
    if (existingPayment) {
      throw new Error('A payment already exists for this session.');
    }

    await db.runAsync(
      'UPDATE class_sessions SET status=?, student_count=?, notes=?, agreed_amount=? WHERE id=?',
      ['completed', studentCount, notes ?? null, amount, sessionId]
    );
    await db.runAsync(
      'INSERT INTO organizer_payments (session_id, organizer_id, amount, status, created_at) VALUES (?, ?, ?, "pending", ?)',
      [sessionId, organizerId, amount, now]
    );
  });
}

export async function completePersonalSession(
  sessionId: number,
  traineeIds: number[],
  month: string,
  notes?: string
): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    const session = await db.getFirstAsync<ClassSession>(
      'SELECT * FROM class_sessions WHERE id = ?',
      [sessionId]
    );
    if (!session) throw new Error('Session not found.');
    if (isSessionInFuture(session.session_date, session.class_time)) {
      throw new Error('Future sessions cannot be marked complete.');
    }

    await db.runAsync(
      'UPDATE class_sessions SET status=?, student_count=?, notes=? WHERE id=?',
      ['completed', traineeIds.length, notes ?? null, sessionId]
    );
    await db.runAsync('DELETE FROM session_trainees WHERE session_id = ?', [sessionId]);
    for (const tid of traineeIds) {
      await db.runAsync(
        'INSERT OR IGNORE INTO session_trainees (session_id, trainee_id) VALUES (?, ?)',
        [sessionId, tid]
      );
      const exact = await db.runAsync(
        `UPDATE trainee_packages SET used_sessions = used_sessions + 1
         WHERE id = (
           SELECT id FROM trainee_packages
           WHERE trainee_id = ?
             AND month = ?
             AND status = 'pending'
             AND used_sessions < total_sessions
           ORDER BY created_at ASC LIMIT 1
         )`,
        [tid, month]
      );
      if (exact.changes === 0) {
        // No package for this exact month — increment most recent pending package instead
        await db.runAsync(
          `UPDATE trainee_packages SET used_sessions = used_sessions + 1
           WHERE id = (
             SELECT id FROM trainee_packages
             WHERE trainee_id = ?
               AND status = 'pending'
               AND used_sessions < total_sessions
             ORDER BY month DESC LIMIT 1
           )`,
          [tid]
        );
      }
    }
  });
}

export async function getEnrichedSessionsForTrainee(traineeId: number): Promise<EnrichedSession[]> {
  const db = await getDatabase();
  return db.getAllAsync<EnrichedSession>(
    `${ENRICHED_SELECT}
     JOIN session_trainees st ON cs.id = st.session_id
     WHERE st.trainee_id = ?
     ORDER BY cs.session_date DESC`,
    [traineeId]
  );
}

export interface AdHocSessionInput {
  title: string;
  classTypeId: number;
  sourceType: SourceType;
  organizerId?: number;
  sessionDate: string;
  classTime: string;
  durationMinutes: number;
  locationType: LocationType;
  location?: string;
  studentCount?: number;
  notes?: string;
  guestName?: string;
  centerId?: number;
  traineeIds?: number[];
  agreedAmount?: number;
}

export async function createAdHocSession(input: AdHocSessionInput): Promise<number> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  let sessionId = 0;
  await db.withTransactionAsync(async () => {
    const seriesResult = await db.runAsync(
      `INSERT INTO class_series (title, class_type_id, source_type, organizer_id, recurrence_type,
        recurrence_days, start_date, end_date, class_time, duration_minutes, location_type,
        location, notes, is_active, center_id, created_at)
       VALUES (?, ?, ?, ?, 'daily', NULL, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        input.title,
        input.classTypeId,
        input.sourceType,
        input.organizerId ?? null,
        input.sessionDate,
        input.sessionDate,
        input.classTime,
        input.durationMinutes,
        input.locationType,
        input.location ?? null,
        input.notes ?? null,
        input.centerId ?? null,
        now,
      ]
    );
    const seriesId = seriesResult.lastInsertRowId;
    const sessionResult = await db.runAsync(
      `INSERT INTO class_sessions (series_id, session_date, class_time, status, student_count, notes, guest_name, center_id, agreed_amount, created_at)
       VALUES (?, ?, ?, 'upcoming', ?, ?, ?, ?, ?, ?)`,
      [seriesId, input.sessionDate, input.classTime, input.studentCount ?? 0, input.notes ?? null, input.guestName ?? null, input.centerId ?? null, input.agreedAmount ?? null, now]
    );
    sessionId = sessionResult.lastInsertRowId;
    if (input.traineeIds && input.traineeIds.length > 0) {
      for (const tid of input.traineeIds) {
        await db.runAsync(
          'INSERT OR IGNORE INTO session_trainees (session_id, trainee_id) VALUES (?, ?)',
          [sessionId, tid]
        );
      }
    }
  });
  return sessionId;
}

export async function getSessionNumberForTrainee(
  sessionId: number,
  traineeId: number
): Promise<{ session_number: number; total_sessions: number } | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<{ session_number: number; total_sessions: number }>(
      `SELECT session_number, total_sessions FROM (
        SELECT
          cs.id,
          ROW_NUMBER() OVER (
            PARTITION BY st.trainee_id, tp.month
            ORDER BY cs.session_date ASC
          ) AS session_number,
          tp.total_sessions
        FROM class_sessions cs
        JOIN session_trainees st ON cs.id = st.session_id
        JOIN trainee_packages tp
          ON tp.trainee_id = st.trainee_id
          AND strftime('%Y-%m', cs.session_date) = tp.month
        WHERE cs.status = 'completed'
          AND st.trainee_id = ?
      ) WHERE id = ?`,
      [traineeId, sessionId]
    )) ?? null
  );
}
