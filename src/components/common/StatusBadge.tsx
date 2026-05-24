import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { SessionStatus } from '../../types';
import { Brand } from '../../theme';

interface Props {
  status: SessionStatus;
}

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string }> = {
  upcoming:  { label: 'Upcoming',  color: Brand.statusUpcoming },
  completed: { label: 'Completed', color: Brand.statusCompleted },
  cancelled: { label: 'Cancelled', color: Brand.statusCancelled },
  skipped:   { label: 'Skipped',   color: Brand.statusSkipped },
};

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
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 11,
  },
});
