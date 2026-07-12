import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { ManagerMonthIncome, TraineeMonthPackage } from '../../types';
import { getManagerIncomeForMonth, getTraineePackagesForMonth } from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import EmptyState from '../../components/common/EmptyState';
import SectionHeader from '../../components/common/SectionHeader';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'IncomeMonthDetail'>;

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function AmountStatus({ amount, status }: { amount: number; status: 'paid' | 'pending' }) {
  return (
    <View style={styles.amountStatus}>
      <Text style={styles.amountLabel}>{status === 'paid' ? 'Paid' : 'Pending'}</Text>
      <Text style={[styles.amount, status === 'pending' ? styles.pendingAmount : styles.paidAmount]}>
        {formatCurrency(amount)}
      </Text>
    </View>
  );
}

export default function IncomeMonthDetailScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Route>();
  const { month } = route.params;
  const [managers, setManagers] = useState<ManagerMonthIncome[]>([]);
  const [packages, setPackages] = useState<TraineeMonthPackage[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: formatMonth(month) });
  }, [navigation, month]);

  useFocusEffect(
    useCallback(() => {
      getManagerIncomeForMonth(month).then(setManagers);
      getTraineePackagesForMonth(month).then(setPackages);
    }, [month])
  );

  const hasData = managers.length > 0 || packages.length > 0;

  const managerTotal = managers.reduce((s, m) => s + m.paid + m.pending, 0);
  const packageTotal = packages.reduce((s, p) => s + p.amount, 0);
  const grandTotal = managerTotal + packageTotal;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          hasData ? styles.content : styles.emptyContent,
          hasData && { paddingBottom: 132 + insets.bottom },
        ]}
      >
        {!hasData && (
          <EmptyState icon="chartBar" title="No data for this month" subtitle="" />
        )}

        {managers.length > 0 && (
          <>
            <SectionHeader label="Manager Classes" />
            {managers.map((m) => (
              <View key={`manager-${m.manager_id}`} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <Text variant="bodyMedium" style={styles.itemName}>{m.manager_name}</Text>
                  <View style={styles.amounts}>
                    {m.paid > 0 && <AmountStatus amount={m.paid} status="paid" />}
                    {m.pending > 0 && <AmountStatus amount={m.pending} status="pending" />}
                  </View>
                </View>
              </View>
            ))}
          </>
        )}

        {packages.length > 0 && (
          <>
            <SectionHeader label="Trainee Packages" />
            {packages.map((p) => (
              <View key={`package-${p.package_id}`} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" style={styles.itemName}>{p.trainee_name}</Text>
                    <Text variant="bodySmall" style={{ color: Brand.textMuted }}>
                      {p.used_sessions}/{p.total_sessions} sessions
                    </Text>
                  </View>
                  <View style={styles.amounts}>
                    <AmountStatus amount={p.amount} status={p.status === 'paid' ? 'paid' : 'pending'} />
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {hasData && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={styles.totalCard}>
            <View style={styles.totalText}>
              <Text style={styles.totalLabel}>Month Total</Text>
              <Text style={styles.totalSub}>Manager classes + trainee packages</Text>
            </View>
            <Text style={styles.totalAmount}>{formatCurrency(grandTotal)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  emptyContent: { flexGrow: 1 },
  itemCard: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { color: Brand.textPrimary, fontWeight: '600' },
  amountLabel: { ...Typography.caption, color: Brand.textSecondary },
  amount: { ...Typography.h4, fontWeight: '700' },
  paidAmount: { color: Brand.pink },
  pendingAmount: { color: Brand.orange },
  amounts: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
    marginLeft: Spacing.md,
  },
  amountStatus: { alignItems: 'center', minWidth: 86 },
  totalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Brand.surfaceElevated,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
  },
  footer: {
    backgroundColor: Brand.backgroundDark,
    borderTopColor: Brand.borderSubtle,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    position: 'absolute',
    right: 0,
  },
  totalText: { flex: 1, marginRight: Spacing.md },
  totalLabel: { ...Typography.labelLg, color: Brand.textPrimary },
  totalSub: { ...Typography.bodySm, color: Brand.textSecondary, marginTop: 2 },
  totalAmount: { ...Typography.h1, color: Brand.textPrimary },
});
