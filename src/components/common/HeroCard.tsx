import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Radius, Typography, useAppTheme } from '../../theme';
import { withAlpha } from '../../utils/colorUtils';

interface Props {
  todayCount: number;
  weekTotal: number;
  trainerName?: string;
}

function greeting(name?: string): string {
  const hour = new Date().getHours();
  const suffix = name ? `, ${name}!` : '!';
  if (hour < 12) return `Good morning${suffix} 👋`;
  if (hour < 17) return `Good afternoon${suffix} 👋`;
  if (hour < 22) return `Good evening${suffix} 👋`;
  return `Good night${suffix} 👋`;
}

export default function HeroCard({ todayCount, weekTotal, trainerName }: Props) {
  const { accentPalette, colors } = useAppTheme();
  const heroColors = [withAlpha(accentPalette.main, 0.5), colors.surfaceRaised, colors.surface] as const;

  return (
    <LinearGradient
      colors={heroColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      locations={[0, 0.34, 1]}
      style={styles.card}
    >
      <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting(trainerName)}</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={[styles.count, { color: colors.textPrimary }]}>{todayCount === 0 ? '—' : String(todayCount)}</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{todayCount === 1 ? 'session today' : 'sessions today'}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text style={[styles.count, { color: colors.textPrimary }]}>{weekTotal === 0 ? '—' : String(weekTotal)}</Text>
          <Text style={[styles.label, { color: colors.textSecondary }]}>this week</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: Radius.hero,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  greeting: {
    ...Typography.body,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 0,
  },
  stat: {
    flex: 1,
    gap: 2,
    alignItems: 'flex-start',
  },
  count: {
    ...Typography.heroNum,
    fontSize: 38,
    lineHeight: 46,
  },
  label: {
    ...Typography.labelMd,
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
  },
});
