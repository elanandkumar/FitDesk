import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { EnrichedSession } from '../../types';
import { Brand, Radius, Spacing, useAppTheme } from '../../theme';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils';
import { withAlpha } from '../../utils/colorUtils';
import StatusBadge, { getDisplayStatus } from './StatusBadge';

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

  const content = (
    <>
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
    </>
  );

  const cardStyle = [
    styles.sessionCard,
    {
      borderColor: withAlpha(session.class_type_color, 0.28),
      borderLeftColor: withAlpha(session.class_type_color, 0.75),
      shadowColor: '#000000',
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} style={cardStyle} activeOpacity={0.75}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{content}</View>;
}

const styles = StyleSheet.create({
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    borderLeftWidth: 4,
    elevation: 4,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sessionInfo: { flex: 1, gap: 0 },
});
