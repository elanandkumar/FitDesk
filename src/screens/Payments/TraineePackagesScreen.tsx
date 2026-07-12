import React, { useCallback, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import GradientFAB from '../../components/common/GradientFAB';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { Brand, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { EnrichedTraineePackage } from '../../types';
import {
  deleteUnusedPendingTraineePackage,
  getAllEnrichedTraineePackages,
  markPackagePaid,
  updateUnusedPendingTraineePackage,
} from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import { todayISO } from '../../utils/dateUtils';
import { RootStackParamList } from '../../navigation/types';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import AppIcon from '../../components/common/AppIcon';
import AppIconButton from '../../components/common/AppIconButton';
import AppModal from '../../components/common/AppModal';
type Nav = StackNavigationProp<RootStackParamList>;

type PackageStatusFilter = 'pending' | 'all';
type MonthSortOrder = 'latest' | 'oldest';

type Section = {
  trainee: string;
  traineeId: number;
  paidTotal: number;
  pendingTotal: number;
  data: EnrichedTraineePackage[];
};

function groupByTrainee(packages: EnrichedTraineePackage[], monthSort: MonthSortOrder): Section[] {
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
  return Array.from(map.values())
    .map((section) => ({
      ...section,
      data: [...section.data].sort((a, b) =>
        monthSort === 'latest' ? b.month.localeCompare(a.month) : a.month.localeCompare(b.month)
      ),
    }))
    .sort((a, b) =>
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
  const [statusFilter, setStatusFilter] = useState<PackageStatusFilter>('pending');
  const [monthSort, setMonthSort] = useState<MonthSortOrder>('latest');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [confirmPkg, setConfirmPkg] = useState<EnrichedTraineePackage | null>(null);
  const [deletePkg, setDeletePkg] = useState<EnrichedTraineePackage | null>(null);
  const [editPkg, setEditPkg] = useState<EnrichedTraineePackage | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editError, setEditError] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const pendingOnly = statusFilter === 'pending';
  const filtersAreDefault = statusFilter === 'pending' && monthSort === 'latest';

  const resetFilters = () => {
    setStatusFilter('pending');
    setMonthSort('latest');
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const pkgs = await getAllEnrichedTraineePackages(pendingOnly);
      setAllPackages(pkgs);
      setSections(groupByTrainee(pkgs, monthSort));
    } catch {
      // list stays empty on DB error
    } finally {
      setIsLoading(false);
    }
  }, [monthSort, pendingOnly]);

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
      setErrorMessage('Could not mark package as paid. Please try again.');
    }
  };

  const openEditPackage = (pkg: EnrichedTraineePackage) => {
    setEditPkg(pkg);
    setEditAmount(String(pkg.amount));
    setEditNotes(pkg.notes ?? '');
    setEditError('');
  };

  const handleSaveEdit = async () => {
    if (!editPkg) return;
    const parsedAmount = parseFloat(editAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setEditError('Enter a valid amount.');
      return;
    }

    try {
      await updateUnusedPendingTraineePackage(
        editPkg.id,
        parsedAmount,
        editNotes.trim() || undefined
      );
      setEditPkg(null);
      setEditError('');
      load();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'Could not update package.');
    }
  };

  const handleDeletePackage = async () => {
    if (!deletePkg) return;
    try {
      await deleteUnusedPendingTraineePackage(deletePkg.id);
      setDeletePkg(null);
      load();
    } catch (err) {
      setDeletePkg(null);
      setErrorMessage(err instanceof Error ? err.message : 'Could not delete package.');
    }
  };

  const renderPackage = (item: EnrichedTraineePackage, index: number) => {
    const canEditOrDelete = item.status === 'pending' && item.used_sessions === 0;

    return (
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
                <View style={styles.packageStatusColumn}>
                  <Text style={styles.amountLabel}>Paid</Text>
                  <Text style={[styles.amount, styles.zeroAmount]}>
                    {formatCurrency(0)}
                  </Text>
                </View>
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
                <View style={styles.packageStatusColumn}>
                  <Text style={styles.amountLabel}>Pending</Text>
                  <Text style={[styles.amount, styles.zeroAmount]}>
                    {formatCurrency(0)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
        {item.status === 'pending' ? (
        <View style={styles.packageActionRow}>
          {canEditOrDelete ? (
            <>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Edit ${item.trainee_name} package`}
                activeOpacity={0.72}
                hitSlop={6}
                style={[styles.packageUtilityBtn, { borderColor: Brand.borderSubtle }]}
                onPress={() => openEditPackage(item)}
              >
                <AppIcon name="pencil" size={14} color={Brand.textSecondary} weight="bold" />
                <Text style={styles.packageUtilityText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Delete ${item.trainee_name} package`}
                activeOpacity={0.72}
                hitSlop={6}
                style={[styles.packageUtilityBtn, styles.packageDeleteBtn]}
                onPress={() => setDeletePkg(item)}
              >
                <AppIcon name="trash" size={14} color="#FF5252" weight="bold" />
                <Text style={styles.packageDeleteText}>Delete</Text>
              </TouchableOpacity>
            </>
          ) : null}
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
  };

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
      <View style={styles.packageList}>
        {item.data.map(renderPackage)}
      </View>
    </View>
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.filterRow}>
        <Text style={styles.filterSummary}>
          {pendingOnly ? 'Pending only' : 'All payments'} · {monthSort === 'latest' ? 'Latest first' : 'Oldest first'}
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

      {allPackages.length > 0 && (
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
        data={sections}
        keyExtractor={(item) => String(item.traineeId)}
        renderItem={renderItem}
        ListEmptyComponent={isLoading ? null : (
          <EmptyState
            icon="package"
            title={pendingOnly ? 'No pending packages' : 'No packages yet'}
            subtitle={
              pendingOnly
                ? 'All trainee packages are settled.'
                : 'Add a monthly session package for a trainee.'
            }
          />
        )}
        contentContainerStyle={sections.length === 0 && !isLoading ? styles.emptyContainer : styles.listContent}
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

      <ConfirmDialog
        visible={deletePkg !== null}
        title="Delete Package"
        message={
          deletePkg
            ? `Delete the unused ${formatMonth(deletePkg.month)} package for ${deletePkg.trainee_name}? Linked scheduled sessions will also be removed when available.`
            : ''
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeletePackage}
        onDismiss={() => setDeletePkg(null)}
      />

      <AppModal
        visible={editPkg !== null}
        onDismiss={() => setEditPkg(null)}
        title="Edit Package"
        confirmLabel="Save"
        onConfirm={handleSaveEdit}
        cancelLabel="Cancel"
      >
        <Text variant="bodySmall" style={styles.editHelpText}>
          Session count and month stay locked because this package is tied to scheduled sessions.
        </Text>
        <TextInput
          label="Amount (₹)"
          value={editAmount}
          onChangeText={(v) => setEditAmount(v.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          mode="outlined"
          dense
        />
        <View style={styles.editFieldGap} />
        <TextInput
          label="Notes (optional)"
          value={editNotes}
          onChangeText={setEditNotes}
          mode="outlined"
          multiline
          numberOfLines={3}
        />
        {editError ? <Text style={styles.editErrorText}>{editError}</Text> : null}
      </AppModal>

      <AppModal
        visible={errorMessage.length > 0}
        onDismiss={() => setErrorMessage('')}
        title="Package Error"
        cancelLabel="OK"
      >
        <Text variant="bodyMedium" style={{ color: Brand.textSecondary }}>
          {errorMessage}
        </Text>
      </AppModal>

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
              {renderSheetTitle('Sort month')}
              <View style={styles.sheetChipRow}>
                {renderFilterChip('Latest first', monthSort === 'latest', () => setMonthSort('latest'))}
                {renderFilterChip('Oldest first', monthSort === 'oldest', () => setMonthSort('oldest'))}
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
  packageActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
    flexWrap: 'wrap',
  },
  amount: { ...Typography.h4, fontWeight: '700' },
  paidAmount: { color: Brand.pink },
  pendingAmount: { color: Brand.orange },
  zeroAmount: { color: Brand.textMuted },
  packageUtilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  packageUtilityText: { ...Typography.labelSm, color: Brand.textSecondary },
  packageDeleteBtn: { borderColor: '#FF5252' },
  packageDeleteText: { ...Typography.labelSm, color: '#FF5252' },
  markPaidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    height: 36,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md,
  },
  markPaidText: { ...Typography.labelSm },
  editHelpText: {
    color: Brand.textSecondary,
    marginBottom: Spacing.md,
  },
  editFieldGap: { height: Spacing.sm },
  editErrorText: {
    ...Typography.bodySm,
    color: Brand.pink,
    marginTop: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
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
