import { RecurrenceType } from '../types';
import { SESSION_GENERATION_DAYS } from '../constants';

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function formatRecurrenceSummary(
  recurrenceType: RecurrenceType,
  recurrenceDays: string | undefined
): string {
  if (recurrenceType === 'daily') return 'Daily';
  if (!recurrenceDays) return '';
  const days = JSON.parse(recurrenceDays) as number[];
  return days.map((d) => DAY_SHORT[d]).join(', ');
}

export function formatDisplayDate(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDisplayTime(time24: string | null | undefined): string {
  if (!time24 || !time24.includes(':')) return '—';
  const [h, m] = time24.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '—';
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export function sessionDateTime(sessionDate: string, classTime: string): Date {
  const [h, m] = classTime.split(':').map(Number);
  const date = new Date(sessionDate + 'T00:00:00');
  date.setHours(h || 0, m || 0, 0, 0);
  return date;
}

export function isSessionInFuture(sessionDate: string, classTime: string, now = new Date()): boolean {
  return sessionDateTime(sessionDate, classTime) > now;
}

function localISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayISO(): string {
  return localISO(new Date());
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate + 'T00:00:00');
  date.setDate(date.getDate() + days);
  return localISO(date);
}

export function generateSessionDates(
  startDate: string,
  recurrenceType: RecurrenceType,
  recurrenceDays: number[],
  endDate?: string
): string[] {
  const dates: string[] = [];
  const horizon = addDays(todayISO(), SESSION_GENERATION_DAYS);
  const limit = endDate && endDate < horizon ? endDate : horizon;

  let current = startDate < todayISO() ? todayISO() : startDate;

  while (current <= limit) {
    const dayOfWeek = new Date(current + 'T00:00:00').getDay();

    if (recurrenceType === 'daily') {
      dates.push(current);
    } else if (recurrenceType === 'weekly' && recurrenceDays.includes(dayOfWeek)) {
      dates.push(current);
    } else if (recurrenceType === 'custom' && recurrenceDays.includes(dayOfWeek)) {
      dates.push(current);
    }

    current = addDays(current, 1);
  }

  return dates;
}
