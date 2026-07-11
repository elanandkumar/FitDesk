import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
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
type IncomePeriod = 'thisMonth' | 'lastMonth' | 'thisYear' | 'allTime';

import { HELP } from '../../constants/helpContent';

const PERIOD_META: Record<IncomePeriod, { labelTop: string; labelBottom: string }> = {
  thisMonth: { labelTop: 'This', labelBottom: 'Month' },
  lastMonth: { labelTop: 'Last', labelBottom: 'Month' },
  thisYear: { labelTop: 'This', labelBottom: 'Year' },
  allTime: { labelTop: 'All', labelBottom: 'Time' },
};

const PERIODS: IncomePeriod[] = ['thisMonth', 'lastMonth', 'thisYear', 'allTime'];

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function getPeriodSubtitle(period: IncomePeriod): string {
  const today = new Date();
  if (period === 'thisMonth') return formatMonth(toMonthKey(today));
  if (period === 'lastMonth') {
    const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    return formatMonth(toMonthKey(lastMonthDate));
  }
  if (period === 'thisYear') return String(today.getFullYear());
  return 'all time';
}

function getPeriodRows(rows: MonthlyIncomeSummary[], period: IncomePeriod): MonthlyIncomeSummary[] {
  const today = new Date();
  const thisMonth = toMonthKey(today);
  const lastMonthDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonth = toMonthKey(lastMonthDate);
  const thisYear = String(today.getFullYear());

  if (period === 'thisMonth') return rows.filter((row) => row.month === thisMonth);
  if (period === 'lastMonth') return rows.filter((row) => row.month === lastMonth);
  if (period === 'thisYear') return rows.filter((row) => row.month.startsWith(thisYear));
  return rows;
}

export default function IncomeSummaryScreen() {
  const navigation = useNavigation<Nav>();
  const { accentPalette } = useAppTheme();
  const [rows, setRows] = useState<MonthlyIncomeSummary[]>([]);
  const [period, setPeriod] = useState<IncomePeriod>('thisMonth');
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

  const visibleRows = useMemo(() => getPeriodRows(rows, period), [period, rows]);
  const totalEarned = visibleRows.reduce((s, r) => s + r.total_paid, 0);
  const totalPending = visibleRows.reduce((s, r) => s + r.total_pending, 0);
  const heroColors = [withAlpha(accentPalette.main, 0.5), Brand.surfaceElevated, Brand.surfaceDark] as const;
  const periodSubtitle = getPeriodSubtitle(period);

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

      <View style={styles.monthCategories}>
        {(item.manager_paid > 0 || item.manager_pending > 0) && (
          <View style={styles.monthCategory}>
            <Text style={styles.monthCategoryLabel}>Manager classes</Text>
            <View style={styles.monthAmounts}>
              {item.manager_paid > 0 && (
                <View style={styles.monthAmountStatus}>
                  <Text style={styles.monthAmountLabel}>Paid</Text>
                  <Text style={[styles.monthAmount, styles.monthAmountPaid]}>
                    {formatCurrency(item.manager_paid)}
                  </Text>
                </View>
              )}
              {item.manager_pending > 0 && (
                <View style={styles.monthAmountStatus}>
                  <Text style={styles.monthAmountLabel}>Pending</Text>
                  <Text style={[styles.monthAmount, styles.monthAmountPending]}>
                    {formatCurrency(item.manager_pending)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {(item.manager_paid > 0 || item.manager_pending > 0) && (item.trainee_paid > 0 || item.trainee_pending > 0) && (
          <View style={styles.monthCategorySep} />
        )}

        {(item.trainee_paid > 0 || item.trainee_pending > 0) && (
          <View style={styles.monthCategory}>
            <Text style={styles.monthCategoryLabel}>Trainee packages</Text>
            <View style={styles.monthAmounts}>
              {item.trainee_paid > 0 && (
                <View style={styles.monthAmountStatus}>
                  <Text style={styles.monthAmountLabel}>Paid</Text>
                  <Text style={[styles.monthAmount, styles.monthAmountPaid]}>
                    {formatCurrency(item.trainee_paid)}
                  </Text>
                </View>
              )}
              {item.trainee_pending > 0 && (
                <View style={styles.monthAmountStatus}>
                  <Text style={styles.monthAmountLabel}>Pending</Text>
                  <Text style={[styles.monthAmount, styles.monthAmountPending]}>
                    {formatCurrency(item.trainee_pending)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderPeriodSelector = () => (
    <View style={styles.periodSegment}>
      {PERIODS.map((option) => {
        const isSelected = option === period;
        const meta = PERIOD_META[option];

        return (
          <TouchableOpacity
            key={option}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.periodOption,
              isSelected && { backgroundColor: accentPalette.main },
            ]}
            onPress={() => setPeriod(option)}
          >
            <Text style={[styles.periodLabel, isSelected && styles.periodLabelSelected]}>
              {meta.labelTop}
            </Text>
            <Text style={[styles.periodLabel, isSelected && styles.periodLabelSelected]}>
              {meta.labelBottom}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      {rows.length > 0 && renderPeriodSelector()}

      {visibleRows.length > 0 && (
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
            <Text style={styles.heroSub}>{periodSubtitle}</Text>
          </View>
          <View style={styles.heroRight}>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>Earned</Text>
              <Text style={[styles.pillValue, { color: Brand.pink }]}>{formatCurrency(totalEarned)}</Text>
            </View>
            {totalPending > 0 && (
              <View style={[styles.pill, styles.pendingPill]}>
                <Text style={styles.pillLabel}>Pending</Text>
                <Text style={[styles.pillValue, { color: Brand.orange }]}>{formatCurrency(totalPending)}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      )}

      <FlatList
        data={visibleRows}
        keyExtractor={(item) => item.month}
        renderItem={renderItem}
        contentContainerStyle={visibleRows.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="chartBar"
            title={rows.length === 0 ? 'No income data yet' : `No income for ${periodSubtitle}`}
            subtitle={
              rows.length === 0
                ? 'Income appears here when sessions are completed or packages are created.'
                : 'Use another period to view older income.'
            }
          />
        }
      />

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP.incomeSummary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  periodSegment: {
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: Brand.backgroundDark,
    borderColor: Brand.borderSubtle,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  periodOption: {
    alignItems: 'center',
    flex: 1,
    height: 58,
    justifyContent: 'center',
  },
  periodLabel: {
    ...Typography.labelSm,
    color: Brand.textPrimary,
    lineHeight: 17,
    textAlign: 'center',
  },
  periodLabelSelected: {
    color: Brand.textPrimary,
  },
  heroCard: {
    margin: Spacing.lg,
    marginTop: Spacing.sm,
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
    backgroundColor: 'rgba(255, 61, 129, 0.18)',
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    minWidth: 100,
  },
  pendingPill: { backgroundColor: 'rgba(255, 122, 0, 0.18)' },
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
  monthCategories: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  monthCategory: {
    flex: 1,
    gap: Spacing.xs,
  },
  monthCategorySep: {
    width: 1,
    backgroundColor: Brand.borderSubtle,
  },
  monthCategoryLabel: {
    ...Typography.bodySm,
    color: Brand.textSecondary,
  },
  monthAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  monthAmountStatus: {
    minWidth: 66,
  },
  monthAmountLabel: { ...Typography.caption, color: Brand.textSecondary },
  monthAmount: {
    ...Typography.bodySm,
    fontWeight: '600',
  },
  monthAmountPaid: { color: Brand.pink },
  monthAmountPending: { color: Brand.orange },
});
