import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { schedulePendingPaymentNotification } from '../../notifications/scheduler';
import Constants from 'expo-constants';
import { RootStackParamList } from '../../navigation/types';

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

  const pendingTotal = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
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
          <TouchableOpacity style={[styles.markPaidBtn, { backgroundColor: `${accentPalette.main}33` }]} onPress={() => setConfirmPayment(item)}>
            <Text style={[styles.markPaidText, { color: accentPalette.main }]}>Mark Paid</Text>
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

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {payments.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {sessionCount} session{sessionCount !== 1 ? 's' : ''}
          </Text>
          {pendingTotal > 0 && (
            <Text style={[styles.summaryText, { color: Brand.orange }]}>
              {formatCurrency(pendingTotal)} pending
            </Text>
          )}
        </View>
      )}

      <FlatList
        data={payments}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="cash-check"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Brand.borderSubtle,
  },
  summaryText: { ...Typography.bodySm, color: Brand.textSecondary },
  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Layout.LIST_PAD_NO_FAB },
  emptyContainer: { flex: 1 },
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
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  markPaidText: { ...Typography.labelSm },
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
});
