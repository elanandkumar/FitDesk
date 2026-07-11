import React from 'react';
import { SessionStatus } from '../../types';
import { BadgeTone } from '../../theme';
import AppBadge from './AppBadge';

export type DisplayStatus = SessionStatus | 'missed';

interface Props {
  status: DisplayStatus;
}

const STATUS_CONFIG: Record<DisplayStatus, { label: string; tone: BadgeTone }> = {
  upcoming:  { label: 'Upcoming',  tone: 'upcoming' },
  completed: { label: 'Completed', tone: 'completed' },
  cancelled: { label: 'Cancelled', tone: 'cancelled' },
  skipped:   { label: 'Skipped',   tone: 'skipped' },
  missed:    { label: 'Missed',    tone: 'missed' },
};

export function getDisplayStatus(status: SessionStatus, sessionDate: string, classTime: string): DisplayStatus {
  if (status !== 'upcoming') return status;
  const [h, m] = classTime.split(':').map(Number);
  const sessionAt = new Date(sessionDate + 'T00:00:00');
  sessionAt.setHours(h, m, 0, 0);
  return sessionAt < new Date() ? 'missed' : 'upcoming';
}

export default function StatusBadge({ status }: Props) {
  const cfg = STATUS_CONFIG[status];
  return <AppBadge label={cfg.label} tone={cfg.tone} />;
}
