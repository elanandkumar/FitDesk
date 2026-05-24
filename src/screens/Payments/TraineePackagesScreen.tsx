import React, { useCallback, useState } from 'react';
import { Alert, SectionList, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, FAB, IconButton, Text } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
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
      map.set(p.trainee_id, {
        trainee: p.trainee_name,
        traineeId: p.trainee_id,
        pendingTotal: 0,
        data: [],
      });
    }
    const sec = map.get(p.trainee_id)!;
    sec.data.push(p);
    if (p.status === 'pending') sec.pendingTotal += p.amount;
  }
  return Array.from(map.values()).sort((a, b) =>
    b.pendingTotal !== a.pendingTotal
      ? b.pendingTotal - a.pendingTotal
      : a.trainee.localeCompare(b.trainee)
  );
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}


export default function TraineePackagesScreen() {
  const { theme } = useAppTheme();
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
      return () => {
        navigation.getParent()?.setOptions({ headerRight: undefined });
      };
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
    <View style={[styles.item, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.itemLeft}>
        <View>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {formatMonth(item.month)}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {item.used_sessions}/{item.total_sessions} sessions used
          </Text>
          {item.notes ? (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
              {item.notes}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
          {formatCurrency(item.amount)}
        </Text>
        {item.status === 'pending' ? (
          <Button
            compact
            mode="outlined"
            onPress={() => setConfirmPkg(item)}
            style={styles.markPaidBtn}
            labelStyle={{ fontSize: 11, marginHorizontal: 8, marginVertical: 4 }}
          >
            Mark Paid
          </Button>
        ) : (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Paid
          </Text>
        )}
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
      <Text variant="titleSmall" style={{ color: theme.colors.onBackground, fontWeight: '700' }}>
        {section.trainee}
      </Text>
      {section.pendingTotal > 0 && (
        <Chip compact mode="flat" style={{ backgroundColor: theme.colors.errorContainer }}>
          <Text style={{ color: theme.colors.onErrorContainer, fontSize: 12 }}>
            {formatCurrency(section.pendingTotal)} due
          </Text>
        </Chip>
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
        ItemSeparatorComponent={() => <Divider />}
        SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <EmptyState
            icon="package-variant"
            title="No packages yet"
            subtitle="Add a monthly session package for a trainee."
          />
        }
        contentContainerStyle={sections.length === 0 ? styles.emptyContainer : styles.listContent}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
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
  listContent: { paddingBottom: 88 },
  emptyContainer: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemLeft: { flex: 1 },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 8,
  },
  markPaidBtn: { borderRadius: 4 },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 4,
  },
});
