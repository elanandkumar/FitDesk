import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { AppThemeColors, BrandCore, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { EnrichedOrganizerPayment } from '../../types';
import {
  getEnrichedOrganizerPaymentsByOrganizer,
  markOrganizerPaymentPaid,
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
import AccentListCard from '../../components/common/AccentListCard';
import ColorDotLabel from '../../components/common/ColorDotLabel';

const isExpoGo = Constants.appOwnership === 'expo';

type Nav = StackNavigationProp<RootStackParamList, 'OrganizerPaymentDetail'>;
type Route = RouteProp<RootStackParamList, 'OrganizerPaymentDetail'>;

export default function OrganizerPaymentDetailScreen() {
  const { accentPalette, colors, theme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { organizerId, organizerName, pendingOnly, sortOrder } = route.params;

  const [payments, setPayments] = useState<EnrichedOrganizerPayment[]>([]);
  const [confirmPayment, setConfirmPayment] = useState<EnrichedOrganizerPayment | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const pendingTotal = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);
  const paidTotal = payments.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const sessionCount = payments.length;
  const sortedPayments = useMemo(() => {
    if (sortOrder === 'pending') return payments;

    const direction = sortOrder === 'az' ? 1 : -1;
    return [...payments].sort((a, b) => {
      const titleComparison = a.series_title.localeCompare(b.series_title);
      if (titleComparison !== 0) return titleComparison * direction;
      return b.session_date.localeCompare(a.session_date);
    });
  }, [payments, sortOrder]);
  const sortLabel = sortOrder === 'pending' ? 'Pending first' : sortOrder === 'az' ? 'A-Z' : 'Z-A';

  useLayoutEffect(() => {
    navigation.setOptions({ title: organizerName });
  }, [navigation, organizerName]);

  const load = useCallback(async () => {
    try {
      const data = await getEnrichedOrganizerPaymentsByOrganizer(organizerId, pendingOnly);
      setPayments(data);
    } catch {
      // list stays empty on DB error
    }
  }, [organizerId, pendingOnly]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleMarkPaid = async () => {
    if (!confirmPayment) return;
    try {
      await markOrganizerPaymentPaid(confirmPayment.id, todayISO());
      setConfirmPayment(null);
      load();
      if (!isExpoGo) schedulePendingPaymentNotification().catch(() => {});
    } catch {
      setConfirmPayment(null);
      setErrorMessage('Could not mark payment as paid. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: EnrichedOrganizerPayment }) => (
    <AccentListCard
      accentColor={item.class_type_color}
      showAccentRail={false}
      dense
      style={styles.item}
    >
      <View style={styles.itemContent}>
        <View style={styles.itemMainRow}>
          <View style={styles.itemText}>
            <ColorDotLabel color={item.class_type_color} label={item.series_title} style={styles.itemTitle} />
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
    </AccentListCard>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={styles.filterSummary}>
        {pendingOnly ? 'Pending only' : 'All payments'} · {sortLabel}
      </Text>

      {payments.length > 0 && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Sessions</Text>
            <Text style={styles.summaryValue}>{sessionCount}</Text>
          </View>
          <View style={styles.summarySep} />
          {!pendingOnly && (
            <>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Paid</Text>
                <Text style={[styles.summaryValue, styles.paidAmount]}>
                  {formatCurrency(paidTotal)}
                </Text>
              </View>
              <View style={styles.summarySep} />
            </>
          )}
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={[styles.summaryValue, styles.pendingAmount]}>
              {formatCurrency(pendingTotal)}
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={sortedPayments}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListEmptyComponent={
          <EmptyState
            icon="handCoins"
            title={pendingOnly ? 'No pending payments' : 'No payments'}
            subtitle={
              pendingOnly
                ? 'All payments for this organizer are settled.'
                : 'No payments found for this organizer.'
            }
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

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  filterSummary: {
    ...Typography.bodySm,
    color: colors.textSecondary,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  summaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceRaised,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  summaryItem: { alignItems: 'center', flexShrink: 1 },
  summaryLabel: { ...Typography.bodySm, fontWeight: '500', color: colors.textSecondary, marginBottom: Spacing.xs },
  summaryValue: { ...Typography.h3, color: colors.textPrimary },
  summarySep: { width: 1, backgroundColor: colors.border, marginVertical: 2 },
  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, paddingBottom: Layout.LIST_PAD_NO_FAB },
  emptyContainer: { flex: 1 },
  item: {
    marginBottom: Spacing.xs,
  },
  itemContent: { flex: 1 },
  itemMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  itemText: { flex: 1 },
  itemTitle: { ...Typography.body, fontWeight: '500', color: colors.textPrimary, flexShrink: 1 },
  itemSub: { ...Typography.bodySm, color: colors.textSecondary, marginTop: 0 },
  itemStatus: { alignItems: 'center', flexShrink: 0 },
  amountLabel: { ...Typography.caption, color: colors.textSecondary },
  amount: { ...Typography.h4, fontWeight: '700' },
  paidAmount: { color: BrandCore.pink },
  pendingAmount: { color: BrandCore.orange },
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
