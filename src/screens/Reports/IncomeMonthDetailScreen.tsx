import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, Chip, Divider, Text } from 'react-native-paper';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import { ManagerMonthIncome, TraineeMonthPackage } from '../../types';
import { getManagerIncomeForMonth, getTraineePackagesForMonth } from '../../database/repositories/paymentRepository';
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
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
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

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      {!hasData && (
        <EmptyState icon="chart-bar" title="No data for this month" subtitle="" />
      )}

      {managers.length > 0 && (
        <>
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant }]}>
            Manager Classes
          </Text>
          {managers.map((m) => (
            <Card key={m.manager_id} style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="outlined">
              <Card.Content>
                <View style={styles.row}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, flex: 1, fontWeight: '600' }}>
                    {m.manager_name}
                  </Text>
                  <View style={styles.amounts}>
                    {m.paid > 0 && (
                      <Text variant="bodyMedium" style={{ color: theme.colors.primary }}>
                        {formatCurrency(m.paid)} paid
                      </Text>
                    )}
                    {m.pending > 0 && (
                      <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                        {formatCurrency(m.pending)} due
                      </Text>
                    )}
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </>
      )}

      {packages.length > 0 && (
        <>
          <Text variant="titleSmall" style={[styles.sectionLabel, { color: theme.colors.onSurfaceVariant, marginTop: managers.length > 0 ? 16 : 0 }]}>
            Trainee Packages
          </Text>
          {packages.map((p) => (
            <Card key={p.trainee_id} style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="outlined">
              <Card.Content>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                      {p.trainee_name}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {p.used_sessions}/{p.total_sessions} sessions
                    </Text>
                  </View>
                  <View style={styles.amounts}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                      {formatCurrency(p.amount)}
                    </Text>
                    <Chip
                      compact
                      style={{ backgroundColor: p.status === 'paid' ? theme.colors.primaryContainer : theme.colors.errorContainer }}
                      textStyle={{ color: p.status === 'paid' ? theme.colors.onPrimaryContainer : theme.colors.onErrorContainer, fontSize: 11 }}
                    >
                      {p.status}
                    </Chip>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 12, gap: 8 },
  sectionLabel: { marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: { marginBottom: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amounts: { alignItems: 'flex-end', gap: 2 },
});
