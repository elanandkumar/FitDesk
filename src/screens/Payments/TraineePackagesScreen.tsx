import React, { useCallback, useState } from 'react';
import { Alert, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import GradientFAB from '../../components/common/GradientFAB';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Brand, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { EnrichedTraineePackage } from '../../types';
import {
  getAllEnrichedTraineePackages,
  markPackagePaid,
} from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import { todayISO } from '../../utils/dateUtils';
import { RootStackParamList } from '../../navigation/types';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
type Nav = StackNavigationProp<RootStackParamList>;

type Section = {
  trainee: string;
  traineeId: number;
  pendingTotal: number;
  data: EnrichedTraineePackage[];
};

function groupByTrainee(packages: EnrichedTraineePackage[]): Section[] {
  const map = new Map<number, Section>();
  for (const p of packages) {
    if (!map.has(p.trainee_id)) {
      map.set(p.trainee_id, { trainee: p.trainee_name, traineeId: p.trainee_id, pendingTotal: 0, data: [] });
    }
    const sec = map.get(p.trainee_id)!;
    sec.data.push(p);
    if (p.status === 'pending') sec.pendingTotal += p.amount;
  }
  return Array.from(map.values()).sort((a, b) =>
    b.pendingTotal !== a.pendingTotal ? b.pendingTotal - a.pendingTotal : a.trainee.localeCompare(b.trainee)
  );
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

export default function TraineePackagesScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [sections, setSections] = useState<Section[]>([]);
  const [allPackages, setAllPackages] = useState<EnrichedTraineePackage[]>([]);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [confirmPkg, setConfirmPkg] = useState<EnrichedTraineePackage | null>(null);

  const load = useCallback(async () => {
    try {
      const pkgs = await getAllEnrichedTraineePackages(pendingOnly);
      setAllPackages(pkgs);
      setSections(groupByTrainee(pkgs));
    } catch {
      // list stays empty on DB error
    }
  }, [pendingOnly]);

  const totalPending = allPackages.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const totalPaid = allPackages.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleMarkPaid = async () => {
    if (!confirmPkg) return;
    try {
      await markPackagePaid(confirmPkg.id, todayISO());
      setConfirmPkg(null);
      load();
    } catch {
      setConfirmPkg(null);
      Alert.alert('Error', 'Could not mark package as paid. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: EnrichedTraineePackage }) => (
    <View style={styles.item}>
      <View style={styles.itemLeft}>
        <Text style={styles.itemTitle}>{formatMonth(item.month)}</Text>
        <Text style={styles.itemSub}>{item.used_sessions}/{item.total_sessions} sessions used</Text>
        {item.notes ? (
          <Text style={styles.itemNote} numberOfLines={1}>{item.notes}</Text>
        ) : null}
      </View>
      <View style={styles.itemRight}>
        <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
        {item.status === 'pending' ? (
          <TouchableOpacity style={styles.markPaidBtn} onPress={() => setConfirmPkg(item)}>
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
      <Text style={styles.sectionTitle}>{section.trainee}</Text>
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

      {allPackages.length > 0 && (
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
            icon="package-variant"
            title={pendingOnly ? 'No pending packages' : 'No packages yet'}
            subtitle={
              pendingOnly
                ? 'All trainee packages are settled.'
                : 'Add a monthly session package for a trainee.'
            }
          />
        }
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      <GradientFAB
        icon="plus"
        style={[styles.fab, { bottom: Layout.FAB_BOTTOM + insets.bottom }]}
        onPress={() => navigation.navigate('AddPackage', {})}
      />

      <ConfirmDialog
        visible={confirmPkg !== null}
        title="Mark as Paid"
        message={
          confirmPkg
            ? `Mark ${formatCurrency(confirmPkg.amount)} package for ${confirmPkg.trainee_name} (${formatMonth(confirmPkg.month)}) as paid?`
            : ''
        }
        confirmLabel="Mark Paid"
        destructive={false}
        onConfirm={handleMarkPaid}
        onDismiss={() => setConfirmPkg(null)}
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
  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Layout.LIST_PAD_WITH_FAB },
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
    justifyContent: 'space-between',
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xs,
  },
  itemLeft: { flex: 1 },
  itemTitle: { ...Typography.body, fontWeight: '500', color: Brand.textPrimary },
  itemSub: { ...Typography.bodySm, color: Brand.textSecondary, marginTop: 0 },
  itemNote: { ...Typography.bodySm, color: Brand.textMuted, marginTop: 0 },
  itemRight: { alignItems: 'flex-end', gap: Spacing.xs, marginLeft: Spacing.sm },
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
    paddingVertical: 3, // micro: below xs(4) — badge pill tight fit
  },
  paidText: { ...Typography.microLabel, color: Brand.pink },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
