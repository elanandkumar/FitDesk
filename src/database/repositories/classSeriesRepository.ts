import { getDatabase } from '../db';
import { ClassSeries } from '../../types';
import { generateSessionDates, addDays } from '../../utils/dateUtils';
import { getLastSessionDateForSeries, createSessionsBatch } from './classSessionRepository';

type ClassSeriesInput = Omit<ClassSeries, 'id' | 'created_at'>;

export async function getAllClassSeries(): Promise<ClassSeries[]> {
  const db = await getDatabase();
  return db.getAllAsync<ClassSeries>('SELECT * FROM class_series ORDER BY created_at DESC');
}

export async function getActiveClassSeries(): Promise<ClassSeries[]> {
  const db = await getDatabase();
  return db.getAllAsync<ClassSeries>(
    'SELECT * FROM class_series WHERE is_active = 1 ORDER BY class_time ASC'
  );
}

export async function getClassSeriesById(id: number): Promise<ClassSeries | null> {
  const db = await getDatabase();
  return (
    (await db.getFirstAsync<ClassSeries>('SELECT * FROM class_series WHERE id = ?', [id])) ?? null
  );
}

export async function createClassSeries(data: ClassSeriesInput): Promise<ClassSeries> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    `INSERT INTO class_series (title, class_type_id, source_type, manager_id, recurrence_type,
      recurrence_days, start_date, end_date, class_time, duration_minutes, location_type,
      location, notes, is_active, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.title,
      data.class_type_id,
      data.source_type,
      data.manager_id ?? null,
      data.recurrence_type,
      data.recurrence_days ?? null,
      data.start_date,
      data.end_date ?? null,
      data.class_time,
      data.duration_minutes,
      data.location_type,
      data.location ?? null,
      data.notes ?? null,
      data.is_active,
      now,
    ]
  );
  return { ...data, id: result.lastInsertRowId, created_at: now };
}

export async function updateClassSeries(id: number, data: ClassSeriesInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE class_series SET title=?, class_type_id=?, source_type=?, manager_id=?,
      recurrence_type=?, recurrence_days=?, start_date=?, end_date=?, class_time=?,
      duration_minutes=?, location_type=?, location=?, notes=?, is_active=? WHERE id=?`,
    [
      data.title,
      data.class_type_id,
      data.source_type,
      data.manager_id ?? null,
      data.recurrence_type,
      data.recurrence_days ?? null,
      data.start_date,
      data.end_date ?? null,
      data.class_time,
      data.duration_minutes,
      data.location_type,
      data.location ?? null,
      data.notes ?? null,
      data.is_active,
      id,
    ]
  );
}

export async function deactivateClassSeries(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE class_series SET is_active = 0 WHERE id = ?', [id]);
}

export async function extendActiveSeriesSessions(): Promise<void> {
  const activeSeries = await getActiveClassSeries();
  for (const series of activeSeries) {
    const lastDate = await getLastSessionDateForSeries(series.id);
    const fromDate = lastDate ? addDays(lastDate, 1) : series.start_date;
    const recurrenceDays: number[] = series.recurrence_days
      ? (JSON.parse(series.recurrence_days) as number[])
      : [];
    const dates = generateSessionDates(
      fromDate,
      series.recurrence_type,
      recurrenceDays,
      series.end_date
    );
    if (dates.length > 0) {
      await createSessionsBatch(series.id, dates, series.class_time);
    }
  }
}
