import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FAB, IconButton, List, Searchbar } from 'react-native-paper';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialTopTabNavigationProp } from '@react-navigation/material-top-tabs';
import { useAppTheme } from '../../theme';
import { Trainee } from '../../types';
import { getAllTrainees } from '../../database/repositories/traineeRepository';
import EmptyState from '../../components/common/EmptyState';
import { RootStackParamList, PeopleTabParamList } from '../../navigation/types';
import HelpSheet from '../../components/common/HelpSheet';

const HELP =
  'Add your personal training clients here. Tap a trainee to view their packages and session history.';

type Nav = CompositeNavigationProp<
  MaterialTopTabNavigationProp<PeopleTabParamList, 'Trainees'>,
  StackNavigationProp<RootStackParamList>
>;

export default function TraineeListScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTrainees(await getAllTrainees());
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
    if (!query.trim()) return trainees;
    const q = query.toLowerCase();
    return trainees.filter((t) => t.name.toLowerCase().includes(q));
  }, [trainees, query]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search trainees"
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
              title={query ? 'No matches' : 'No trainees'}
              subtitle={query ? 'Try a different search' : 'Tap + to add a trainee'}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            description={item.phone ?? item.email ?? undefined}
            titleStyle={{ color: theme.colors.onSurface }}
            descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
            style={{ backgroundColor: theme.colors.surface }}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('TraineeDetail', { traineeId: item.id })}
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
        onPress={() => navigation.navigate('AddEditTrainee', {})}
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
