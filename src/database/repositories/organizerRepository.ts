import { getDatabase } from '../db';
import { Organizer, OrganizerContactType } from '../../types';

export type OrganizerInput = Omit<
  Organizer,
  'id' | 'created_at' | 'is_active' | 'contact_type'
> & {
  contact_type?: OrganizerContactType;
};

export async function getAllOrganizers(): Promise<Organizer[]> {
  const db = await getDatabase();
  return db.getAllAsync<Organizer>('SELECT * FROM organizers WHERE is_active = 1 ORDER BY name ASC');
}

export async function getOrganizerById(id: number): Promise<Organizer | null> {
  const db = await getDatabase();
  return (await db.getFirstAsync<Organizer>('SELECT * FROM organizers WHERE id = ?', [id])) ?? null;
}

export async function createOrganizer(data: OrganizerInput): Promise<Organizer> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const result = await db.runAsync(
    'INSERT INTO organizers (name, contact_person, phone, email, per_class_rate, currency, notes, is_active, contact_type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)',
    [data.name, data.contact_person ?? null, data.phone ?? null, data.email ?? null, data.per_class_rate, data.currency, data.notes ?? null, data.contact_type ?? 'regular', now]
  );
  return {
    ...data,
    id: result.lastInsertRowId,
    is_active: 1,
    contact_type: data.contact_type ?? 'regular',
    created_at: now,
  };
}

export async function updateOrganizer(id: number, data: OrganizerInput): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE organizers SET name=?, contact_person=?, phone=?, email=?, per_class_rate=?, currency=?, notes=?, contact_type=COALESCE(?, contact_type) WHERE id=?',
    [data.name, data.contact_person ?? null, data.phone ?? null, data.email ?? null, data.per_class_rate, data.currency, data.notes ?? null, data.contact_type ?? null, id]
  );
}

export async function getUpcomingSessionCountForOrganizer(id: number): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM class_sessions cs
     JOIN class_series ser ON cs.series_id = ser.id
     WHERE ser.organizer_id = ? AND cs.status = 'upcoming'`,
    [id]
  );
  return row?.cnt ?? 0;
}

export async function softDeleteOrganizer(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE organizers SET is_active = 0 WHERE id = ?', [id]);
}

export async function makeOrganizerRegular(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE organizers SET contact_type = 'regular' WHERE id = ?",
    [id]
  );
}

export async function deleteOrganizer(id: number): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM organizer_payments WHERE organizer_id = ?', [id]);
    await db.runAsync(
      `DELETE FROM session_trainees WHERE session_id IN (
         SELECT id FROM class_sessions WHERE series_id IN (
           SELECT id FROM class_series WHERE organizer_id = ?
         )
       )`,
      [id]
    );
    await db.runAsync(
      `DELETE FROM class_sessions WHERE series_id IN (
         SELECT id FROM class_series WHERE organizer_id = ?
       )`,
      [id]
    );
    await db.runAsync('DELETE FROM class_series WHERE organizer_id = ?', [id]);
    await db.runAsync('DELETE FROM organizers WHERE id = ?', [id]);
  });
}
