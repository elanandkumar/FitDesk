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
import { AppThemeColors, BrandCore, Elevation, Radius, Spacing, Typography } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { Organizer, EnrichedOrganizerPayment } from '../../types';
import {
  getOrganizerById,
  getUpcomingSessionCountForOrganizer,
  makeOrganizerRegular,
  softDeleteOrganizer,
} from '../../database/repositories/organizerRepository';
import {
  getOrganizerOutstandingBalance,
  getEnrichedOrganizerPaymentsByOrganizer,
} from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils';
import ColorDotLabel from '../../components/common/ColorDotLabel';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import HelpSheet from '../../components/common/HelpSheet';
import AppIconButton from '../../components/common/AppIconButton';
import InfoDialog from '../../components/common/InfoDialog';
import { HELP } from '../../constants/helpContent';

type Nav = StackNavigationProp<RootStackParamList, 'OrganizerDetail'>;
type Route = RouteProp<RootStackParamList, 'OrganizerDetail'>;

export default function OrganizerDetailScreen() {
  const { accentPalette, colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { organizerId } = route.params;

  const [organizer, setOrganizer] = useState<Organizer | null>(null);
  const [outstanding, setOutstanding] = useState(0);
  const [payments, setPayments] = useState<EnrichedOrganizerPayment[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [makeRegularVisible, setMakeRegularVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, bal, pmts, cnt] = await Promise.all([
        getOrganizerById(organizerId),
        getOrganizerOutstandingBalance(organizerId),
        getEnrichedOrganizerPaymentsByOrganizer(organizerId),
        getUpcomingSessionCountForOrganizer(organizerId),
      ]);
      setOrganizer(m);
      setOutstanding(bal);
      setPayments(pmts);
      setUpcomingCount(cnt);
    } catch {
      // screen shows nothing on DB error
    }
  }, [organizerId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (organizer) {
      navigation.setOptions({
        title: organizer.name,
        headerRight: () => (
          <AppIconButton icon="question" iconColor={accentPalette.textAccent} onPress={() => setHelpVisible(true)} />
        ),
      });
    }
  }, [accentPalette.textAccent, organizer, navigation]);

  async function handleDelete() {
    try {
      await softDeleteOrganizer(organizerId);
      navigation.goBack();
    } catch {
      setErrorMessage('Could not remove organizer. Please try again.');
    }
  }

  async function handleMakeRegular() {
    try {
      await makeOrganizerRegular(organizerId);
      setMakeRegularVisible(false);
      await load();
    } catch {
      setMakeRegularVisible(false);
      setErrorMessage('Could not make organizer regular. Please try again.');
    }
  }

  if (!organizer) return null;

  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const paidPayments = payments.filter((p) => p.status === 'paid');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Contact */}
        <SectionHeader label="Contact" />
        <View style={styles.card}>
          <InfoRow label="Type" value={organizer.contact_type === 'one_time' ? 'One-time' : 'Regular'} />
          {organizer.contact_person ? <InfoRow label="Contact person" value={organizer.contact_person} /> : null}
          {organizer.phone ? <InfoRow label="Phone" value={organizer.phone} /> : null}
          {organizer.email ? <InfoRow label="Email" value={organizer.email} /> : null}
          {!organizer.phone && !organizer.email && (
            <Text variant="bodyMedium" style={{ color: colors.textMuted }}>No contact info</Text>
          )}
        </View>

        {/* Payment Summary */}
        <SectionHeader label="Payment" />
        <View style={styles.card}>
          {organizer.contact_type === 'regular' ? (
            <View style={styles.paymentSummaryRow}>
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>Default session rate</Text>
              <Text variant="bodyMedium" style={{ color: colors.textPrimary }}>
                {formatCurrency(organizer.per_class_rate)}
              </Text>
            </View>
          ) : null}
          <View style={styles.paymentSummaryRow}>
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
        {organizer.notes ? (
          <>
            <SectionHeader label="Notes" />
            <View style={styles.card}>
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                {organizer.notes}
              </Text>
            </View>
          </>
        ) : null}

        {organizer.contact_type === 'one_time' && (
          <AppButton
            variant="secondary"
            label="Make Regular"
            onPress={() => setMakeRegularVisible(true)}
            style={{ marginTop: Spacing.sm }}
            fullWidth={false}
          />
        )}

        <AppButton
          variant="danger"
          label="Remove Organizer"
          onPress={() => setDeleteVisible(true)}
          style={{ marginTop: Spacing.sm }}
          fullWidth={false}
        />

        <ConfirmDialog
          visible={makeRegularVisible}
          title="Make Organizer Regular?"
          message={`Convert "${organizer.name}" to a Regular organizer? Existing sessions and payments will remain unchanged.`}
          confirmLabel="Make Regular"
          destructive={false}
          onConfirm={handleMakeRegular}
          onDismiss={() => setMakeRegularVisible(false)}
        />

        <ConfirmDialog
          visible={deleteVisible}
          title="Remove Organizer"
          message={
            upcomingCount > 0
              ? `"${organizer.name}" has ${upcomingCount} upcoming session${upcomingCount > 1 ? 's' : ''}. They will be archived but their history and payments will remain.`
              : `Archive "${organizer.name}"? Their history and payments will remain.`
          }
          confirmLabel="Remove"
          onConfirm={handleDelete}
          onDismiss={() => setDeleteVisible(false)}
        />

        <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP.organizerDetail} />

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
        onPress={() => navigation.navigate('AddEditOrganizer', { organizerId })}
      />
    </View>
  );
}

function PaymentRow({
  payment,
  showDivider,
}: {
  payment: EnrichedOrganizerPayment;
  showDivider: boolean;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <>
      {showDivider && <Divider style={{ backgroundColor: colors.border, marginVertical: Spacing.xs }} />}
      <View style={styles.paymentRow}>
        <View style={{ flex: 1, gap: 0 }}>
          <ColorDotLabel
            color={payment.class_type_color}
            label={payment.series_title}
            style={styles.paymentTitle}
          />
          <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
            {formatDisplayDate(payment.session_date)} · {formatDisplayTime(payment.class_time)}
          </Text>
          {payment.status === 'paid' && payment.paid_date && (
            <Text variant="bodySmall" style={{ color: colors.textMuted }}>
              Paid on {formatDisplayDate(payment.paid_date)}
            </Text>
          )}
        </View>
        <Text
          variant="bodySmall"
          style={{
            color: payment.status === 'pending' ? BrandCore.orange : BrandCore.pink,
            fontWeight: '600',
            alignSelf: 'flex-start',
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
    ...Elevation.flat,
    backgroundColor: colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.lg,
    gap: Spacing.xs,
  },
  infoRow: { gap: 0, marginBottom: Spacing.xs },
  paymentSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  balanceAmount: { ...Typography.h4, fontWeight: '700' },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  paymentTitle: { ...Typography.bodySm },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
