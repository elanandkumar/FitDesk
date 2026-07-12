import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { Brand, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { EnrichedManagerPayment } from '../../types';
import { getAllEnrichedManagerPayments } from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import { RootStackParamList } from '../../navigation/types';
import EmptyState from '../../components/common/EmptyState';
import AppIconButton from '../../components/common/AppIconButton';

type Nav = StackNavigationProp<RootStackParamList>;
type PaymentStatusFilter = 'pending' | 'all';
type ManagerSortOrder = 'pending' | 'az' | 'za';

type ManagerSummary = {
  managerId: number;
  managerName: string;
  sessionCount: number;
  paidTotal: number;
  pendingTotal: number;
};

interface ManagerPaymentsScreenProps {
  initialPendingOnly?: boolean;
  focusKey?: number;
}

function buildSummaries(payments: EnrichedManagerPayment[], sortOrder: ManagerSortOrder): ManagerSummary[] {
  const map = new Map<number, ManagerSummary>();
  for (const p of payments) {
    if (!map.has(p.manager_id)) {
      map.set(p.manager_id, {
        managerId: p.manager_id,
        managerName: p.manager_name,
        sessionCount: 0,
        paidTotal: 0,
        pendingTotal: 0,
      });
    }
    const s = map.get(p.manager_id)!;
    s.sessionCount += 1;
    if (p.status === 'paid') s.paidTotal += p.amount;
    else s.pendingTotal += p.amount;
  }
  return Array.from(map.values()).sort((a, b) => {
    if (sortOrder === 'az') return a.managerName.localeCompare(b.managerName);
    if (sortOrder === 'za') return b.managerName.localeCompare(a.managerName);
    return b.pendingTotal !== a.pendingTotal
      ? b.pendingTotal - a.pendingTotal
      : a.managerName.localeCompare(b.managerName);
  });
}

export default function ManagerPaymentsScreen({ initialPendingOnly, focusKey }: ManagerPaymentsScreenProps) {
  const { accentPalette, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [summaries, setSummaries] = useState<ManagerSummary[]>([]);
  const [allPayments, setAllPayments] = useState<EnrichedManagerPayment[]>([]);
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('pending');
  const [sortOrder, setSortOrder] = useState<ManagerSortOrder>('pending');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const pendingOnly = statusFilter === 'pending';
  const filtersAreDefault = statusFilter === 'pending' && sortOrder === 'pending';

  const resetFilters = () => {
    setStatusFilter('pending');
    setSortOrder('pending');
  };

  useEffect(() => {
    if (initialPendingOnly !== undefined) {
      setStatusFilter(initialPendingOnly ? 'pending' : 'all');
    }
  }, [focusKey, initialPendingOnly]);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const payments = await getAllEnrichedManagerPayments(pendingOnly);
      setAllPayments(payments);
      setSummaries(buildSummaries(payments, sortOrder));
    } catch {
      // list stays empty on DB error
    } finally {
      setIsLoading(false);
    }
  }, [pendingOnly, sortOrder]);

  const totalPending = allPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalPaid = allPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }: { item: ManagerSummary }) => (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={`${item.managerName} payment details`}
      accessibilityHint="Shows manager payment details"
      style={styles.card}
      onPress={() => navigation.navigate('ManagerPaymentDetail', {
        managerId: item.managerId,
        managerName: item.managerName,
      })}
      activeOpacity={0.75}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.managerName}>{item.managerName}</Text>
          <Text style={styles.sessionCount}>
            {item.sessionCount} session{item.sessionCount !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <View style={styles.amountStatus}>
            <Text style={styles.amountLabel}>Paid</Text>
            <Text style={[styles.cardAmount, item.paidTotal > 0 ? styles.paidAmount : styles.zeroAmount]}>
              {formatCurrency(item.paidTotal)}
            </Text>
          </View>
          <View style={styles.amountStatus}>
            <Text style={styles.amountLabel}>Pending</Text>
            <Text style={[styles.cardAmount, item.pendingTotal > 0 ? styles.pendingAmount : styles.zeroAmount]}>
              {formatCurrency(item.pendingTotal)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSheetTitle = (label: string) => (
    <View style={styles.sheetSectionTitleRow}>
      <View style={[styles.sheetSectionAccent, { backgroundColor: accentPalette.main }]} />
      <Text style={styles.sheetSectionTitle}>{label}</Text>
    </View>
  );

  const renderFilterChip = (
    label: string,
    selected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      activeOpacity={0.72}
      onPress={onPress}
      style={[
        styles.sheetChip,
        selected && { backgroundColor: accentPalette.main, borderColor: accentPalette.main },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.sheetChipText, selected && styles.sheetChipTextSelected]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const sortLabel = sortOrder === 'pending' ? 'Pending first' : sortOrder === 'az' ? 'A-Z' : 'Z-A';

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.filterRow}>
        <Text style={styles.filterSummary}>
          {pendingOnly ? 'Pending only' : 'All payments'} · {sortLabel}
        </Text>
        <AppIconButton
          icon="sliders"
          iconColor={accentPalette.textAccent}
          onPress={() => setFiltersVisible(true)}
          style={[
            styles.filterButton,
            {
              borderColor: filtersAreDefault ? accentPalette.main : accentPalette.textAccent,
              backgroundColor: filtersAreDefault ? Brand.surfaceDark : accentPalette.main + '26',
            },
            !filtersAreDefault && styles.filterButtonActive,
          ]}
        />
      </View>

      {allPayments.length > 0 && (
        <View style={[styles.summaryCard, pendingOnly && styles.summaryCardSingle]}>
          {pendingOnly ? (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={[styles.summaryAmount, styles.pendingAmount]}>{formatCurrency(totalPending)}</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Paid</Text>
                <Text style={[styles.summaryAmount, totalPaid > 0 ? styles.paidAmount : styles.zeroAmount]}>
                  {formatCurrency(totalPaid)}
                </Text>
              </View>
              <View style={styles.summarySep} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pending</Text>
                <Text style={[styles.summaryAmount, totalPending > 0 ? styles.pendingAmount : styles.zeroAmount]}>
                  {formatCurrency(totalPending)}
                </Text>
              </View>
            </>
          )}
        </View>
      )}

      <FlatList
        data={summaries}
        keyExtractor={(item) => String(item.managerId)}
        renderItem={renderItem}
        ListEmptyComponent={isLoading ? null : (
          <EmptyState
            icon="handCoins"
            title={pendingOnly ? 'No pending payments' : 'No payments yet'}
            subtitle={
              pendingOnly
                ? 'All manager payments are settled.'
                : 'Payments appear when sessions are marked completed.'
            }
          />
        )}
        contentContainerStyle={summaries.length === 0 && !isLoading ? styles.emptyContainer : styles.listContent}
      />

      <Modal
        visible={filtersVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltersVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.sheetRoot} onPress={() => setFiltersVisible(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom || Spacing.lg }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={filtersAreDefault}
                hitSlop={8}
                onPress={resetFilters}
                style={filtersAreDefault && styles.sheetResetDisabled}
              >
                <Text style={[styles.sheetResetText, { color: accentPalette.textAccent }]}>Reset</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sheetSection}>
              {renderSheetTitle('Payment status')}
              <View style={styles.sheetChipRow}>
                {renderFilterChip('Pending only', statusFilter === 'pending', () => setStatusFilter('pending'))}
                {renderFilterChip('All payments', statusFilter === 'all', () => setStatusFilter('all'))}
              </View>
            </View>

            <View style={styles.sheetSection}>
              {renderSheetTitle('Sort managers')}
              <View style={styles.sheetChipRow}>
                {renderFilterChip('Pending first', sortOrder === 'pending', () => setSortOrder('pending'))}
                {renderFilterChip('A-Z', sortOrder === 'az', () => setSortOrder('az'))}
                {renderFilterChip('Z-A', sortOrder === 'za', () => setSortOrder('za'))}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  filterSummary: { ...Typography.bodySm, color: Brand.textSecondary, flex: 1 },
  filterButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    backgroundColor: Brand.surfaceDark,
  },
  filterButtonActive: {
    borderWidth: 1.5,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Brand.surfaceElevated,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryCardSingle: { justifyContent: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { ...Typography.bodySm, fontWeight: '500', color: Brand.textSecondary, marginBottom: Spacing.xs },
  summaryAmount: { ...Typography.h2 },
  summarySep: { width: 1, backgroundColor: Brand.borderSubtle, marginVertical: 4 },
  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Layout.LIST_PAD_NO_FAB },
  emptyContainer: { flex: 1 },
  card: {
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  cardTitleBlock: { flex: 1 },
  managerName: { ...Typography.h4, color: Brand.textPrimary },
  sessionCount: { ...Typography.bodySm, color: Brand.textSecondary, marginTop: Spacing.xs },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  amountStatus: { alignItems: 'center', minWidth: 86 },
  amountLabel: { ...Typography.caption, color: Brand.textSecondary },
  cardAmount: { ...Typography.h4, fontWeight: '700' },
  paidAmount: { color: Brand.pink },
  pendingAmount: { color: Brand.orange },
  zeroAmount: { color: Brand.textMuted },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 5, 25, 0.65)',
  },
  sheet: {
    backgroundColor: Brand.surfaceElevated,
    borderTopLeftRadius: Radius.item,
    borderTopRightRadius: Radius.item,
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: Brand.borderSubtle,
    marginBottom: Spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.md,
  },
  sheetTitle: { ...Typography.h4, color: Brand.textPrimary, flex: 1 },
  sheetResetText: { ...Typography.labelSm },
  sheetResetDisabled: { opacity: 0.4 },
  sheetSection: { paddingBottom: Spacing.xl },
  sheetSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sheetSectionAccent: {
    width: 3,
    height: 14,
    borderRadius: Radius.xs,
  },
  sheetSectionTitle: {
    ...Typography.labelSm,
    color: Brand.textPrimary + 'CC',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sheetChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sheetChip: {
    minHeight: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    backgroundColor: Brand.surfaceDark,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetChipText: { ...Typography.labelSm, color: Brand.textSecondary },
  sheetChipTextSelected: { color: Brand.textPrimary },
});
