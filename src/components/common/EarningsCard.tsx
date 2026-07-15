import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { BrandCore, Radius, Spacing, Typography, useAppTheme } from '../../theme';
import { formatCurrency } from '../../utils/currencyUtils';

interface Props {
  pending: number;
  paid: number;
  onPress?: () => void;
}

export default function EarningsCard({ pending, paid, onPress }: Props) {
  const { colors } = useAppTheme();
  if (pending === 0 && paid === 0) return null;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? 'Open payments' : undefined}
      accessibilityHint={onPress ? 'Shows payment details' : undefined}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
        pressed && styles.cardPressed,
      ]}
    >
      <Text style={[styles.title, { color: colors.textMuted }]}>This week · earnings</Text>
      <View style={styles.row}>
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Paid</Text>
          <Text style={[styles.amount, { color: paid > 0 ? BrandCore.pink : colors.textMuted }]}>{formatCurrency(paid)}</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Pending</Text>
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
    borderWidth: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  cardPressed: {
    opacity: 0.82,
  },
  title: {
    ...Typography.caption,
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
  },
  amount: {
    ...Typography.labelLg,
  },
  pendingAmount: {
    color: BrandCore.orange,
  },
  divider: {
    width: 1,
    height: 36,
    marginHorizontal: Spacing.lg,
  },
});
