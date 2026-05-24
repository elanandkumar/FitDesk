import React, { useCallback, useLayoutEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Card, Divider, IconButton, Text } from 'react-native-paper';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import { MonthlyIncomeSummary } from '../../types';
import { getMonthlyIncomeSummary } from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import EmptyState from '../../components/common/EmptyState';
import HelpSheet from '../../components/common/HelpSheet';

type Nav = StackNavigationProp<RootStackParamList>;

const HELP =
  'Shows total earned vs pending per month across manager classes and trainee packages. Only completed sessions and existing packages are counted.';

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

export default function IncomeSummaryScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const [rows, setRows] = useState<MonthlyIncomeSummary[]>([]);
  const [helpVisible, setHelpVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton icon="help-circle-outline" iconColor={theme.colors.primary} onPress={() => setHelpVisible(true)} />
      ),
    });
  }, [navigation, theme.colors.primary]);

  useFocusEffect(
    useCallback(() => {
      getMonthlyIncomeSummary().then(setRows);
    }, [])
  );

  const totalEarned = rows.reduce((s, r) => s + r.total_paid, 0);
  const totalPending = rows.reduce((s, r) => s + r.total_pending, 0);

  const renderItem = ({ item }: { item: MonthlyIncomeSummary }) => (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="outlined" onPress={() => navigation.navigate('IncomeMonthDetail', { month: item.month })}>
      <Card.Content>
        <View style={styles.cardTopRow}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '700' }}>
            {formatMonth(item.month)}
          </Text>
          <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
        </View>

        {(item.manager_paid > 0 || item.manager_pending > 0) && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.row}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Manager classes
              </Text>
              <View style={styles.rowRight}>
                {item.manager_paid > 0 && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                    {formatCurrency(item.manager_paid)} paid
                  </Text>
                )}
                {item.manager_pending > 0 && (
                  <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                    {formatCurrency(item.manager_pending)} due
                  </Text>
                )}
              </View>
            </View>
          </>
        )}

        {(item.trainee_paid > 0 || item.trainee_pending > 0) && (
          <>
            <Divider style={styles.divider} />
            <View style={styles.row}>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Trainee packages
              </Text>
              <View style={styles.rowRight}>
                {item.trainee_paid > 0 && (
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurface }}>
                    {formatCurrency(item.trainee_paid)} paid
                  </Text>
                )}
                {item.trainee_pending > 0 && (
                  <Text variant="bodySmall" style={{ color: theme.colors.error }}>
                    {formatCurrency(item.trainee_pending)} due
                  </Text>
                )}
              </View>
            </View>
          </>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {rows.length > 0 && (
        <View style={[styles.summary, { backgroundColor: theme.colors.primaryContainer }]}>
          <View style={styles.summaryItem}>
            <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer }}>
              Total Earned
            </Text>
            <Text variant="titleLarge" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '700' }}>
              {formatCurrency(totalEarned)}
            </Text>
          </View>
          {totalPending > 0 && (
            <View style={styles.summaryItem}>
              <Text variant="labelMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                Pending
              </Text>
              <Text variant="titleLarge" style={{ color: theme.colors.error, fontWeight: '700' }}>
                {formatCurrency(totalPending)}
              </Text>
            </View>
          )}
        </View>
      )}

      <FlatList
        data={rows}
        keyExtractor={(item) => item.month}
        renderItem={renderItem}
        contentContainerStyle={rows.length === 0 ? styles.emptyContainer : styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="chart-bar"
            title="No income data yet"
            subtitle="Income appears here when sessions are completed or packages are created."
          />
        }
      />

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  summaryItem: { alignItems: 'center', gap: 4 },
  listContent: { padding: 12, gap: 8 },
  emptyContainer: { flex: 1 },
  card: { marginBottom: 4 },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  divider: { marginVertical: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowRight: { alignItems: 'flex-end', gap: 2 },
});
