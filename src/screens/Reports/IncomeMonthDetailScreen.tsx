import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { CenterMonthIncome, ManagerMonthIncome, TraineeMonthPackage } from '../../types';
import { getCenterIncomeForMonth, getManagerIncomeForMonth, getTraineePackagesForMonth } from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import EmptyState from '../../components/common/EmptyState';

type Nav = StackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'IncomeMonthDetail'>;

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

export default function IncomeMonthDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { month } = route.params;
  const [managers, setManagers] = useState<ManagerMonthIncome[]>([]);
  const [packages, setPackages] = useState<TraineeMonthPackage[]>([]);
  const [centers, setCenters] = useState<CenterMonthIncome[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: formatMonth(month) });
  }, [navigation, month]);

  useFocusEffect(
    useCallback(() => {
      getManagerIncomeForMonth(month).then(setManagers);
      getTraineePackagesForMonth(month).then(setPackages);
      getCenterIncomeForMonth(month).then(setCenters);
    }, [month])
  );

  const hasData = managers.length > 0 || packages.length > 0;

  const managerTotal = managers.reduce((s, m) => s + m.paid + m.pending, 0);
  const packageTotal = packages.reduce((s, p) => s + p.amount, 0);
  const grandTotal = managerTotal + packageTotal;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {!hasData && (
        <EmptyState icon="chart-bar" title="No data for this month" subtitle="" />
      )}

      {managers.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Manager Classes</Text>
          {managers.map((m) => (
            <View key={m.manager_id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <Text variant="bodyMedium" style={styles.itemName}>{m.manager_name}</Text>
                <View style={styles.amounts}>
                  {m.paid > 0 && (
                    <Text style={styles.paidAmount}>{formatCurrency(m.paid)} paid</Text>
                  )}
                  {m.pending > 0 && (
                    <Text variant="bodySmall" style={styles.pendingAmount}>
                      {formatCurrency(m.pending)} due
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      {packages.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, managers.length > 0 && { marginTop: Spacing.lg }]}>
            Trainee Packages
          </Text>
          {packages.map((p) => (
            <View key={p.trainee_id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyMedium" style={styles.itemName}>{p.trainee_name}</Text>
                  <Text variant="bodySmall" style={{ color: Brand.textMuted }}>
                    {p.used_sessions}/{p.total_sessions} sessions
                  </Text>
                </View>
                <View style={styles.amounts}>
                  <Text style={[styles.paidAmount, p.status === 'pending' && { color: Brand.pink }]}>
                    {formatCurrency(p.amount)}
                  </Text>
                  <View style={[
                    styles.statusPill,
                    { backgroundColor: p.status === 'paid' ? Brand.purple + '33' : Brand.pink + '22' },
                  ]}>
                    <Text style={{
                      ...Typography.microLabel,
                      color: p.status === 'paid' ? Brand.purple : Brand.pink,
                    }}>
                      {p.status === 'paid' ? 'Paid' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      {centers.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, (managers.length > 0 || packages.length > 0) && { marginTop: Spacing.lg }]}>
            By Center
          </Text>
          {centers.map((c) => (
            <View key={c.center_id} style={styles.itemCard}>
              <View style={styles.itemRow}>
                <Text variant="bodyMedium" style={styles.itemName}>{c.center_name}</Text>
                <View style={styles.amounts}>
                  {c.paid > 0 && (
                    <Text style={styles.paidAmount}>{formatCurrency(c.paid)} paid</Text>
                  )}
                  {c.pending > 0 && (
                    <Text variant="bodySmall" style={styles.pendingAmount}>
                      {formatCurrency(c.pending)} due
                    </Text>
                  )}
                </View>
              </View>
            </View>
          ))}
        </>
      )}

      {hasData && (
        <View style={styles.totalCard}>
          <Text variant="labelMedium" style={{ color: Brand.textSecondary }}>Month Total</Text>
          <Text style={styles.totalAmount}>{formatCurrency(grandTotal)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  content: { padding: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.section },
  sectionLabel: {
    ...Typography.microLabel,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
  },
  itemCard: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    elevation: 4,
    shadowColor: Brand.purple,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { color: Brand.textPrimary, fontWeight: '600' },
  paidAmount: { ...Typography.labelLg, color: Brand.orange },
  pendingAmount: { color: Brand.pink },
  amounts: { alignItems: 'flex-end', gap: Spacing.xs },
  statusPill: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.full }, // paddingVertical: micro below xs(4)
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
    marginTop: Spacing.sm,
  },
  totalAmount: { ...Typography.h1, fontSize: 20, color: Brand.orange },
});
