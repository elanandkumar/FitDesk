import React, { useCallback, useState } from 'react';
import { Alert, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import GradientFAB from '../../components/common/GradientFAB';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Brand, Layout, Radius } from '../../theme/brandColors';
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
import HelpSheet from '../../components/common/HelpSheet';

type Nav = StackNavigationProp<RootStackParamList>;

const HELP =
  'Create a monthly package per trainee. Session count increments automatically when a personal session is marked complete. Mark the package paid after receiving payment.';

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
  const [confirmPkg, setConfirmPkg] = useState<EnrichedTraineePackage | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const pkgs = await getAllEnrichedTraineePackages();
      setSections(groupByTrainee(pkgs));
    } catch {
      // list stays empty on DB error
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
      navigation.getParent()?.setOptions({
        headerRight: () => (
          <IconButton icon="help-circle-outline" iconColor={theme.colors.primary} onPress={() => setHelpVisible(true)} />
        ),
      });
      return () => { navigation.getParent()?.setOptions({ headerRight: undefined }); };
    }, [load, navigation, theme.colors.primary])
  );

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
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="package-variant"
            title="No packages yet"
            subtitle="Add a monthly session package for a trainee."
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

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: Layout.LIST_PAD_WITH_FAB },
  emptyContainer: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingVertical: 10,
    marginTop: 8,
  },
  sectionTitle: {
    color: Brand.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Montserrat_600SemiBold',
  },
  dueBadge: {
    backgroundColor: `${Brand.orange}33`,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dueText: { color: Brand.orange, fontSize: 12, fontWeight: '700' },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6,
  },
  itemLeft: { flex: 1 },
  itemTitle: { color: Brand.textPrimary, fontSize: 14, fontWeight: '500' },
  itemSub: { color: Brand.textSecondary, fontSize: 12, marginTop: 2 },
  itemNote: { color: Brand.textMuted, fontSize: 12, marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 6, marginLeft: 8 },
  amount: { color: Brand.orange, fontSize: 15, fontWeight: '700' },
  markPaidBtn: {
    backgroundColor: `${Brand.purple}33`,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  markPaidText: { color: Brand.purple, fontSize: 12, fontWeight: '700' },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${Brand.pink}1A`,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  paidText: { color: Brand.pink, fontSize: 11, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 16,
  },
});
