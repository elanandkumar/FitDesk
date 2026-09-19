import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { BrandCore, Spacing, useAppTheme } from '../../theme';
import { ClassSeries, ClassType } from '../../types';
import { formatDisplayTime, formatRecurrenceSummary } from '../../utils/dateUtils';
import AppBadge from './AppBadge';
import AccentListCard from './AccentListCard';
import ColorDotLabel from './ColorDotLabel';

interface Props {
  series: ClassSeries;
  classType?: ClassType;
  onPress: () => void;
  statusLabel?: string;
  style?: ViewStyle;
}

export default function ClassSeriesCard({ series, classType, onPress, statusLabel, style }: Props) {
  const { colors } = useAppTheme();
  const accentColor = classType?.color ?? BrandCore.purple;
  const recurrenceText = formatRecurrenceSummary(series.recurrence_type, series.recurrence_days);

  return (
    <AccentListCard
      accentColor={accentColor}
      muted={!series.is_active}
      showAccentRail={false}
      dense
      accessibilityLabel={`${series.title} class series details`}
      accessibilityHint="Opens class series details"
      onPress={onPress}
      style={style}
    >
      <View style={styles.seriesInfo}>
        {(classType || statusLabel) ? (
          <View style={styles.badgeRow}>
            <View>{classType ? <ColorDotLabel color={accentColor} label={classType.name} /> : null}</View>
            {statusLabel ? <AppBadge label={statusLabel} tone="cancelled" /> : null}
          </View>
        ) : null}
        <Text variant="titleSmall" style={{ color: series.is_active ? colors.textPrimary : colors.textSecondary }}>
          {series.title}
          {series.location ? (
            <Text variant="bodySmall" style={{ color: colors.textMuted }}>
              {` · ${series.location}`}
            </Text>
          ) : null}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
          {formatDisplayTime(series.class_time)} · {recurrenceText}
        </Text>
      </View>
    </AccentListCard>
  );
}

const styles = StyleSheet.create({
  seriesInfo: {
    flex: 1,
    gap: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
});
