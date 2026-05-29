import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Brand, Gradients, Radius, Typography } from '../../theme';

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
  return (
    <LinearGradient
      colors={Gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <Text style={styles.greeting}>{greeting(trainerName)}</Text>
      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.count}>{todayCount === 0 ? '—' : String(todayCount)}</Text>
          <Text style={styles.label}>{todayCount === 1 ? 'session today' : 'sessions today'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Text style={styles.count}>{weekTotal === 0 ? '—' : String(weekTotal)}</Text>
          <Text style={styles.label}>this week</Text>
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
    color: Brand.textSecondary,
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
    color: Brand.textPrimary,
  },
  label: {
    ...Typography.labelMd,
    color: Brand.textSecondary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 16,
  },
});
