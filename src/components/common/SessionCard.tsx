import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { EnrichedSession } from '../../types';
import { Brand, useAppTheme } from '../../theme';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils';
import StatusBadge, { getDisplayStatus } from './StatusBadge';
import AccentListCard from './AccentListCard';

interface SessionNumberInfo {
  session_number: number;
  total_sessions: number;
}

interface Props {
  session: EnrichedSession;
  onPress?: () => void;
  showDate?: boolean;
  showTraineeLabel?: boolean;
  sessionNumber?: SessionNumberInfo;
  style?: ViewStyle;
}

function traineeLabel(names?: string): string | null {
  if (!names) return null;
  const parts = names.split(', ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} +${parts.length - 1}`;
}

export default function SessionCard({
  session,
  onPress,
  showDate = false,
  showTraineeLabel = true,
  sessionNumber,
  style,
}: Props) {
  const { accentPalette } = useAppTheme();
  const trainee = traineeLabel(session.trainee_names);
  const metadataParts = [
    showDate ? formatDisplayDate(session.session_date) : formatDisplayTime(session.class_time),
    showDate ? formatDisplayTime(session.class_time) : session.class_type_name,
    showDate ? session.class_type_name : `${session.duration_minutes} min`,
  ];

  return (
    <AccentListCard accentColor={session.class_type_color} onPress={onPress} style={style}>
      <View style={styles.sessionInfo}>
        <Text variant="titleSmall" style={{ color: Brand.textPrimary }}>
          {session.series_title}
        </Text>
        <Text variant="bodySmall" style={{ color: Brand.textSecondary }}>
          {metadataParts.join(' · ')}
        </Text>
        {session.source_type === 'personal' && showTraineeLabel && trainee && (
          <Text variant="bodySmall" style={{ color: accentPalette.textAccent }}>
            {trainee}
          </Text>
        )}
        {sessionNumber && (
          <Text variant="bodySmall" style={{ color: Brand.orange }}>
            Session {sessionNumber.session_number} / {sessionNumber.total_sessions}
          </Text>
        )}
        {session.location && (
          <Text variant="bodySmall" style={{ color: Brand.textMuted }}>
            {session.location}
          </Text>
        )}
      </View>
      <StatusBadge status={getDisplayStatus(session.status, session.session_date, session.class_time)} />
    </AccentListCard>
  );
}

const styles = StyleSheet.create({
  sessionInfo: { flex: 1, gap: 0 },
});
