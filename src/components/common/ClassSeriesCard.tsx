import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { Brand } from '../../theme';
import { ClassSeries, ClassType } from '../../types';
import { formatDisplayTime, formatRecurrenceSummary } from '../../utils/dateUtils';
import AppBadge from './AppBadge';
import AccentListCard from './AccentListCard';

interface Props {
  series: ClassSeries;
  classType?: ClassType;
  onPress: () => void;
  statusLabel?: string;
  style?: ViewStyle;
}

export default function ClassSeriesCard({ series, classType, onPress, statusLabel, style }: Props) {
  const accentColor = classType?.color ?? Brand.purple;
  const recurrenceText = formatRecurrenceSummary(series.recurrence_type, series.recurrence_days);

  return (
    <AccentListCard
      accentColor={accentColor}
      muted={!series.is_active}
      accessibilityLabel={`${series.title} class series details`}
      accessibilityHint="Opens class series details"
      onPress={onPress}
      style={style}
    >
      <View style={styles.seriesInfo}>
        <Text variant="titleSmall" style={[styles.title, !series.is_active && styles.textInactive]}>
          {series.title}
        </Text>
        <Text variant="bodySmall" style={styles.subtitle}>
          {formatDisplayTime(series.class_time)} · {recurrenceText}
        </Text>
        {classType ? (
          <Text variant="bodySmall" style={styles.classType}>
            {classType.name}
          </Text>
        ) : null}
      </View>
      {statusLabel ? <AppBadge label={statusLabel} tone="cancelled" /> : null}
    </AccentListCard>
  );
}

const styles = StyleSheet.create({
  seriesInfo: {
    flex: 1,
    gap: 0,
  },
  title: {
    color: Brand.textPrimary,
  },
  textInactive: {
    color: Brand.textSecondary,
  },
  subtitle: {
    color: Brand.textSecondary,
  },
  classType: {
    color: Brand.textMuted,
  },
});
