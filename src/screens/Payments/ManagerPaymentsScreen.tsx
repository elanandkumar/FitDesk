import React, { useCallback, useState } from 'react';
import { Alert, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Brand, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { EnrichedManagerPayment } from '../../types';
import {
  getAllEnrichedManagerPayments,
  markManagerPaymentPaid,
} from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDisplayDate, formatDisplayTime, todayISO } from '../../utils/dateUtils';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import { schedulePendingPaymentNotification } from '../../notifications/scheduler';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

type Section = {
  manager: string;
  managerId: number;
  pendingTotal: number;
  data: EnrichedManagerPayment[];
};

function groupByManager(payments: EnrichedManagerPayment[]): Section[] {
  const map = new Map<number, Section>();
  for (const p of payments) {
    if (!map.has(p.manager_id)) {
      map.set(p.manager_id, { manager: p.manager_name, managerId: p.manager_id, pendingTotal: 0, data: [] });
    }
    const sec = map.get(p.manager_id)!;
    sec.data.push(p);
    if (p.status === 'pending') sec.pendingTotal += p.amount;
  }
  return Array.from(map.values()).sort((a, b) =>
    b.pendingTotal !== a.pendingTotal ? b.pendingTotal - a.pendingTotal : a.manager.localeCompare(b.manager)
  );
}

export default function ManagerPaymentsScreen() {
  const { theme } = useAppTheme();
  const [sections, setSections] = useState<Section[]>([]);
  const [allPayments, setAllPayments] = useState<EnrichedManagerPayment[]>([]);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [confirmPayment, setConfirmPayment] = useState<EnrichedManagerPayment | null>(null);

  const load = useCallback(async () => {
    try {
      const payments = await getAllEnrichedManagerPayments(pendingOnly);
      setAllPayments(payments);
      setSections(groupByManager(payments));
    } catch {
      // list stays empty on DB error
    }
  }, [pendingOnly]);

  const totalPending = allPayments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalPaid = allPayments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleMarkPaid = async () => {
    if (!confirmPayment) return;
    try {
      await markManagerPaymentPaid(confirmPayment.id, todayISO());
      setConfirmPayment(null);
      load();
      if (!isExpoGo) schedulePendingPaymentNotification().catch(() => {});
    } catch {
      setConfirmPayment(null);
      Alert.alert('Error', 'Could not mark payment as paid. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: EnrichedManagerPayment }) => (
    <View style={styles.item}>
      <View style={[styles.dot, { backgroundColor: item.class_type_color }]} />
      <View style={styles.itemText}>
        <Text style={styles.itemTitle}>{item.series_title}</Text>
        <Text style={styles.itemSub}>
          {formatDisplayDate(item.session_date)} · {formatDisplayTime(item.class_time)}
        </Text>
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
        {item.status === 'pending' ? (
          <TouchableOpacity style={styles.markPaidBtn} onPress={() => setConfirmPayment(item)}>
            <Text style={styles.markPaidText}>Mark Paid</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.paidBadge}>
            <MaterialCommunityIcons name="check" size={11} color={Brand.pink} />
            <Text style={styles.paidText}>Paid</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.manager}</Text>
      {section.pendingTotal > 0 && (
        <View style={styles.dueBadge}>
          <Text style={styles.dueText}>{formatCurrency(section.pendingTotal)} due</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.filterRow}>
        <Chip
          selected={pendingOnly}
          onPress={() => setPendingOnly(true)}
          style={[styles.filterChip, pendingOnly && styles.filterChipActive]}
          textStyle={{ color: pendingOnly ? Brand.textPrimary : Brand.textSecondary }}
        >
          Pending
        </Chip>
        <Chip
          selected={!pendingOnly}
          onPress={() => setPendingOnly(false)}
          style={[styles.filterChip, !pendingOnly && styles.filterChipActive]}
          textStyle={{ color: !pendingOnly ? Brand.textPrimary : Brand.textSecondary }}
        >
          All
        </Chip>
      </View>

      {allPayments.length > 0 && (
        <View style={styles.summaryCard}>
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

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
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
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      <ConfirmDialog
        visible={confirmPayment !== null}
        title="Mark as Paid"
        message={
          confirmPayment
            ? `Mark ${formatCurrency(confirmPayment.amount)} for "${confirmPayment.series_title}" as paid?`
            : ''
        }
        confirmLabel="Mark Paid"
        destructive={false}
        onConfirm={handleMarkPaid}
        onDismiss={() => setConfirmPayment(null)}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  filterChip: { backgroundColor: Brand.surfaceDark, borderColor: Brand.borderSubtle },
  filterChipActive: { backgroundColor: Brand.purple },
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
    shadowColor: Brand.purple,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Brand.textPrimary,
  },
  dueBadge: {
    backgroundColor: `${Brand.orange}33`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dueText: { ...Typography.labelSm, color: Brand.orange },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xs,
    gap: Spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: Radius.full, flexShrink: 0 },
  itemText: { flex: 1 },
  itemTitle: { ...Typography.body, fontWeight: '500', color: Brand.textPrimary },
  itemSub: { ...Typography.bodySm, color: Brand.textSecondary, marginTop: 0 },
  itemRight: { alignItems: 'flex-end', gap: Spacing.xs },
  amount: { ...Typography.h4, fontWeight: '700', color: Brand.orange },
  markPaidBtn: {
    backgroundColor: `${Brand.purple}33`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  markPaidText: { ...Typography.labelSm, color: Brand.purple },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: `${Brand.pink}1A`,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  paidText: { ...Typography.microLabel, color: Brand.pink },
});
