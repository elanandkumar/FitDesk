import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FAB, IconButton, List, Searchbar } from 'react-native-paper';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialTopTabNavigationProp } from '@react-navigation/material-top-tabs';
import { useAppTheme } from '../../theme';
import { Manager } from '../../types';
import { getAllManagers } from '../../database/repositories/managerRepository';
import { getManagerOutstandingBalance } from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import EmptyState from '../../components/common/EmptyState';
import { RootStackParamList, PeopleTabParamList } from '../../navigation/types';
import HelpSheet from '../../components/common/HelpSheet';

const HELP =
  'Add managers who assign you classes. Outstanding balance (in red) shows total unpaid sessions. Tap a manager to see their payment history.';

type Nav = CompositeNavigationProp<
  MaterialTopTabNavigationProp<PeopleTabParamList, 'Managers'>,
  StackNavigationProp<RootStackParamList>
>;

interface ManagerWithBalance extends Manager {
  outstanding: number;
}

export default function ManagerListScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const [managers, setManagers] = useState<ManagerWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllManagers();
      const withBalance = await Promise.all(
        all.map(async (m) => ({ ...m, outstanding: await getManagerOutstandingBalance(m.id) }))
      );
      setManagers(withBalance);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    navigation.getParent()?.setOptions({
      headerRight: () => (
        <IconButton icon="help-circle-outline" iconColor={theme.colors.primary} onPress={() => setHelpVisible(true)} />
      ),
    });
    return () => {
      navigation.getParent()?.setOptions({ headerRight: undefined });
    };
  }, [load, navigation, theme.colors.primary]));

  const filtered = useMemo(() => {
    if (!query.trim()) return managers;
    const q = query.toLowerCase();
    return managers.filter((m) => m.name.toLowerCase().includes(q));
  }, [managers, query]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search managers"
        value={query}
        onChangeText={setQuery}
        style={styles.searchbar}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={query ? 'No matches' : 'No managers'}
              subtitle={query ? 'Try a different search' : 'Tap + to add a manager'}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={
              item.outstanding > 0
                ? `Outstanding: ${formatCurrency(item.outstanding)}`
                : `Rate: ${formatCurrency(item.per_class_rate)}/class`
            }
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{
              color: item.outstanding > 0 ? theme.colors.error : theme.colors.onSurfaceVariant,
            }}
            style={{ backgroundColor: theme.colors.surface }}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('ManagerDetail', { managerId: item.id })}
          />
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: theme.colors.surfaceVariant }} />
        )}
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate('AddEditManager', {})}
      />

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchbar: { margin: 8, borderRadius: 0 },
  fab: { position: 'absolute', bottom: 16, right: 16, borderRadius: 4 },
});
