import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Brand, Radius, Spacing, Typography } from '../../theme';
import { formatCurrency } from '../../utils/currencyUtils';

interface Props {
  pending: number;
  paid: number;
  onPress?: () => void;
}

export default function EarningsCard({ pending, paid, onPress }: Props) {
  if (pending === 0 && paid === 0) return null;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? 'Open payments' : undefined}
      accessibilityHint={onPress ? 'Shows payment details' : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
    >
      <Text style={styles.title}>This week · earnings</Text>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={styles.label}>Paid</Text>
          <Text style={[styles.amount, paid > 0 ? styles.paidAmount : styles.mutedAmount]}>{formatCurrency(paid)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.col}>
          <Text style={styles.label}>Pending</Text>
          <Text style={[styles.amount, styles.pendingAmount]}>{formatCurrency(pending)}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 4,
    borderRadius: Radius.card,
    backgroundColor: Brand.surfaceElevated,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  cardPressed: {
    opacity: 0.82,
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
    color: Brand.pink,
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
