import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Chip, Divider, IconButton, Text } from 'react-native-paper';
import GradientFAB from '../../components/common/GradientFAB';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Brand } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { Manager, EnrichedManagerPayment } from '../../types';
import { getManagerById, deleteManager } from '../../database/repositories/managerRepository';
import {
  getManagerOutstandingBalance,
  getEnrichedManagerPaymentsByManager,
} from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import HelpSheet from '../../components/common/HelpSheet';

const HELP =
  'Shows payment history per class. Mark individual sessions paid after receiving payment from this manager.';

type Nav = StackNavigationProp<RootStackParamList, 'ManagerDetail'>;
type Route = RouteProp<RootStackParamList, 'ManagerDetail'>;

export default function ManagerDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { managerId } = route.params;

  const [manager, setManager] = useState<Manager | null>(null);
  const [outstanding, setOutstanding] = useState(0);
  const [payments, setPayments] = useState<EnrichedManagerPayment[]>([]);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, bal, pmts] = await Promise.all([
        getManagerById(managerId),
        getManagerOutstandingBalance(managerId),
        getEnrichedManagerPaymentsByManager(managerId),
      ]);
      setManager(m);
      setOutstanding(bal);
      setPayments(pmts);
    } catch {
      // screen shows nothing on DB error
    }
  }, [managerId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (manager) {
      navigation.setOptions({
        title: manager.name,
        headerRight: () => (
          <IconButton icon="help-circle-outline" iconColor={Brand.purple} onPress={() => setHelpVisible(true)} />
        ),
      });
    }
  }, [manager, managerId, navigation]);

  async function handleDelete() {
    try {
      await deleteManager(managerId);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not delete manager. Please try again.');
    }
  }

  if (!manager) return null;

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const paidPayments = payments.filter((p) => p.status === 'paid');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Contact */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>Contact</Text>
        </View>
        <View style={styles.card}>
          {manager.phone ? <InfoRow label="Phone" value={manager.phone} /> : null}
          {manager.email ? <InfoRow label="Email" value={manager.email} /> : null}
          {!manager.phone && !manager.email && (
            <Text variant="bodyMedium" style={{ color: Brand.textMuted }}>No contact info</Text>
          )}
        </View>

        {/* Payment Summary */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>Payment</Text>
        </View>
        <View style={styles.card}>
          <InfoRow label="Per class rate" value={formatCurrency(manager.per_class_rate)} />
          <View style={styles.balanceRow}>
            <Text variant="bodyMedium" style={{ color: Brand.textSecondary }}>Outstanding balance</Text>
            <Chip
              style={{
                backgroundColor: outstanding > 0 ? Brand.pink + '22' : Brand.surfaceElevated,
              }}
              textStyle={{
                color: outstanding > 0 ? Brand.pink : Brand.orange,
                fontFamily: 'Poppins_700Bold',
                fontSize: 13,
              }}
            >
              {formatCurrency(outstanding)}
            </Chip>
          </View>
        </View>

        {/* Payment History */}
        {payments.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionLabel}>Payment History ({payments.length})</Text>
            </View>
            <View style={styles.card}>
              {pendingPayments.length > 0 && (
                <>
                  <Text style={styles.subLabel}>PENDING ({pendingPayments.length})</Text>
                  {pendingPayments.map((p, i) => (
                    <PaymentRow key={p.id} payment={p} showDivider={i > 0} />
                  ))}
                </>
              )}
              {pendingPayments.length > 0 && paidPayments.length > 0 && (
                <Divider style={{ backgroundColor: Brand.borderSubtle, marginVertical: 8 }} />
              )}
              {paidPayments.length > 0 && (
                <>
                  <Text style={[styles.subLabel, { color: Brand.textMuted }]}>
                    PAID ({paidPayments.length})
                  </Text>
                  {paidPayments.slice(0, 8).map((p, i) => (
                    <PaymentRow key={p.id} payment={p} showDivider={i > 0} />
                  ))}
                  {paidPayments.length > 8 && (
                    <Text variant="bodySmall" style={{ color: Brand.textMuted, marginTop: 8, textAlign: 'center' }}>
                      + {paidPayments.length - 8} more paid
                    </Text>
                  )}
                </>
              )}
            </View>
          </>
        )}

        {/* Notes */}
        {manager.notes ? (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionLabel}>Notes</Text>
            </View>
            <View style={styles.card}>
              <Text variant="bodyMedium" style={{ color: Brand.textSecondary }}>
                {manager.notes}
              </Text>
            </View>
          </>
        ) : null}

        <Button
          mode="outlined"
          onPress={() => setDeleteVisible(true)}
          textColor={Brand.pink}
          style={{ borderColor: Brand.pink, marginTop: 8 }}
        >
          Delete Manager
        </Button>

        <ConfirmDialog
          visible={deleteVisible}
          title="Delete Manager"
          message={`Delete "${manager.name}"? Their class history and payments will also be removed.`}
          onConfirm={handleDelete}
          onDismiss={() => setDeleteVisible(false)}
        />

        <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP} />
      </ScrollView>

      <GradientFAB
        icon="pencil"
        style={[styles.fab, { bottom: 16 + insets.bottom }]}
        onPress={() => navigation.navigate('AddEditManager', { managerId })}
      />
    </View>
  );
}

function PaymentRow({
  payment,
  showDivider,
}: {
  payment: EnrichedManagerPayment;
  showDivider: boolean;
}) {
  return (
    <>
      {showDivider && <Divider style={{ backgroundColor: Brand.borderSubtle, marginVertical: 4 }} />}
      <View style={styles.paymentRow}>
        <View style={[styles.colorDot, { backgroundColor: payment.class_type_color }]} />
        <View style={{ flex: 1, gap: 1 }}>
          <Text variant="bodySmall" style={{ color: Brand.textPrimary }}>
            {payment.series_title}
          </Text>
          <Text variant="bodySmall" style={{ color: Brand.textSecondary }}>
            {formatDisplayDate(payment.session_date)} · {formatDisplayTime(payment.class_time)}
          </Text>
          {payment.status === 'paid' && payment.paid_date && (
            <Text variant="bodySmall" style={{ color: Brand.textMuted }}>
              Paid {formatDisplayDate(payment.paid_date)}
            </Text>
          )}
        </View>
        <Text
          variant="bodySmall"
          style={{
            color: payment.status === 'pending' ? Brand.pink : Brand.orange,
            fontWeight: '600',
          }}
        >
          {formatCurrency(payment.amount)}
        </Text>
      </View>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="bodySmall" style={{ color: Brand.textSecondary }}>{label}</Text>
      <Text variant="bodyMedium" style={{ color: Brand.textPrimary }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  content: { padding: 16, gap: 4, paddingBottom: 80 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 16,
  },
  sectionAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: Brand.orange },
  sectionLabel: {
    color: Brand.textSecondary,
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  subLabel: {
    color: Brand.pink,
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  card: {
    backgroundColor: Brand.surfaceDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    elevation: 4,
    shadowColor: Brand.purple,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    padding: 14,
    gap: 4,
  },
  infoRow: { gap: 2, marginBottom: 6 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  colorDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  fab: {
    position: 'absolute',
    right: 16,
  },
});
