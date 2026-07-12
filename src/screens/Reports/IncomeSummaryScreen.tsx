import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
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
type MonthComparison = {
  label: string;
  tone: 'positive' | 'negative' | 'neutral';
};

import { HELP } from '../../constants/helpContent';

const PERIOD_META: Record<IncomePeriod, { labelTop: string; labelBottom: string }> = {
  thisMonth: { labelTop: 'This', labelBottom: 'Month' },
  lastMonth: { labelTop: 'Last', labelBottom: 'Month' },
  thisYear: { labelTop: 'This', labelBottom: 'Year' },
  allTime: { labelTop: 'All', labelBottom: 'Time' },
};

const PERIODS: IncomePeriod[] = ['thisMonth', 'lastMonth', 'thisYear', 'allTime'];
const CHART_BAR_HEIGHT = 112;
const CHART_BAR_ITEM_WIDTH = 42;

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function formatChartMonth(ym: string, includeYear: boolean): string {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
    month: 'short',
    ...(includeYear ? { year: '2-digit' } : {}),
  });
}

function toMonthKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function addMonths(monthKey: string, offset: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  return toMonthKey(new Date(year, month - 1 + offset, 1));
}

function getMonthTotal(row: MonthlyIncomeSummary): number {
  return row.total_paid + row.total_pending;
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

function getPeriodMonthKey(period: IncomePeriod): string | null {
  const today = new Date();
  if (period === 'thisMonth') return toMonthKey(today);
  if (period === 'lastMonth') return toMonthKey(new Date(today.getFullYear(), today.getMonth() - 1, 1));
  return null;
}

function getMonthComparison(rows: MonthlyIncomeSummary[], period: IncomePeriod): MonthComparison | null {
  const currentMonth = getPeriodMonthKey(period);
  if (!currentMonth) return null;

  const currentRow = rows.find((row) => row.month === currentMonth);
  const previousMonth = addMonths(currentMonth, -1);
  const previousRow = rows.find((row) => row.month === previousMonth);
  if (!currentRow || !previousRow) return null;

  const delta = getMonthTotal(currentRow) - getMonthTotal(previousRow);
  if (delta === 0) {
    return {
      label: `No change vs ${formatChartMonth(previousMonth, true)}`,
      tone: 'neutral',
    };
  }

  const sign = delta > 0 ? '+' : '-';
  return {
    label: `${sign}${formatCurrency(Math.abs(delta))} vs ${formatChartMonth(previousMonth, true)}`,
    tone: delta > 0 ? 'positive' : 'negative',
  };
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

function getChartSegmentHeights(
  row: MonthlyIncomeSummary,
  maxTotal: number
): { barHeight: number; paidHeight: number; pendingHeight: number } {
  const total = getMonthTotal(row);
  if (total <= 0) return { barHeight: 0, paidHeight: 0, pendingHeight: 0 };

  const barHeight = Math.max(8, Math.round((total / maxTotal) * CHART_BAR_HEIGHT));
  const hasPaid = row.total_paid > 0;
  const hasPending = row.total_pending > 0;
  let paidHeight = hasPaid ? Math.round((row.total_paid / total) * barHeight) : 0;
  let pendingHeight = hasPending ? Math.round((row.total_pending / total) * barHeight) : 0;

  if (hasPaid) paidHeight = Math.max(4, paidHeight);
  if (hasPending) pendingHeight = Math.max(4, pendingHeight);

  const overflow = paidHeight + pendingHeight - barHeight;
  if (overflow > 0) {
    if (paidHeight >= pendingHeight && paidHeight > 4) {
      paidHeight = Math.max(4, paidHeight - overflow);
    } else if (pendingHeight > 4) {
      pendingHeight = Math.max(4, pendingHeight - overflow);
    }
  }

  return { barHeight, paidHeight, pendingHeight };
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
  const chartRows = useMemo(
    () => [...visibleRows].sort((a, b) => a.month.localeCompare(b.month)),
    [visibleRows]
  );
  const totalEarned = visibleRows.reduce((s, r) => s + r.total_paid, 0);
  const totalPending = visibleRows.reduce((s, r) => s + r.total_pending, 0);
  const heroColors = [withAlpha(accentPalette.main, 0.5), Brand.surfaceElevated, Brand.surfaceDark] as const;
  const periodSubtitle = getPeriodSubtitle(period);
  const monthComparison = getMonthComparison(rows, period);
  const shouldShowChart = (period === 'thisYear' || period === 'allTime') && chartRows.length > 1;
  const chartMax = Math.max(...chartRows.map(getMonthTotal), 1);

  const renderItem = ({ item }: { item: MonthlyIncomeSummary }) => (
    <TouchableOpacity
      style={styles.monthCard}
      activeOpacity={0.75}
      onPress={() => navigation.navigate('IncomeMonthDetail', { month: item.month })}
    >
      <View style={styles.monthCardTop}>
        <Text style={styles.monthTitle}>{formatMonth(item.month)}</Text>
      </View>

      <View style={styles.monthCategories}>
        {(item.manager_paid > 0 || item.manager_pending > 0) && (
          <View style={styles.monthCategory}>
            <Text style={styles.monthCategoryLabel}>Manager classes</Text>
            <View style={styles.monthAmounts}>
              <View style={styles.monthAmountStatus}>
                <Text style={styles.monthAmountLabel}>Paid</Text>
                <Text style={[styles.monthAmount, item.manager_paid > 0 ? styles.monthAmountPaid : styles.zeroAmount]}>
                  {formatCurrency(item.manager_paid)}
                </Text>
              </View>
              <View style={styles.monthAmountStatus}>
                <Text style={styles.monthAmountLabel}>Pending</Text>
                <Text style={[styles.monthAmount, item.manager_pending > 0 ? styles.monthAmountPending : styles.zeroAmount]}>
                  {formatCurrency(item.manager_pending)}
                </Text>
              </View>
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
              <View style={styles.monthAmountStatus}>
                <Text style={styles.monthAmountLabel}>Paid</Text>
                <Text style={[styles.monthAmount, item.trainee_paid > 0 ? styles.monthAmountPaid : styles.zeroAmount]}>
                  {formatCurrency(item.trainee_paid)}
                </Text>
              </View>
              <View style={styles.monthAmountStatus}>
                <Text style={styles.monthAmountLabel}>Pending</Text>
                <Text style={[styles.monthAmount, item.trainee_pending > 0 ? styles.monthAmountPending : styles.zeroAmount]}>
                  {formatCurrency(item.trainee_pending)}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
      <View style={styles.monthActionRow}>
        <AppIcon name="caretRight" size={20} color={Brand.textSecondary} />
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

  const renderIncomeChart = () => {
    if (!shouldShowChart) return null;
    const includeYear = period === 'allTime';

    return (
      <View style={styles.chartPanel}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Income by Month</Text>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Brand.pink }]} />
              <Text style={styles.legendLabel}>Paid</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: Brand.orange }]} />
              <Text style={styles.legendLabel}>Pending</Text>
            </View>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chartScrollContent}
        >
          {chartRows.map((item) => {
            const total = getMonthTotal(item);
            const { barHeight, paidHeight, pendingHeight } = getChartSegmentHeights(item, chartMax);

            return (
              <TouchableOpacity
                key={item.month}
                activeOpacity={0.75}
                accessibilityRole="button"
                accessibilityLabel={`${formatMonth(item.month)} income ${formatCurrency(total)}`}
                style={styles.chartBarItem}
                onPress={() => navigation.navigate('IncomeMonthDetail', { month: item.month })}
              >
                <View style={styles.chartBarTrack}>
                  <View style={[styles.chartBarStack, { height: barHeight }]}>
                    {pendingHeight > 0 && (
                      <View
                        style={[
                          styles.chartBarSegment,
                          styles.chartBarPending,
                          { height: pendingHeight },
                        ]}
                      />
                    )}
                    {paidHeight > 0 && (
                      <View
                        style={[
                          styles.chartBarSegment,
                          styles.chartBarPaid,
                          { height: paidHeight },
                        ]}
                      />
                    )}
                  </View>
                </View>
                <Text style={styles.chartMonthLabel}>{formatChartMonth(item.month, includeYear)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

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
            {monthComparison && (
              <View
                style={[
                  styles.heroComparisonBadge,
                  monthComparison.tone === 'positive' && styles.heroComparisonPositive,
                  monthComparison.tone === 'negative' && styles.heroComparisonNegative,
                ]}
              >
                <Text
                  style={[
                    styles.heroComparisonText,
                    monthComparison.tone === 'positive' && styles.heroComparisonPositiveText,
                    monthComparison.tone === 'negative' && styles.heroComparisonNegativeText,
                  ]}
                >
                  {monthComparison.label}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.heroRight}>
            <View style={styles.pill}>
              <Text style={styles.pillLabel}>Earned</Text>
              <Text style={[styles.pillValue, { color: Brand.pink }]}>{formatCurrency(totalEarned)}</Text>
            </View>
            <View style={[styles.pill, totalPending > 0 ? styles.pendingPill : styles.pendingPillMuted]}>
              <Text style={styles.pillLabel}>Pending</Text>
              <Text style={[styles.pillValue, totalPending > 0 ? styles.pendingPillValue : styles.zeroPillValue]}>
                {formatCurrency(totalPending)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      )}

      {renderIncomeChart()}

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
  heroComparisonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Brand.surfaceElevated,
    borderColor: Brand.borderSubtle,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  heroComparisonPositive: {
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  heroComparisonNegative: {
    backgroundColor: 'rgba(255, 82, 82, 0.14)',
    borderColor: 'rgba(255, 82, 82, 0.3)',
  },
  heroComparisonText: {
    ...Typography.microLabel,
    color: Brand.textSecondary,
  },
  heroComparisonPositiveText: {
    color: '#86EFAC',
  },
  heroComparisonNegativeText: {
    color: '#FF8A8A',
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
  pendingPillMuted: {
    backgroundColor: Brand.surfaceElevated,
    borderColor: Brand.borderSubtle,
    borderWidth: 1,
  },
  pillLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  pillValue: {
    ...Typography.labelLg,
  },
  pendingPillValue: { color: Brand.orange },
  zeroPillValue: { color: Brand.textMuted },
  chartPanel: {
    backgroundColor: Brand.surfaceDark,
    borderColor: Brand.borderSubtle,
    borderRadius: Radius.card,
    borderWidth: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  chartHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    ...Typography.labelLg,
    color: Brand.textPrimary,
  },
  chartLegend: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  legendDot: {
    borderRadius: Radius.full,
    height: 8,
    width: 8,
  },
  legendLabel: {
    ...Typography.caption,
    color: Brand.textSecondary,
  },
  chartScrollContent: {
    alignItems: 'flex-end',
    gap: Spacing.md,
    minWidth: '100%',
    paddingTop: Spacing.xs,
  },
  chartBarItem: {
    alignItems: 'center',
    gap: Spacing.xs,
    position: 'relative',
    width: CHART_BAR_ITEM_WIDTH,
  },
  chartBarTrack: {
    backgroundColor: Brand.surfaceElevated,
    borderColor: Brand.borderSubtle,
    borderRadius: Radius.full,
    borderWidth: 1,
    height: CHART_BAR_HEIGHT,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 18,
  },
  chartBarStack: {
    borderRadius: Radius.full,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: '100%',
  },
  chartBarSegment: {
    width: '100%',
  },
  chartBarPaid: {
    backgroundColor: Brand.pink,
  },
  chartBarPending: {
    backgroundColor: Brand.orange,
  },
  chartMonthLabel: {
    ...Typography.caption,
    color: Brand.textMuted,
    lineHeight: 16,
    minHeight: 32,
    textAlign: 'center',
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
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  monthCategory: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  monthCategorySep: {
    height: 1,
    backgroundColor: Brand.borderSubtle,
  },
  monthCategoryLabel: {
    ...Typography.bodySm,
    color: Brand.textSecondary,
    flex: 1,
  },
  monthAmounts: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
  },
  monthAmountStatus: {
    alignItems: 'center',
    minWidth: 86,
  },
  monthAmountLabel: { ...Typography.caption, color: Brand.textSecondary },
  monthAmount: {
    ...Typography.h4,
    fontWeight: '700',
  },
  monthAmountPaid: { color: Brand.pink },
  monthAmountPending: { color: Brand.orange },
  monthActionRow: { alignItems: 'flex-end' },
  zeroAmount: { color: Brand.textMuted },
});
