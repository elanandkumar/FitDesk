import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { Brand, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { EnrichedManagerPayment } from '../../types';
import { getAllEnrichedManagerPayments } from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import { RootStackParamList } from '../../navigation/types';
import EmptyState from '../../components/common/EmptyState';
import AppIcon from '../../components/common/AppIcon';

type Nav = StackNavigationProp<RootStackParamList>;

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

function buildSummaries(payments: EnrichedManagerPayment[]): ManagerSummary[] {
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
  return Array.from(map.values()).sort((a, b) =>
    b.pendingTotal !== a.pendingTotal
      ? b.pendingTotal - a.pendingTotal
      : a.managerName.localeCompare(b.managerName)
  );
}

export default function ManagerPaymentsScreen({ initialPendingOnly, focusKey }: ManagerPaymentsScreenProps) {
  const { accentPalette, theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const [summaries, setSummaries] = useState<ManagerSummary[]>([]);
  const [allPayments, setAllPayments] = useState<EnrichedManagerPayment[]>([]);
  const [pendingOnly, setPendingOnly] = useState(true);

  useEffect(() => {
    if (initialPendingOnly !== undefined) {
      setPendingOnly(initialPendingOnly);
    }
  }, [focusKey, initialPendingOnly]);

  const load = useCallback(async () => {
    try {
      const payments = await getAllEnrichedManagerPayments(pendingOnly);
      setAllPayments(payments);
      setSummaries(buildSummaries(payments));
    } catch {
      // list stays empty on DB error
    }
  }, [pendingOnly]);

  const totalPending = allPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalPaid = allPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }: { item: ManagerSummary }) => (
    <TouchableOpacity
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
          {item.paidTotal > 0 && (
            <View style={styles.amountStatus}>
              <Text style={styles.amountLabel}>Paid</Text>
              <Text style={[styles.cardAmount, styles.paidAmount]}>{formatCurrency(item.paidTotal)}</Text>
            </View>
          )}
          {item.pendingTotal > 0 && (
            <View style={styles.amountStatus}>
              <Text style={styles.amountLabel}>Pending</Text>
              <Text style={[styles.cardAmount, styles.pendingAmount]}>{formatCurrency(item.pendingTotal)}</Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.cardActionRow}>
        <AppIcon name="caretRight" size={16} color={Brand.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.filterRow}>
        <Chip
          selected={pendingOnly}
          onPress={() => setPendingOnly(true)}
          style={[styles.filterChip, pendingOnly && { backgroundColor: accentPalette.main }]}
          textStyle={{ color: pendingOnly ? Brand.textPrimary : Brand.textSecondary }}
        >
          Pending only
        </Chip>
        <Chip
          selected={!pendingOnly}
          onPress={() => setPendingOnly(false)}
          style={[styles.filterChip, !pendingOnly && { backgroundColor: accentPalette.main }]}
          textStyle={{ color: !pendingOnly ? Brand.textPrimary : Brand.textSecondary }}
        >
          All payments
        </Chip>
      </View>

      {allPayments.length > 0 && (
        <View style={[styles.summaryCard, pendingOnly && styles.summaryCardSingle]}>
          {pendingOnly ? (
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pending</Text>
              <Text style={[styles.summaryAmount, { color: Brand.orange }]}>{formatCurrency(totalPending)}</Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Paid</Text>
                <Text style={[styles.summaryAmount, { color: Brand.pink }]}>{formatCurrency(totalPaid)}</Text>
              </View>
              <View style={styles.summarySep} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Pending</Text>
                <Text style={[styles.summaryAmount, { color: Brand.orange }]}>{formatCurrency(totalPending)}</Text>
              </View>
            </>
          )}
        </View>
      )}

      <FlatList
        data={summaries}
        keyExtractor={(item) => String(item.managerId)}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="handCoins"
            title={pendingOnly ? 'No pending payments' : 'No payments yet'}
            subtitle={
              pendingOnly
                ? 'All manager payments are settled.'
                : 'Payments appear when sessions are marked completed.'
            }
          />
        }
        contentContainerStyle={summaries.length === 0 ? styles.emptyContainer : styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  filterChip: { backgroundColor: Brand.surfaceDark, borderColor: Brand.borderSubtle },
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
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Layout.LIST_PAD_NO_FAB },
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
  cardActionRow: { alignItems: 'flex-end', marginTop: Spacing.md },
  paidAmount: { color: Brand.pink },
  pendingAmount: { color: Brand.orange },
});
