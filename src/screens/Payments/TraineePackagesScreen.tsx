import React, { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import GradientFAB from '../../components/common/GradientFAB';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
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
import AppIcon from '../../components/common/AppIcon';
type Nav = StackNavigationProp<RootStackParamList>;

type Section = {
  trainee: string;
  traineeId: number;
  paidTotal: number;
  pendingTotal: number;
  data: EnrichedTraineePackage[];
};

function groupByTrainee(packages: EnrichedTraineePackage[]): Section[] {
  const map = new Map<number, Section>();
  for (const p of packages) {
    if (!map.has(p.trainee_id)) {
      map.set(p.trainee_id, {
        trainee: p.trainee_name,
        traineeId: p.trainee_id,
        paidTotal: 0,
        pendingTotal: 0,
        data: [],
      });
    }
    const sec = map.get(p.trainee_id)!;
    sec.data.push(p);
    if (p.status === 'pending') sec.pendingTotal += p.amount;
    else sec.paidTotal += p.amount;
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
  const { accentPalette, theme } = useAppTheme();
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

  const renderPackage = (item: EnrichedTraineePackage, index: number) => (
    <View
      key={item.id}
      style={[
        styles.packageRow,
        index > 0 && styles.packageRowDivider,
      ]}
    >
      <View style={styles.packageMainRow}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemTitle}>{formatMonth(item.month)}</Text>
          <Text style={styles.itemSub}>{item.used_sessions}/{item.total_sessions} sessions used</Text>
          {item.notes ? (
            <Text style={styles.itemNote} numberOfLines={1}>{item.notes}</Text>
          ) : null}
        </View>
        <View style={styles.packageAmountRow}>
          {item.status === 'pending' ? (
            <>
              <View style={styles.packageStatusColumn} />
              <View style={styles.packageStatusColumn}>
                <Text style={styles.amountLabel}>Pending</Text>
                <Text style={[styles.amount, styles.pendingAmount]}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.packageStatusColumn}>
                <Text style={styles.amountLabel}>Paid</Text>
                <Text style={[styles.amount, styles.paidAmount]}>
                  {formatCurrency(item.amount)}
                </Text>
              </View>
              <View style={styles.packageStatusColumn} />
            </>
          )}
        </View>
      </View>
      {item.status === 'pending' ? (
        <View style={styles.packageActionRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Mark ${formatCurrency(item.amount)} as paid`}
            activeOpacity={0.72}
            hitSlop={6}
            style={[styles.markPaidBtn, { borderColor: accentPalette.main }]}
            onPress={() => setConfirmPkg(item)}
          >
            <AppIcon name="check" size={14} color={accentPalette.main} weight="bold" />
            <Text style={[styles.markPaidText, { color: accentPalette.main }]}>Mark Paid</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  const renderItem = ({ item }: { item: Section }) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.traineeName}>{item.trainee}</Text>
          <Text style={styles.packageCount}>
            {item.data.length} package{item.data.length !== 1 ? 's' : ''}
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
      <View style={styles.packageList}>
        {item.data.map(renderPackage)}
      </View>
    </View>
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

      {allPackages.length > 0 && (
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
        data={sections}
        keyExtractor={(item) => String(item.traineeId)}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="package"
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
  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Layout.LIST_PAD_WITH_FAB },
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
  traineeName: { ...Typography.h4, color: Brand.textPrimary },
  packageCount: { ...Typography.bodySm, color: Brand.textSecondary, marginTop: Spacing.xs },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  amountStatus: { alignItems: 'center', minWidth: 86 },
  amountLabel: { ...Typography.caption, color: Brand.textSecondary },
  cardAmount: { ...Typography.h4, fontWeight: '700' },
  packageList: {
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
    marginTop: Spacing.md,
    paddingTop: Spacing.xs,
  },
  packageRow: {
    paddingVertical: Spacing.sm,
  },
  packageMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packageRowDivider: { borderTopWidth: 1, borderTopColor: Brand.borderSubtle },
  itemLeft: { flex: 1 },
  itemTitle: { ...Typography.body, fontWeight: '500', color: Brand.textPrimary },
  itemSub: { ...Typography.bodySm, color: Brand.textSecondary, marginTop: 0 },
  itemNote: { ...Typography.bodySm, color: Brand.textMuted, marginTop: 0 },
  packageAmountRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  packageStatusColumn: { alignItems: 'center', gap: Spacing.xs, minWidth: 86 },
  packageActionRow: { alignItems: 'flex-end', marginTop: Spacing.xs },
  amount: { ...Typography.h4, fontWeight: '700' },
  paidAmount: { color: Brand.pink },
  pendingAmount: { color: Brand.orange },
  markPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 34,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  markPaidText: { ...Typography.labelSm },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
