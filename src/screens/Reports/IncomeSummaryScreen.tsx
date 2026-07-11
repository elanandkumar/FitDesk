import React, { useCallback, useLayoutEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { Brand, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { MonthlyIncomeSummary } from '../../types';
import { getMonthlyIncomeSummary } from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import EmptyState from '../../components/common/EmptyState';
import HelpSheet from '../../components/common/HelpSheet';
import AppIcon from '../../components/common/AppIcon';
import AppIconButton from '../../components/common/AppIconButton';
import { withAlpha } from '../../utils/colorUtils';

type Nav = StackNavigationProp<RootStackParamList>;

import { HELP } from '../../constants/helpContent';

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

export default function IncomeSummaryScreen() {
  const navigation = useNavigation<Nav>();
  const { accentPalette } = useAppTheme();
  const [rows, setRows] = useState<MonthlyIncomeSummary[]>([]);
  const [helpVisible, setHelpVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <AppIconButton icon="question" iconColor={accentPalette.textAccent} onPress={() => setHelpVisible(true)} />
      ),
    });
  }, [accentPalette.textAccent, navigation]);

  useFocusEffect(
    useCallback(() => {
      getMonthlyIncomeSummary().then(setRows);
    }, [])
  );

  const totalEarned = rows.reduce((s, r) => s + r.total_paid, 0);
  const totalPending = rows.reduce((s, r) => s + r.total_pending, 0);
  const heroColors = [withAlpha(accentPalette.main, 0.5), Brand.surfaceElevated, Brand.surfaceDark] as const;

  const renderItem = ({ item }: { item: MonthlyIncomeSummary }) => (
    <TouchableOpacity
      style={styles.monthCard}
      activeOpacity={0.75}
      onPress={() => navigation.navigate('IncomeMonthDetail', { month: item.month })}
    >
      <View style={styles.monthCardTop}>
        <Text style={styles.monthTitle}>{formatMonth(item.month)}</Text>
        <AppIcon name="caretRight" size={20} color={Brand.textSecondary} />
      </View>

      {(item.manager_paid > 0 || item.manager_pending > 0) && (
        <View style={styles.monthRow}>
          <Text variant="bodySmall" style={{ color: Brand.textSecondary }}>Manager classes</Text>
          <View style={styles.monthAmounts}>
            {item.manager_paid > 0 && (
              <Text variant="bodySmall" style={{ color: Brand.orange }}>
                {formatCurrency(item.manager_paid)} paid
              </Text>
            )}
            {item.manager_pending > 0 && (
              <Text variant="bodySmall" style={{ color: Brand.pink }}>
                {formatCurrency(item.manager_pending)} due
              </Text>
            )}
          </View>
        </View>
      )}

      {(item.trainee_paid > 0 || item.trainee_pending > 0) && (
        <View style={styles.monthRow}>
          <Text variant="bodySmall" style={{ color: Brand.textSecondary }}>Trainee packages</Text>
          <View style={styles.monthAmounts}>
            {item.trainee_paid > 0 && (
              <Text variant="bodySmall" style={{ color: Brand.orange }}>
                {formatCurrency(item.trainee_paid)} paid
              </Text>
            )}
            {item.trainee_pending > 0 && (
              <Text variant="bodySmall" style={{ color: Brand.pink }}>
                {formatCurrency(item.trainee_pending)} due
              </Text>
            )}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {rows.length > 0 && (
        <LinearGradient
          colors={heroColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.34, 1]}
          style={styles.heroCard}
        >
          <View style={styles.heroLeft}>
            <Text style={styles.heroLabel}>Total Income</Text>
            <Text style={styles.heroAmount}>{formatCurrency(totalEarned + totalPending)}</Text>
            <Text style={styles.heroSub}>all time</Text>
          </View>
          <View style={styles.heroRight}>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>Earned</Text>
              <Text style={[styles.pillValue, { color: Brand.orange }]}>{formatCurrency(totalEarned)}</Text>
            </View>
            {totalPending > 0 && (
              <View style={[styles.pill, styles.pendingPill]}>
                <Text style={styles.pillLabel}>Pending</Text>
                <Text style={[styles.pillValue, { color: Brand.pink }]}>{formatCurrency(totalPending)}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      )}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.month}
        renderItem={renderItem}
        contentContainerStyle={rows.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="chartBar"
            title="No income data yet"
            subtitle="Income appears here when sessions are completed or packages are created."
          />
        }
      />

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP.incomeSummary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  heroCard: {
    margin: Spacing.lg,
    borderRadius: Radius.hero,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 140,
  },
  heroLeft: { flex: 1, gap: Spacing.xs },
  heroLabel: {
    ...Typography.labelMd,
    fontFamily: 'Outfit_400Regular', // override: softer weight for hero label context
    color: Brand.textSecondary,
  },
  heroAmount: {
    ...Typography.h1,
    fontSize: 32, // between h1(24) and heroNum(52) — income hero figure
    lineHeight: 40,
    color: Brand.textPrimary,
  },
  heroSub: {
    ...Typography.labelSm,
    color: Brand.textSecondary,
  },
  heroRight: { gap: Spacing.sm, alignItems: 'flex-end' },
  pill: {
    backgroundColor: 'rgba(255, 122, 0, 0.20)',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    minWidth: 100,
  },
  pendingPill: { backgroundColor: 'rgba(255, 45, 85, 0.15)' },
  pillLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  pillValue: {
    ...Typography.labelLg,
  },
  listContent: { padding: Spacing.lg, gap: Spacing.sm },
  emptyContainer: { flex: 1 },
  monthCard: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    gap: Spacing.sm,
  },
  monthCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    ...Typography.labelLg,
    color: Brand.textPrimary,
  },
  monthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthAmounts: { alignItems: 'flex-end', gap: 0 },
});
