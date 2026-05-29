import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Brand, Radius, Spacing, Typography } from '../../theme';
import { formatCurrency } from '../../utils/currencyUtils';

interface Props {
  pending: number;
  paid: number;
}

export default function EarningsCard({ pending, paid }: Props) {
  if (pending === 0 && paid === 0) return null;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>This week · earnings</Text>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Pending</Text>
          <Text style={[styles.amount, styles.pendingAmount]}>{formatCurrency(pending)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.col}>
          <Text style={styles.label}>Paid</Text>
          <Text style={[styles.amount, paid > 0 ? styles.paidAmount : styles.mutedAmount]}>{formatCurrency(paid)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: Radius.card,
    backgroundColor: Brand.surfaceDark,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    ...Typography.caption,
    color: Brand.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  col: {
    flex: 1,
    gap: 4,
  },
  label: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  amount: {
    ...Typography.labelLg,
    color: Brand.textPrimary,
  },
  pendingAmount: {
    color: Brand.orange,
  },
  paidAmount: {
    color: '#34D399',
  },
  mutedAmount: {
    color: Brand.textMuted,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: Brand.borderSubtle,
    marginHorizontal: Spacing.lg,
  },
});
