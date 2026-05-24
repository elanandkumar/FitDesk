import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SessionStatus } from '../../types';
import { Brand, Radius } from '../../theme';

export type DisplayStatus = SessionStatus | 'missed';

interface Props {
  status: DisplayStatus;
}

const STATUS_CONFIG: Record<DisplayStatus, { label: string; color: string }> = {
  upcoming:  { label: 'Upcoming',  color: Brand.statusUpcoming },
  completed: { label: 'Completed', color: Brand.statusCompleted },
  cancelled: { label: 'Cancelled', color: Brand.statusCancelled },
  skipped:   { label: 'Skipped',   color: Brand.statusSkipped },
  missed:    { label: 'Missed',    color: Brand.statusCancelled },
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
  return (
    <View style={[styles.badge, { backgroundColor: cfg.color + '33' }]}>
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.2,
  },
});
