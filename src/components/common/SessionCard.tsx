import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { EnrichedSession } from '../../types';
import { BrandCore, Spacing, useAppTheme } from '../../theme';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils';
import StatusBadge, { getDisplayStatus } from './StatusBadge';
import AccentListCard from './AccentListCard';
import ColorDotLabel from './ColorDotLabel';

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
  const { accentPalette, colors } = useAppTheme();
  const trainee = traineeLabel(session.trainee_names);
  const metadataParts = [
    ...(showDate ? [formatDisplayDate(session.session_date)] : []),
    formatDisplayTime(session.class_time),
    `${session.duration_minutes} min`,
  ];

  return (
    <AccentListCard
      accentColor={session.class_type_color}
      onPress={onPress}
      showAccentRail={false}
      dense
      style={style}
    >
      <View style={styles.sessionInfo}>
        <View style={styles.badgeRow}>
          <ColorDotLabel color={session.class_type_color} label={session.class_type_name} />
          <StatusBadge status={getDisplayStatus(session.status, session.session_date, session.class_time)} />
        </View>
        <Text variant="titleSmall" style={{ color: colors.textPrimary }}>
          {session.series_title}
          {session.location ? (
            <Text variant="bodySmall" style={{ color: colors.textMuted }}>
              {` · ${session.location}`}
            </Text>
          ) : null}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
          {metadataParts.join(' · ')}
        </Text>
        {session.source_type === 'personal' && showTraineeLabel && trainee && (
          <Text variant="bodySmall" style={{ color: accentPalette.textAccent }}>
            {trainee}
          </Text>
        )}
        {sessionNumber && (
          <Text variant="bodySmall" style={{ color: BrandCore.orange }}>
            Session {sessionNumber.session_number} / {sessionNumber.total_sessions}
          </Text>
        )}
      </View>
    </AccentListCard>
  );
}

const styles = StyleSheet.create({
  sessionInfo: { flex: 1, gap: 0 },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
});
