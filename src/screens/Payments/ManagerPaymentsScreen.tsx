import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Brand, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { EnrichedManagerPayment } from '../../types';
import { getAllEnrichedManagerPayments } from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import { RootStackParamList } from '../../navigation/types';
import EmptyState from '../../components/common/EmptyState';

type Nav = StackNavigationProp<RootStackParamList>;

type ManagerSummary = {
  managerId: number;
  managerName: string;
  sessionCount: number;
  paidTotal: number;
  pendingTotal: number;
};

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

export default function ManagerPaymentsScreen() {
  const { accentPalette, theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const [summaries, setSummaries] = useState<ManagerSummary[]>([]);
  const [allPayments, setAllPayments] = useState<EnrichedManagerPayment[]>([]);
  const [pendingOnly, setPendingOnly] = useState(true);

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
        <Text style={styles.managerName}>{item.managerName}</Text>
        <View style={styles.viewBtn}>
          <Text style={[styles.viewBtnText, { color: accentPalette.main }]}>View</Text>
          <MaterialCommunityIcons name="chevron-right" size={14} color={accentPalette.main} />
        </View>
      </View>
      <Text style={styles.sessionCount}>
        {item.sessionCount} session{item.sessionCount !== 1 ? 's' : ''}
      </Text>
      <View style={styles.amountRow}>
        {item.paidTotal > 0 && (
          <View style={styles.paidBadge}>
            <MaterialCommunityIcons name="check" size={11} color={Brand.pink} />
            <Text style={styles.paidText}>{formatCurrency(item.paidTotal)} paid</Text>
          </View>
        )}
        {item.pendingTotal > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>{formatCurrency(item.pendingTotal)} pending</Text>
          </View>
        )}
        {item.paidTotal > 0 && item.pendingTotal === 0 && (
          <View style={styles.allPaidBadge}>
            <MaterialCommunityIcons name="check-all" size={13} color={Brand.pink} />
            <Text style={styles.allPaidText}>All Paid</Text>
          </View>
        )}
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
          Pending
        </Chip>
        <Chip
          selected={!pendingOnly}
          onPress={() => setPendingOnly(false)}
          style={[styles.filterChip, !pendingOnly && { backgroundColor: accentPalette.main }]}
          textStyle={{ color: !pendingOnly ? Brand.textPrimary : Brand.textSecondary }}
        >
          All
        </Chip>
      </View>

      {allPayments.length > 0 && (
        <View style={[styles.summaryCard, { shadowColor: accentPalette.main }]}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryAmount, { color: Brand.orange }]}>{formatCurrency(totalPending)}</Text>
          </View>
          <View style={styles.summarySep} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={[styles.summaryAmount, { color: Brand.pink }]}>{formatCurrency(totalPaid)}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={summaries}
        keyExtractor={(item) => String(item.managerId)}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="cash-check"
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
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    elevation: 4,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  managerName: { ...Typography.h4, color: Brand.textPrimary, flex: 1 },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewBtnText: { ...Typography.labelSm },
  sessionCount: { ...Typography.bodySm, color: Brand.textSecondary, marginBottom: Spacing.sm },
  amountRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: `${Brand.pink}1A`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3, // micro: below xs(4) — badge pill tight fit
  },
  paidText: { ...Typography.microLabel, color: Brand.pink },
  pendingBadge: {
    backgroundColor: `${Brand.orange}22`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3, // micro: below xs(4) — badge pill tight fit
  },
  pendingText: { ...Typography.microLabel, color: Brand.orange },
  allPaidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: `${Brand.pink}1A`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3, // micro: below xs(4) — badge pill tight fit
  },
  allPaidText: { ...Typography.microLabel, color: Brand.pink },
});
