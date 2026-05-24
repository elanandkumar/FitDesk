import React, { useCallback, useState } from 'react';
import { Alert, SectionList, StyleSheet, View } from 'react-native';
import { Chip, Divider, IconButton, Text } from 'react-native-paper';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme';
import { EnrichedManagerPayment } from '../../types';
import {
  getAllEnrichedManagerPayments,
  markManagerPaymentPaid,
} from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDisplayDate, formatDisplayTime, todayISO } from '../../utils/dateUtils';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import HelpSheet from '../../components/common/HelpSheet';

const HELP =
  'Payments are auto-created when sessions are marked complete. Tap "Mark Paid" after you receive payment from the manager. Mark each payment individually to verify.';

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
      map.set(p.manager_id, {
        manager: p.manager_name,
        managerId: p.manager_id,
        pendingTotal: 0,
        data: [],
      });
    }
    const sec = map.get(p.manager_id)!;
    sec.data.push(p);
    if (p.status === 'pending') sec.pendingTotal += p.amount;
  }
  return Array.from(map.values()).sort((a, b) =>
    b.pendingTotal !== a.pendingTotal
      ? b.pendingTotal - a.pendingTotal
      : a.manager.localeCompare(b.manager)
  );
}

export default function ManagerPaymentsScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const [sections, setSections] = useState<Section[]>([]);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [confirmPayment, setConfirmPayment] = useState<EnrichedManagerPayment | null>(null);
  const [helpVisible, setHelpVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const payments = await getAllEnrichedManagerPayments(pendingOnly);
      setSections(groupByManager(payments));
    } catch {
      // list stays empty on DB error
    }
  }, [pendingOnly]);

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
    if (!confirmPayment) return;
    try {
      await markManagerPaymentPaid(confirmPayment.id, todayISO());
      setConfirmPayment(null);
      load();
    } catch {
      setConfirmPayment(null);
      Alert.alert('Error', 'Could not mark payment as paid. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: EnrichedManagerPayment }) => (
    <View style={[styles.item, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.itemLeft}>
        <View style={[styles.dot, { backgroundColor: item.class_type_color }]} />
        <View style={styles.itemText}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {item.series_title}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatDisplayDate(item.session_date)} · {formatDisplayTime(item.class_time)}
          </Text>
        </View>
      </View>
      <View style={styles.itemRight}>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
          {formatCurrency(item.amount)}
        </Text>
        {item.status === 'pending' ? (
          <Chip
            compact
            mode="outlined"
            onPress={() => setConfirmPayment(item)}
            style={styles.chip}
            textStyle={{ fontSize: 11 }}
          >
            Mark Paid
          </Chip>
        ) : (
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Paid {item.paid_date ? formatDisplayDate(item.paid_date) : ''}
          </Text>
        )}
      </View>
    </View>
  );

  const renderSectionHeader = ({ section }: { section: Section }) => (
    <View style={[styles.sectionHeader, { backgroundColor: theme.colors.background }]}>
      <Text variant="titleSmall" style={{ color: theme.colors.onBackground, fontWeight: '700' }}>
        {section.manager}
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
      <View style={styles.filterRow}>
        <Chip
          selected={pendingOnly}
          onPress={() => setPendingOnly(true)}
          style={styles.filterChip}
        >
          Pending
        </Chip>
        <Chip
          selected={!pendingOnly}
          onPress={() => setPendingOnly(false)}
          style={styles.filterChip}
        >
          All
        </Chip>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ItemSeparatorComponent={() => <Divider />}
        SectionSeparatorComponent={() => <View style={{ height: 8 }} />}
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

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    paddingBottom: 4,
  },
  filterChip: { marginRight: 4 },
  listContent: { paddingBottom: 16 },
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
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  itemText: { flex: 1 },
  itemRight: {
    alignItems: 'flex-end',
    gap: 4,
    marginLeft: 8,
  },
  chip: { height: 28 },
});
