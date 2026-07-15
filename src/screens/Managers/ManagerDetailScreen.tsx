import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import SectionHeader from '../../components/common/SectionHeader';
import GradientFAB from '../../components/common/GradientFAB';
import AppButton from '../../components/common/AppButton';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { AppThemeColors, BrandCore, Radius, Spacing, Typography } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { Manager, EnrichedManagerPayment } from '../../types';
import {
  getManagerById,
  getUpcomingSessionCountForManager,
  softDeleteManager,
} from '../../database/repositories/managerRepository';
import {
  getManagerOutstandingBalance,
  getEnrichedManagerPaymentsByManager,
} from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import HelpSheet from '../../components/common/HelpSheet';
import AppIconButton from '../../components/common/AppIconButton';
import InfoDialog from '../../components/common/InfoDialog';
import { HELP } from '../../constants/helpContent';

type Nav = StackNavigationProp<RootStackParamList, 'ManagerDetail'>;
type Route = RouteProp<RootStackParamList, 'ManagerDetail'>;

export default function ManagerDetailScreen() {
  const { accentPalette, colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { managerId } = route.params;

  const [manager, setManager] = useState<Manager | null>(null);
  const [outstanding, setOutstanding] = useState(0);
  const [payments, setPayments] = useState<EnrichedManagerPayment[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, bal, pmts, cnt] = await Promise.all([
        getManagerById(managerId),
        getManagerOutstandingBalance(managerId),
        getEnrichedManagerPaymentsByManager(managerId),
        getUpcomingSessionCountForManager(managerId),
      ]);
      setManager(m);
      setOutstanding(bal);
      setPayments(pmts);
      setUpcomingCount(cnt);
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
          <AppIconButton icon="question" iconColor={accentPalette.textAccent} onPress={() => setHelpVisible(true)} />
        ),
      });
    }
  }, [accentPalette.textAccent, manager, navigation]);

  async function handleDelete() {
    try {
      await softDeleteManager(managerId);
      navigation.goBack();
    } catch {
      setErrorMessage('Could not remove manager. Please try again.');
    }
  }

  if (!manager) return null;

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const paidPayments = payments.filter((p) => p.status === 'paid');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Contact */}
        <SectionHeader label="Contact" />
        <View style={styles.card}>
          {manager.phone ? <InfoRow label="Phone" value={manager.phone} /> : null}
          {manager.email ? <InfoRow label="Email" value={manager.email} /> : null}
          {!manager.phone && !manager.email && (
            <Text variant="bodyMedium" style={{ color: colors.textMuted }}>No contact info</Text>
          )}
        </View>

        {/* Payment Summary */}
        <SectionHeader label="Payment" />
        <View style={styles.card}>
          <InfoRow label="Per class rate" value={formatCurrency(manager.per_class_rate)} />
          <View style={styles.balanceRow}>
            <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>Outstanding balance</Text>
            <Text
              variant="bodyMedium"
              style={[styles.balanceAmount, { color: outstanding > 0 ? BrandCore.orange : colors.textMuted }]}
            >
              {formatCurrency(outstanding)}
            </Text>
          </View>
        </View>

        {/* Payment History */}
        {payments.length > 0 && (
          <>
            <SectionHeader label={`Payment History (${payments.length})`} />
            <View style={styles.card}>
              {pendingPayments.length > 0 && (
                <>
                  <Text style={styles.pendingSubLabel}>PENDING ({pendingPayments.length})</Text>
                  {pendingPayments.map((p, i) => (
                    <PaymentRow key={p.id} payment={p} showDivider={i > 0} />
                  ))}
                </>
              )}
              {pendingPayments.length > 0 && paidPayments.length > 0 && (
                <Divider style={{ backgroundColor: colors.border, marginVertical: Spacing.sm }} />
              )}
              {paidPayments.length > 0 && (
                <>
                  <Text style={styles.paidSubLabel}>
                    PAID ({paidPayments.length})
                  </Text>
                  {paidPayments.slice(0, 8).map((p, i) => (
                    <PaymentRow key={p.id} payment={p} showDivider={i > 0} />
                  ))}
                  {paidPayments.length > 8 && (
                    <Text variant="bodySmall" style={{ color: colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' }}>
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
            <SectionHeader label="Notes" />
            <View style={styles.card}>
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                {manager.notes}
              </Text>
            </View>
          </>
        ) : null}

        <AppButton
          variant="danger"
          label="Remove Manager"
          onPress={() => setDeleteVisible(true)}
          style={{ marginTop: Spacing.sm }}
          fullWidth={false}
        />

        <ConfirmDialog
          visible={deleteVisible}
          title="Remove Manager"
          message={
            upcomingCount > 0
              ? `"${manager.name}" has ${upcomingCount} upcoming session${upcomingCount > 1 ? 's' : ''}. They will be archived but their history and payments will remain.`
              : `Archive "${manager.name}"? Their history and payments will remain.`
          }
          confirmLabel="Remove"
          onConfirm={handleDelete}
          onDismiss={() => setDeleteVisible(false)}
        />

        <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP.managerDetail} />

        <InfoDialog
          visible={errorMessage.length > 0}
          title="Error"
          message={errorMessage}
          onDismiss={() => setErrorMessage('')}
        />
      </ScrollView>

      <GradientFAB
        icon="pencil"
        style={[styles.fab, { bottom: Spacing.lg + insets.bottom }]}
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
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <>
      {showDivider && <Divider style={{ backgroundColor: colors.border, marginVertical: Spacing.xs }} />}
      <View style={styles.paymentRow}>
        <View style={[styles.colorDot, { backgroundColor: payment.class_type_color }]} />
        <View style={{ flex: 1, gap: 0 }}>
          <Text variant="bodySmall" style={{ color: colors.textPrimary }}>
            {payment.series_title}
          </Text>
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
            {formatDisplayDate(payment.session_date)} · {formatDisplayTime(payment.class_time)}
          </Text>
          {payment.status === 'paid' && payment.paid_date && (
            <Text variant="bodySmall" style={{ color: colors.textMuted }}>
              Paid {formatDisplayDate(payment.paid_date)}
            </Text>
          )}
        </View>
        <Text
          variant="bodySmall"
          style={{
            color: payment.status === 'pending' ? BrandCore.orange : BrandCore.pink,
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
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.infoRow}>
      <Text variant="bodySmall" style={{ color: colors.textSecondary }}>{label}</Text>
      <Text variant="bodyMedium" style={{ color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, gap: Spacing.xs, paddingBottom: 80 },
  pendingSubLabel: {
    ...Typography.microLabel,
    color: BrandCore.orange,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  paidSubLabel: {
    ...Typography.microLabel,
    color: BrandCore.pink,
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  infoRow: { gap: 0, marginBottom: Spacing.xs },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  balanceAmount: { ...Typography.h4, fontWeight: '700' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  colorDot: { width: 8, height: 8, borderRadius: Radius.full, marginTop: 2 },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
