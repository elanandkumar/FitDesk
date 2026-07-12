import React, { useCallback, useLayoutEffect, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { Brand, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { EnrichedManagerPayment } from '../../types';
import {
  getEnrichedManagerPaymentsByManager,
  markManagerPaymentPaid,
} from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDisplayDate, formatDisplayTime, todayISO } from '../../utils/dateUtils';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EmptyState from '../../components/common/EmptyState';
import InfoDialog from '../../components/common/InfoDialog';
import { schedulePendingPaymentNotification } from '../../notifications/scheduler';
import Constants from 'expo-constants';
import { RootStackParamList } from '../../navigation/types';
import AppIcon from '../../components/common/AppIcon';

const isExpoGo = Constants.appOwnership === 'expo';

type Nav = StackNavigationProp<RootStackParamList, 'ManagerPaymentDetail'>;
type Route = RouteProp<RootStackParamList, 'ManagerPaymentDetail'>;

export default function ManagerPaymentDetailScreen() {
  const { accentPalette, theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { managerId, managerName } = route.params;

  const [payments, setPayments] = useState<EnrichedManagerPayment[]>([]);
  const [confirmPayment, setConfirmPayment] = useState<EnrichedManagerPayment | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const pendingTotal = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const paidTotal = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const sessionCount = payments.length;

  useLayoutEffect(() => {
    navigation.setOptions({ title: managerName });
  }, [navigation, managerName]);

  const load = useCallback(async () => {
    try {
      const data = await getEnrichedManagerPaymentsByManager(managerId);
      setPayments(data);
    } catch {
      // list stays empty on DB error
    }
  }, [managerId]);

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
      setErrorMessage('Could not mark payment as paid. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: EnrichedManagerPayment }) => (
    <View style={styles.item}>
      <View style={styles.itemMainRow}>
        <View style={[styles.dot, { backgroundColor: item.class_type_color }]} />
        <View style={styles.itemText}>
          <Text style={styles.itemTitle}>{item.series_title}</Text>
          <Text style={styles.itemSub}>
            {formatDisplayDate(item.session_date)} · {formatDisplayTime(item.class_time)}
          </Text>
        </View>
        <View style={styles.itemStatus}>
          <Text style={styles.amountLabel}>{item.status === 'paid' ? 'Paid' : 'Pending'}</Text>
          <Text style={[styles.amount, item.status === 'paid' ? styles.paidAmount : styles.pendingAmount]}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>
      {item.status === 'pending' ? (
        <View style={styles.itemActionRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Mark ${formatCurrency(item.amount)} as paid`}
            activeOpacity={0.72}
            hitSlop={6}
            style={[styles.markPaidBtn, { borderColor: accentPalette.main }]}
            onPress={() => setConfirmPayment(item)}
          >
            <AppIcon name="check" size={14} color={accentPalette.main} weight="bold" />
            <Text style={[styles.markPaidText, { color: accentPalette.main }]}>Mark Paid</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {payments.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryCountItem}>
            <Text style={styles.summaryLabel}>Sessions</Text>
            <Text style={styles.summaryValue}>{sessionCount}</Text>
          </View>
          <View style={styles.summarySep} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={[styles.summaryValue, styles.paidAmount]}>
              {formatCurrency(paidTotal)}
            </Text>
          </View>
          <View style={styles.summarySep} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, styles.pendingAmount]}>
              {formatCurrency(pendingTotal)}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="handCoins"
            title="No payments"
            subtitle="No payments found for this manager."
          />
        }
        contentContainerStyle={payments.length === 0 ? styles.emptyContainer : styles.listContent}
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

      <InfoDialog
        visible={errorMessage.length > 0}
        title="Error"
        message={errorMessage}
        onDismiss={() => setErrorMessage('')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: Brand.surfaceElevated,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCountItem: { flex: 0.75, alignItems: 'center' },
  summaryLabel: { ...Typography.bodySm, fontWeight: '500', color: Brand.textSecondary, marginBottom: Spacing.xs },
  summaryValue: { ...Typography.h3, color: Brand.textPrimary },
  summarySep: { width: 1, backgroundColor: Brand.borderSubtle, marginVertical: 2 },
  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Layout.LIST_PAD_NO_FAB },
  emptyContainer: { flex: 1 },
  item: {
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.xs,
  },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: { width: 10, height: 10, borderRadius: Radius.full, flexShrink: 0 },
  itemText: { flex: 1 },
  itemTitle: { ...Typography.body, fontWeight: '500', color: Brand.textPrimary },
  itemSub: { ...Typography.bodySm, color: Brand.textSecondary, marginTop: 0 },
  itemStatus: { alignItems: 'center', minWidth: 86 },
  amountLabel: { ...Typography.caption, color: Brand.textSecondary },
  amount: { ...Typography.h4, fontWeight: '700' },
  paidAmount: { color: Brand.pink },
  pendingAmount: { color: Brand.orange },
  itemActionRow: { alignItems: 'flex-end', marginTop: Spacing.xs },
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
});
