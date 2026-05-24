import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, FAB, IconButton, Text } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
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
  const { theme } = useAppTheme();
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
          <IconButton icon="help-circle-outline" iconColor={theme.colors.primary} onPress={() => setHelpVisible(true)} />
        ),
      });
    }
  }, [manager, managerId, navigation, theme.colors.primary]);

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <ScrollView
      contentContainerStyle={styles.content}
    >
      {/* Contact */}
      <Card style={{ backgroundColor: theme.colors.surface }}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Contact</Text>
          <Divider style={{ marginVertical: 8 }} />
          {manager.phone ? <InfoRow label="Phone" value={manager.phone} theme={theme} /> : null}
          {manager.email ? <InfoRow label="Email" value={manager.email} theme={theme} /> : null}
          {!manager.phone && !manager.email && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>No contact info</Text>
          )}
        </Card.Content>
      </Card>

      {/* Payment Summary */}
      <Card style={{ backgroundColor: theme.colors.surface }}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Payment</Text>
          <Divider style={{ marginVertical: 8 }} />
          <InfoRow
            label="Per class rate"
            value={formatCurrency(manager.per_class_rate)}
            theme={theme}
          />
          <View style={styles.balanceRow}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Outstanding balance
            </Text>
            <Chip
              style={{
                backgroundColor: outstanding > 0 ? theme.colors.errorContainer : theme.colors.secondaryContainer,
              }}
              textStyle={{
                color: outstanding > 0 ? theme.colors.onErrorContainer : theme.colors.onSecondaryContainer,
              }}
            >
              {formatCurrency(outstanding)}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Payment History */}
      {payments.length > 0 && (
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              Payment History ({payments.length})
            </Text>
            <Divider style={{ marginVertical: 8 }} />
            {pendingPayments.length > 0 && (
              <>
                <Text variant="labelSmall" style={{ color: theme.colors.error, marginBottom: 4 }}>
                  PENDING ({pendingPayments.length})
                </Text>
                {pendingPayments.map((p, i) => (
                  <PaymentRow key={p.id} payment={p} theme={theme} showDivider={i > 0} />
                ))}
              </>
            )}
            {pendingPayments.length > 0 && paidPayments.length > 0 && (
              <Divider style={{ marginVertical: 8 }} />
            )}
            {paidPayments.length > 0 && (
              <>
                <Text
                  variant="labelSmall"
                  style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}
                >
                  PAID ({paidPayments.length})
                </Text>
                {paidPayments.slice(0, 8).map((p, i) => (
                  <PaymentRow key={p.id} payment={p} theme={theme} showDivider={i > 0} />
                ))}
                {paidPayments.length > 8 && (
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}
                  >
                    + {paidPayments.length - 8} more paid
                  </Text>
                )}
              </>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Notes */}
      {manager.notes ? (
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Notes</Text>
            <Divider style={{ marginVertical: 8 }} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {manager.notes}
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      <Button
        mode="outlined"
        onPress={() => setDeleteVisible(true)}
        textColor={theme.colors.error}
        style={{ borderColor: theme.colors.error, marginTop: 8 }}
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
      <FAB
        icon="pencil"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate('AddEditManager', { managerId })}
      />
    </View>
  );
}

function PaymentRow({
  payment,
  theme,
  showDivider,
}: {
  payment: EnrichedManagerPayment;
  theme: ReturnType<typeof useAppTheme>['theme'];
  showDivider: boolean;
}) {
  return (
    <>
      {showDivider && <Divider style={{ marginVertical: 4 }} />}
      <View style={styles.paymentRow}>
        <View style={[styles.colorDot, { backgroundColor: payment.class_type_color }]} />
        <View style={{ flex: 1, gap: 1 }}>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
            {payment.series_title}
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            {formatDisplayDate(payment.session_date)} · {formatDisplayTime(payment.class_time)}
          </Text>
          {payment.status === 'paid' && payment.paid_date && (
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Paid {formatDisplayDate(payment.paid_date)}
            </Text>
          )}
        </View>
        <Text
          variant="bodySmall"
          style={{
            color: payment.status === 'pending' ? theme.colors.error : theme.colors.onSurface,
            fontWeight: '600',
          }}
        >
          {formatCurrency(payment.amount)}
        </Text>
      </View>
    </>
  );
}

function InfoRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useAppTheme>['theme'];
}) {
  return (
    <View style={styles.infoRow}>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  cardContent: { gap: 4 },
  infoRow: { gap: 2, marginBottom: 8 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  colorDot: { width: 8, height: 8, borderRadius: 4, marginTop: 2 },
  fab: { position: 'absolute', bottom: 16, right: 16, borderRadius: 4 },
});
