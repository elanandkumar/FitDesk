import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppThemeColors, BrandCore, Elevation, Radius, Spacing, Typography } from '../../theme/brandColors';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import { OrganizerMonthIncome, TraineeMonthPackage } from '../../types';
import { getOrganizerIncomeForMonth, getTraineePackagesForMonth } from '../../database/repositories/paymentRepository';
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
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.amountStatus}>
      <Text style={styles.amountLabel} numberOfLines={1}>{status === 'paid' ? 'Paid' : 'Pending'}</Text>
      <Text
        style={[styles.amount, status === 'pending' ? styles.pendingAmount : styles.paidAmount]}
        numberOfLines={1}
      >
        {formatCurrency(amount)}
      </Text>
    </View>
  );
}

export default function IncomeMonthDetailScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const route = useRoute<Route>();
  const { month } = route.params;
  const [organizers, setOrganizers] = useState<OrganizerMonthIncome[]>([]);
  const [packages, setPackages] = useState<TraineeMonthPackage[]>([]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: formatMonth(month) });
  }, [navigation, month]);

  useFocusEffect(
    useCallback(() => {
      getOrganizerIncomeForMonth(month).then(setOrganizers);
      getTraineePackagesForMonth(month).then(setPackages);
    }, [month])
  );

  const hasData = organizers.length > 0 || packages.length > 0;

  const organizerTotal = organizers.reduce((s, m) => s + m.paid + m.pending, 0);
  const packageTotal = packages.reduce((s, p) => s + p.amount, 0);
  const grandTotal = organizerTotal + packageTotal;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          hasData ? styles.content : styles.emptyContent,
          hasData && { paddingBottom: 104 + insets.bottom },
        ]}
      >
        {!hasData && (
          <EmptyState icon="chartBar" title="No data for this month" subtitle="" />
        )}

        {organizers.length > 0 && (
          <>
            <SectionHeader label="Organizer Sessions" />
            {organizers.map((m) => (
              <View key={`organizer-${m.organizer_id}`} style={styles.itemCard}>
                <View style={styles.itemRow}>
                  <Text variant="bodyMedium" style={styles.itemName} numberOfLines={1}>{m.organizer_name}</Text>
                  {m.paid > 0 && <AmountStatus amount={m.paid} status="paid" />}
                  {m.pending > 0 && <AmountStatus amount={m.pending} status="pending" />}
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
                  <View>
                    <Text variant="bodyMedium" style={styles.itemName} numberOfLines={1}>{p.trainee_name}</Text>
                    <Text variant="bodySmall" style={{ color: colors.textMuted }}>
                      {p.used_sessions}/{p.total_sessions} sessions
                    </Text>
                  </View>
                  <AmountStatus amount={p.amount} status={p.status === 'paid' ? 'paid' : 'pending'} />
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {hasData && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
          <View style={styles.totalCard}>
            <View style={styles.totalHeader}>
              <Text style={styles.totalLabel}>Month Total</Text>
              <Text style={styles.totalAmount}>{formatCurrency(grandTotal)}</Text>
            </View>
            <Text style={styles.totalSub}>Organizer sessions + trainee packages</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg, gap: Spacing.sm },
  emptyContent: { flexGrow: 1 },
  itemCard: {
    ...Elevation.flat,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { color: colors.textPrimary, fontWeight: '600' },
  amountLabel: { ...Typography.caption, color: colors.textSecondary },
  amount: { ...Typography.h4, fontWeight: '700' },
  paidAmount: { color: BrandCore.pink },
  pendingAmount: { color: BrandCore.orange },
  amountStatus: { alignItems: 'center' },
  totalCard: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: colors.surfaceRaised,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  footer: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    bottom: 0,
    left: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    position: 'absolute',
    right: 0,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  totalLabel: { ...Typography.labelLg, color: colors.textPrimary },
  totalSub: { ...Typography.bodySm, color: colors.textSecondary, marginTop: 2 },
  totalAmount: { ...Typography.h2, color: colors.textPrimary },
});
