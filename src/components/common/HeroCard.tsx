import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Brand, Gradients, Radius, Typography } from '../../theme';
import { formatCurrency } from '../../utils/currencyUtils';

interface Props {
  todayCount: number;
  weekTotal: number;
  weekEarnings: number;
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

export default function HeroCard({ todayCount, weekTotal, weekEarnings, trainerName }: Props) {
  return (
    <LinearGradient
      colors={Gradients.hero}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.left}>
        <Text style={styles.greeting}>{greeting(trainerName)}</Text>
        <Text style={styles.count}>
          {todayCount === 0 ? '—' : String(todayCount)}
        </Text>
        <Text style={styles.subtitle}>
          {todayCount === 1 ? 'class today' : 'classes today'}
        </Text>
      </View>
      <View style={styles.right}>
        <View style={styles.pill}>
          <Text style={styles.pillLabel}>This week</Text>
          <Text style={styles.pillValue}>{weekTotal} sessions</Text>
        </View>
        {weekEarnings > 0 && (
          <View style={[styles.pill, styles.earningsPill]}>
            <Text style={styles.pillLabel}>Earned</Text>
            <Text style={[styles.pillValue, styles.earningsValue]}>
              {formatCurrency(weekEarnings)}
            </Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    borderRadius: Radius.hero,
    paddingVertical: 24,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 160,
  },
  left: { flex: 1, gap: 4 },
  greeting: {
    ...Typography.body,
    color: Brand.textSecondary,
  },
  count: {
    ...Typography.heroNum,
    color: Brand.textPrimary,
  },
  subtitle: {
    ...Typography.labelMd,
    color: Brand.textSecondary,
  },
  right: { gap: 10, alignItems: 'flex-end' },
  pill: {
    backgroundColor: 'rgba(91, 46, 255, 0.25)',
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    minWidth: 108,
  },
  earningsPill: { backgroundColor: 'rgba(255, 122, 0, 0.20)' },
  pillLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  pillValue: {
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 14,
    color: Brand.textPrimary,
  },
  earningsValue: { color: Brand.orange },
});
