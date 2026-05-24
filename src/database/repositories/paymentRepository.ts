import { getDatabase } from '../db';
import {
  EnrichedManagerPayment,
  EnrichedTraineePackage,
  ManagerMonthIncome,
  ManagerPayment,
  MonthlyIncomeSummary,
  TraineeMonthPackage,
  TraineePackage,
} from '../../types';

export async function createManagerPayment(
  sessionId: number,
  managerId: number,
  amount: number
): Promise<ManagerPayment> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO manager_payments (session_id, manager_id, amount, status, created_at) VALUES (?, ?, ?, "pending", ?)',
    [sessionId, managerId, amount, now]
  );
  return {
    id: result.lastInsertRowId,
    session_id: sessionId,
    manager_id: managerId,
    amount,
    status: 'pending',
    created_at: now,
  };
}

export async function getAllManagerPayments(): Promise<ManagerPayment[]> {
  const db = await getDatabase();
  return db.getAllAsync<ManagerPayment>('SELECT * FROM manager_payments ORDER BY created_at DESC');
}

export async function getAllEnrichedManagerPayments(
  pendingOnly: boolean
): Promise<EnrichedManagerPayment[]> {
  const db = await getDatabase();
  const whereClause = pendingOnly ? 'WHERE mp.status = "pending"' : '';
  return db.getAllAsync<EnrichedManagerPayment>(
    `SELECT
      mp.id, mp.session_id, mp.manager_id, mp.amount, mp.status, mp.paid_date, mp.notes, mp.created_at,
      m.name AS manager_name,
      COALESCE(m.currency, 'INR') AS currency,
      cs.session_date, cs.class_time,
      ser.title AS series_title,
      ct.name AS class_type_name,
      ct.color AS class_type_color
    FROM manager_payments mp
    JOIN managers m ON mp.manager_id = m.id
    JOIN class_sessions cs ON mp.session_id = cs.id
    JOIN class_series ser ON cs.series_id = ser.id
    JOIN class_types ct ON ser.class_type_id = ct.id
    ${whereClause}
    ORDER BY mp.status ASC, cs.session_date DESC`
  );
}

export async function getManagerPaymentsByManager(managerId: number): Promise<ManagerPayment[]> {
  const db = await getDatabase();
  return db.getAllAsync<ManagerPayment>(
    'SELECT * FROM manager_payments WHERE manager_id = ? ORDER BY created_at DESC',
    [managerId]
  );
}

export async function getEnrichedManagerPaymentsByManager(
  managerId: number
): Promise<EnrichedManagerPayment[]> {
  const db = await getDatabase();
  return db.getAllAsync<EnrichedManagerPayment>(
    `SELECT
      mp.id, mp.session_id, mp.manager_id, mp.amount, mp.status, mp.paid_date, mp.notes, mp.created_at,
      m.name AS manager_name,
      COALESCE(m.currency, 'INR') AS currency,
      cs.session_date, cs.class_time,
      ser.title AS series_title,
      ct.name AS class_type_name,
      ct.color AS class_type_color
    FROM manager_payments mp
    JOIN managers m ON mp.manager_id = m.id
    JOIN class_sessions cs ON mp.session_id = cs.id
    JOIN class_series ser ON cs.series_id = ser.id
    JOIN class_types ct ON ser.class_type_id = ct.id
    WHERE mp.manager_id = ?
    ORDER BY mp.status ASC, cs.session_date DESC`,
    [managerId]
  );
}

export async function getManagerOutstandingBalance(managerId: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ total: number | null }>(
    'SELECT SUM(amount) as total FROM manager_payments WHERE manager_id = ? AND status = "pending"',
    [managerId]
  );
  return row?.total ?? 0;
}

export async function markManagerPaymentPaid(id: number, paidDate: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE manager_payments SET status = "paid", paid_date = ? WHERE id = ?',
    [paidDate, id]
  );
}

export async function getAllEnrichedTraineePackages(): Promise<EnrichedTraineePackage[]> {
  const db = await getDatabase();
  return db.getAllAsync<EnrichedTraineePackage>(
    `SELECT
      tp.id, tp.trainee_id, tp.month, tp.total_sessions, tp.used_sessions,
      tp.amount, tp.status, tp.paid_date, tp.notes, tp.created_at,
      t.name AS trainee_name
    FROM trainee_packages tp
    JOIN trainees t ON tp.trainee_id = t.id
    ORDER BY tp.status ASC, tp.month DESC`
  );
}

export async function getPackagesByTrainee(traineeId: number): Promise<TraineePackage[]> {
  const db = await getDatabase();
  return db.getAllAsync<TraineePackage>(
    'SELECT * FROM trainee_packages WHERE trainee_id = ? ORDER BY month DESC',
    [traineeId]
  );
}

export async function getActivePackageForTrainee(
  traineeId: number,
  month: string
): Promise<TraineePackage | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<TraineePackage>(
      'SELECT * FROM trainee_packages WHERE trainee_id = ? AND month = ?',
      [traineeId, month]
    )) ?? null
  );
}

export async function createTraineePackage(
  traineeId: number,
  month: string,
  totalSessions: number,
  amount: number,
  notes?: string
): Promise<TraineePackage> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO trainee_packages (trainee_id, month, total_sessions, used_sessions, amount, status, notes, created_at) VALUES (?, ?, ?, 0, ?, "pending", ?, ?)',
    [traineeId, month, totalSessions, amount, notes ?? null, now]
  );
  return {
    id: result.lastInsertRowId,
    trainee_id: traineeId,
    month,
    total_sessions: totalSessions,
    used_sessions: 0,
    amount,
    status: 'pending',
    notes,
    created_at: now,
  };
}

export async function incrementPackageUsedSessions(traineeId: number, month: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE trainee_packages SET used_sessions = used_sessions + 1 WHERE trainee_id = ? AND month = ?',
    [traineeId, month]
  );
}

export async function markPackagePaid(id: number, paidDate: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE trainee_packages SET status = "paid", paid_date = ? WHERE id = ?',
    [paidDate, id]
  );
}

export async function getMonthlyIncomeSummary(): Promise<MonthlyIncomeSummary[]> {
  const db = await getDatabase();
  return db.getAllAsync<MonthlyIncomeSummary>(`
    SELECT
      month,
      SUM(CASE WHEN source = 'manager' AND status = 'paid'    THEN amount ELSE 0 END) AS manager_paid,
      SUM(CASE WHEN source = 'manager' AND status = 'pending' THEN amount ELSE 0 END) AS manager_pending,
      SUM(CASE WHEN source = 'trainee' AND status = 'paid'    THEN amount ELSE 0 END) AS trainee_paid,
      SUM(CASE WHEN source = 'trainee' AND status = 'pending' THEN amount ELSE 0 END) AS trainee_pending,
      SUM(CASE WHEN status = 'paid'    THEN amount ELSE 0 END) AS total_paid,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) AS total_pending
    FROM (
      SELECT SUBSTR(cs.session_date, 1, 7) AS month, mp.amount, mp.status, 'manager' AS source
      FROM manager_payments mp
      JOIN class_sessions cs ON mp.session_id = cs.id
      UNION ALL
      SELECT tp.month, tp.amount, tp.status, 'trainee' AS source
      FROM trainee_packages tp
    )
    GROUP BY month
    ORDER BY month DESC
  `);
}

export async function getManagerIncomeForMonth(month: string): Promise<ManagerMonthIncome[]> {
  const db = await getDatabase();
  return db.getAllAsync<ManagerMonthIncome>(`
    SELECT
      m.id AS manager_id,
      m.name AS manager_name,
      SUM(CASE WHEN mp.status = 'paid'    THEN mp.amount ELSE 0 END) AS paid,
      SUM(CASE WHEN mp.status = 'pending' THEN mp.amount ELSE 0 END) AS pending
    FROM manager_payments mp
    JOIN managers m ON mp.manager_id = m.id
    JOIN class_sessions cs ON mp.session_id = cs.id
    WHERE SUBSTR(cs.session_date, 1, 7) = ?
    GROUP BY m.id
    ORDER BY m.name
  `, [month]);
}

export async function getPersonalTrainingEarnings(startDate: string, endDate: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ earned: number }>(`
    SELECT COALESCE(SUM(
      CAST(tp.amount AS REAL) / NULLIF(tp.total_sessions, 0)
    ), 0) AS earned
    FROM session_trainees st
    JOIN class_sessions cs ON st.session_id = cs.id
    JOIN class_series ser ON cs.series_id = ser.id
    JOIN trainee_packages tp
      ON tp.trainee_id = st.trainee_id
      AND tp.month = SUBSTR(cs.session_date, 1, 7)
    WHERE cs.status = 'completed'
      AND ser.source_type = 'personal'
      AND cs.session_date >= ?
      AND cs.session_date <= ?
  `, [startDate, endDate]);
  return row?.earned ?? 0;
}

export async function getTraineePackagesForMonth(month: string): Promise<TraineeMonthPackage[]> {
  const db = await getDatabase();
  return db.getAllAsync<TraineeMonthPackage>(`
    SELECT
      t.id AS trainee_id,
      t.name AS trainee_name,
      tp.amount,
      tp.status,
      tp.total_sessions,
      tp.used_sessions
    FROM trainee_packages tp
    JOIN trainees t ON tp.trainee_id = t.id
    WHERE tp.month = ?
    ORDER BY t.name
  `, [month]);
}
