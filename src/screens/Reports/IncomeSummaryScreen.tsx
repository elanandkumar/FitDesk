import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { AppThemeColors, BrandCore, Elevation, Radius, Spacing, Typography } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { MonthlyIncomeSummary } from '../../types';
import { getMonthlyIncomeSummary } from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import EmptyState from '../../components/common/EmptyState';
import HelpSheet from '../../components/common/HelpSheet';
import AppIcon from '../../components/common/AppIcon';
import AppIconButton from '../../components/common/AppIconButton';
import ThemedSegmentedButtons from '../../components/common/ThemedSegmentedButtons';
import { withAlpha } from '../../utils/colorUtils';

type Nav = StackNavigationProp<RootStackParamList>;
type IncomePeriod = 'thisMonth' | 'lastMonth' | 'thisYear' | 'allTime';
type MonthComparison = {
  label: string;
  tone: 'positive' | 'negative' | 'neutral';
};

import { HELP } from '../../constants/helpContent';

const PERIOD_META: Record<IncomePeriod, string> = {
  thisMonth: 'This\nMonth',
  lastMonth: 'Last\nMonth',
  thisYear: 'This\nYear',
  allTime: 'All\nTime',
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

function isFutureMonth(month: string): boolean {
  return month > toMonthKey(new Date());
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
  const { accentPalette, colors, theme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [rows, setRows] = useState<MonthlyIncomeSummary[]>([]);
  const [period, setPeriod] = useState<IncomePeriod>('thisMonth');
  const [helpVisible, setHelpVisible] = useState(false);
  const [selectedChartMonth, setSelectedChartMonth] = useState<string | null>(null);
  const chartScrollRef = useRef<ScrollView>(null);
  const chartViewportWidthRef = useRef(0);
  const chartContentWidthRef = useRef(0);
  const [chartEdges, setChartEdges] = useState({ left: false, right: false });

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
  const heroColors = [withAlpha(accentPalette.main, 0.5), colors.surfaceRaised, colors.surface] as const;
  const periodSubtitle = getPeriodSubtitle(period);
  const monthComparison = getMonthComparison(rows, period);
  const shouldShowChart = (period === 'thisYear' || period === 'allTime') && chartRows.length > 1;
  const chartMax = Math.max(...chartRows.map(getMonthTotal), 1);
  const chartKey = `${period}:${chartRows.map((row) => row.month).join(',')}`;

  useEffect(() => {
    chartContentWidthRef.current = 0;
    setChartEdges({ left: false, right: false });
  }, [chartKey]);

  const updateChartEdges = (offsetX: number) => {
    const maxOffset = Math.max(0, chartContentWidthRef.current - chartViewportWidthRef.current);
    const next = {
      left: offsetX > 4,
      right: offsetX < maxOffset - 4,
    };
    setChartEdges((current) => (
      current.left === next.left && current.right === next.right ? current : next
    ));
  };

  const scrollChartToLatest = () => {
    const maxOffset = Math.max(0, chartContentWidthRef.current - chartViewportWidthRef.current);
    if (maxOffset <= 0) {
      updateChartEdges(0);
      return;
    }
    requestAnimationFrame(() => chartScrollRef.current?.scrollToEnd({ animated: false }));
    updateChartEdges(maxOffset);
  };

  const renderItem = ({ item }: { item: MonthlyIncomeSummary }) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${formatMonth(item.month)} income details`}
      accessibilityHint="Shows income details for this month"
      style={styles.monthCard}
      activeOpacity={0.75}
      onPress={() => navigation.navigate('IncomeMonthDetail', { month: item.month })}
    >
      <View style={styles.monthCardContent}>
        <View style={styles.monthCardMain}>
          <View style={styles.monthCardTop}>
            <Text style={styles.monthTitle}>{formatMonth(item.month)}</Text>
          </View>

          <View style={styles.monthCategories}>
            {(item.organizer_paid > 0 || item.organizer_pending > 0) && (
              <View style={styles.monthCategory}>
                <Text style={styles.monthCategoryLabel}>Organizer sessions</Text>
                <View style={styles.monthAmountStatus}>
                  <Text style={styles.monthAmountLabel} numberOfLines={1}>Paid</Text>
                  <Text
                    style={[styles.monthAmount, item.organizer_paid > 0 ? styles.monthAmountPaid : styles.zeroAmount]}
                    numberOfLines={1}
                  >
                    {formatCurrency(item.organizer_paid)}
                  </Text>
                </View>
                <View style={styles.monthAmountStatus}>
                  <Text style={styles.monthAmountLabel} numberOfLines={1}>Pending</Text>
                  <Text
                    style={[styles.monthAmount, item.organizer_pending > 0 ? styles.monthAmountPending : styles.zeroAmount]}
                    numberOfLines={1}
                  >
                    {formatCurrency(item.organizer_pending)}
                  </Text>
                </View>
              </View>
            )}

            {(item.organizer_paid > 0 || item.organizer_pending > 0) && (item.trainee_paid > 0 || item.trainee_pending > 0) && (
              <View style={styles.monthCategorySep} />
            )}

            {(item.trainee_paid > 0 || item.trainee_pending > 0) && (
              <View style={styles.monthCategory}>
                <Text style={styles.monthCategoryLabel}>Trainee packages</Text>
                <View style={styles.monthAmountStatus}>
                  <Text style={styles.monthAmountLabel} numberOfLines={1}>Paid</Text>
                  <Text
                    style={[styles.monthAmount, item.trainee_paid > 0 ? styles.monthAmountPaid : styles.zeroAmount]}
                    numberOfLines={1}
                  >
                    {formatCurrency(item.trainee_paid)}
                  </Text>
                </View>
                <View style={styles.monthAmountStatus}>
                  <Text style={styles.monthAmountLabel} numberOfLines={1}>Pending</Text>
                  <Text
                    style={[styles.monthAmount, item.trainee_pending > 0 ? styles.monthAmountPending : styles.zeroAmount]}
                    numberOfLines={1}
                  >
                    {formatCurrency(item.trainee_pending)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPeriodSelector = () => (
    <ThemedSegmentedButtons
      value={period}
      onValueChange={(value) => {
        setSelectedChartMonth(null);
        setPeriod(value as IncomePeriod);
      }}
      buttons={PERIODS.map((option) => ({
        value: option,
        label: PERIOD_META[option],
      }))}
      style={styles.periodSegment}
    />
  );

  const renderIncomeChart = () => {
    if (!shouldShowChart) return null;
    const includeYear = period === 'allTime';
    const selectedRow = chartRows.find((row) => row.month === selectedChartMonth) ?? null;

    return (
      <View style={styles.chartPanel}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Income by Month</Text>
          <View style={styles.chartLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: BrandCore.pink }]} />
              <Text style={styles.legendLabel}>Paid</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: BrandCore.orange }]} />
              <Text style={styles.legendLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {selectedRow && getMonthTotal(selectedRow) > 0 && (
          <View style={styles.chartTooltip}>
            <View style={styles.chartTooltipHeader}>
              <View style={styles.chartTooltipHeading}>
                <Text style={styles.chartTooltipMonth}>{formatMonth(selectedRow.month)}</Text>
                {isFutureMonth(selectedRow.month) && selectedRow.total_pending > 0 && (
                  <Text style={styles.chartTooltipScheduled}>Scheduled</Text>
                )}
              </View>
              <AppIconButton
                icon="xCircle"
                iconColor={colors.textMuted}
                accessibilityLabel="Close income details"
                size={18}
                style={styles.chartTooltipClose}
                onPress={() => setSelectedChartMonth(null)}
              />
            </View>
            <View style={styles.chartTooltipMetrics}>
              <View style={styles.chartTooltipMetric}>
                <Text style={styles.chartTooltipMetricLabel}>Total</Text>
                <Text style={[styles.chartTooltipMetricValue, { color: colors.textPrimary }]}>
                  {formatCurrency(getMonthTotal(selectedRow))}
                </Text>
              </View>
              <View style={styles.chartTooltipMetricDivider} />
              <View style={styles.chartTooltipMetric}>
                <Text style={styles.chartTooltipMetricLabel}>Paid</Text>
                <Text style={[styles.chartTooltipMetricValue, { color: BrandCore.pink }]}>
                  {formatCurrency(selectedRow.total_paid)}
                </Text>
              </View>
              <View style={styles.chartTooltipMetricDivider} />
              <View style={styles.chartTooltipMetric}>
                <Text style={styles.chartTooltipMetricLabel}>Pending</Text>
                <Text style={[styles.chartTooltipMetricValue, { color: BrandCore.orange }]}>
                  {formatCurrency(selectedRow.total_pending)}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.chartScrollViewport}>
          <ScrollView
            key={chartKey}
            ref={chartScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chartScrollContent}
            onContentSizeChange={(width) => {
              chartContentWidthRef.current = width;
              scrollChartToLatest();
            }}
            onLayout={(event) => {
              chartViewportWidthRef.current = event.nativeEvent.layout.width;
              scrollChartToLatest();
            }}
            onScroll={(event) => updateChartEdges(event.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
          >
            {chartRows.map((item) => {
              const total = getMonthTotal(item);
              const { barHeight, paidHeight, pendingHeight } = getChartSegmentHeights(item, chartMax);
              const scheduled = isFutureMonth(item.month) && item.total_pending > 0;
              const selected = item.month === selectedChartMonth;

              return (
                <TouchableOpacity
                  key={item.month}
                  activeOpacity={0.75}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatMonth(item.month)} income ${formatCurrency(total)}${scheduled ? ', scheduled' : ''}`}
                  accessibilityState={{ selected }}
                  style={styles.chartBarItem}
                  onPress={() => setSelectedChartMonth((current) => current === item.month ? null : item.month)}
                >
                  <View style={[styles.chartBarTrack, selected && styles.chartBarTrackSelected]}>
                    <View
                      style={[
                        styles.chartBarStack,
                        pendingHeight > 0 && styles.chartBarPending,
                        { height: barHeight },
                      ]}
                    >
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
                  <Text
                    style={[styles.chartMonthLabel, selected && styles.chartMonthLabelSelected]}
                  >
                    {formatChartMonth(item.month, includeYear)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          {chartEdges.left && (
            <LinearGradient
              pointerEvents="none"
              colors={[colors.surface, withAlpha(colors.surface, 0)]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.chartEdgeHint, styles.chartEdgeHintLeft]}
            >
              <AppIcon name="caretLeft" size={16} color={colors.textSecondary} weight="bold" />
            </LinearGradient>
          )}
          {chartEdges.right && (
            <LinearGradient
              pointerEvents="none"
              colors={[withAlpha(colors.surface, 0), colors.surface]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.chartEdgeHint, styles.chartEdgeHintRight]}
            >
              <AppIcon name="caretRight" size={16} color={colors.textSecondary} weight="bold" />
            </LinearGradient>
          )}
        </View>
      </View>
    );
  };

  const renderListHeader = () => (
    <>
      {visibleRows.length > 0 && (
        <LinearGradient
          colors={heroColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          locations={[0, 0.34, 1]}
          style={styles.heroCard}
        >
          <View style={styles.heroHeader}>
            <Text style={styles.heroLabel}>Total Income</Text>
            <Text style={styles.heroSub}>{periodSubtitle}</Text>
          </View>

          <Text
            style={styles.heroAmount}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
          >
            {formatCurrency(totalEarned + totalPending)}
          </Text>

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

          <View style={styles.heroMetrics}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>Paid</Text>
              <Text style={[styles.heroMetricValue, { color: BrandCore.pink }]}>{formatCurrency(totalEarned)}</Text>
            </View>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricLabel}>Pending</Text>
              <Text style={[styles.heroMetricValue, totalPending > 0 ? styles.pendingMetricValue : styles.zeroMetricValue]}>
                {formatCurrency(totalPending)}
              </Text>
            </View>
          </View>
        </LinearGradient>
      )}
      {renderIncomeChart()}
    </>
  );

  return (
    <View style={styles.container}>
      {rows.length > 0 && renderPeriodSelector()}

      {visibleRows.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState
            icon="chartBar"
            title={rows.length === 0 ? 'No income data yet' : `No income for ${periodSubtitle}`}
            subtitle={
              rows.length === 0
                ? 'Income appears here when sessions are completed or packages are created.'
                : 'Use another period to view older income.'
            }
          />
        </View>
      ) : (
        <FlatList
          data={visibleRows}
          keyExtractor={(item) => item.month}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderListHeader}
        />
      )}

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP.incomeSummary} />
    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  periodSegment: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  heroCard: {
    margin: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: Radius.card,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  heroHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroLabel: {
    ...Typography.labelMd,
    fontFamily: 'Outfit_400Regular', // override: softer weight for hero label context
    color: colors.textSecondary,
  },
  heroAmount: {
    ...Typography.heroNum,
    fontSize: 40,
    lineHeight: 48,
    color: colors.textPrimary,
  },
  heroSub: {
    ...Typography.labelSm,
    color: colors.textSecondary,
  },
  heroComparisonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
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
    color: colors.textSecondary,
  },
  heroComparisonPositiveText: {
    color: colors.success,
  },
  heroComparisonNegativeText: {
    color: colors.danger,
  },
  heroMetrics: {
    alignItems: 'stretch',
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
  },
  heroMetric: {
    alignItems: 'center',
    gap: Spacing.xs,
  },
  heroMetricLabel: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  heroMetricValue: {
    ...Typography.labelLg,
  },
  pendingMetricValue: { color: BrandCore.orange },
  zeroMetricValue: { color: colors.textMuted },
  chartPanel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: Radius.card,
    borderWidth: 1,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    position: 'relative',
  },
  chartHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  chartTitle: {
    ...Typography.labelLg,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  chartLegend: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
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
    color: colors.textSecondary,
  },
  chartTooltip: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: Radius.card,
    borderWidth: 1,
    elevation: 6,
    left: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    position: 'absolute',
    right: Spacing.md,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    top: Spacing.sm,
    zIndex: 2,
  },
  chartTooltipHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    justifyContent: 'space-between',
  },
  chartTooltipHeading: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 1,
    gap: Spacing.xs,
  },
  chartTooltipClose: {
    height: 28,
    marginRight: -6,
    width: 28,
  },
  chartTooltipMonth: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  chartTooltipScheduled: {
    ...Typography.microLabel,
    color: BrandCore.orange,
  },
  chartTooltipMetrics: {
    alignItems: 'stretch',
    flexDirection: 'row',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  chartTooltipMetric: {
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  chartTooltipMetricDivider: {
    backgroundColor: colors.border,
    width: 1,
  },
  chartTooltipMetricLabel: {
    ...Typography.microLabel,
    color: colors.textSecondary,
  },
  chartTooltipMetricValue: {
    ...Typography.labelMd,
    fontWeight: '600',
  },
  chartScrollViewport: {
    position: 'relative',
  },
  chartEdgeHint: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    width: 32,
    zIndex: 1,
  },
  chartEdgeHintLeft: {
    left: 0,
  },
  chartEdgeHintRight: {
    right: 0,
  },
  chartScrollContent: {
    alignItems: 'flex-end',
    gap: Spacing.md,
    minWidth: '100%',
    paddingRight: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  chartBarItem: {
    alignItems: 'center',
    gap: Spacing.xs,
    position: 'relative',
    width: CHART_BAR_ITEM_WIDTH,
  },
  chartBarTrack: {
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: Radius.default,
    borderWidth: 1,
    height: CHART_BAR_HEIGHT,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 24,
  },
  chartBarTrackSelected: {
    borderColor: colors.textSecondary,
  },
  chartBarStack: {
    alignSelf: 'center',
    borderTopLeftRadius: Radius.default,
    borderTopRightRadius: Radius.default,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 24,
  },
  chartBarSegment: {
    width: '100%',
  },
  chartBarPaid: {
    backgroundColor: BrandCore.pink,
  },
  chartBarPending: {
    backgroundColor: BrandCore.orange,
  },
  chartMonthLabel: {
    ...Typography.caption,
    color: colors.textMuted,
    lineHeight: 16,
    textAlign: 'center',
  },
  chartMonthLabelSelected: {
    color: colors.textPrimary,
  },
  listContent: { paddingBottom: Spacing.lg },
  emptyContainer: { flex: 1 },
  monthCard: {
    ...Elevation.interactive,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  monthCardContent: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  monthCardMain: { flex: 1, gap: Spacing.sm },
  monthCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  monthTitle: {
    ...Typography.labelLg,
    color: colors.textPrimary,
  },
  monthCategories: {
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  monthCategory: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  monthCategorySep: {
    height: 1,
    backgroundColor: colors.border,
  },
  monthCategoryLabel: {
    ...Typography.bodySm,
    color: colors.textSecondary,
    width: 60,
  },
  monthAmountStatus: {
    alignItems: 'center',
  },
  monthAmountLabel: { ...Typography.caption, color: colors.textSecondary },
  monthAmount: {
    ...Typography.h4,
    fontWeight: '700',
  },
  monthAmountPaid: { color: BrandCore.pink },
  monthAmountPending: { color: BrandCore.orange },
  zeroAmount: { color: colors.textMuted },
});
