import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { FAB, IconButton, List, Searchbar, Text } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { ClassSeries } from '../../types';
import { getAllClassSeries } from '../../database/repositories/classSeriesRepository';
import { getAllClassTypes } from '../../database/repositories/classTypeRepository';
import { ClassType } from '../../types';
import { formatDisplayTime, formatRecurrenceSummary } from '../../utils/dateUtils';
import EmptyState from '../../components/common/EmptyState';
import { RootStackParamList } from '../../navigation/types';
import HelpSheet from '../../components/common/HelpSheet';

const HELP =
  'A series defines a recurring class schedule. Sessions are auto-generated 90 days ahead. Tap a series to edit it. Tap + to create a new one.';

type Nav = StackNavigationProp<RootStackParamList>;

export default function ClassSeriesListScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const [series, setSeries] = useState<ClassSeries[]>([]);
  const [classTypes, setClassTypes] = useState<Map<number, ClassType>>(new Map());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [helpVisible, setHelpVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton icon="help-circle-outline" iconColor={theme.colors.primary} onPress={() => setHelpVisible(true)} />
      ),
    });
  }, [navigation, theme.colors.primary]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [allSeries, allTypes] = await Promise.all([getAllClassSeries(), getAllClassTypes()]);
      setSeries(allSeries);
      setClassTypes(new Map(allTypes.map((ct) => [ct.id, ct])));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    if (!query.trim()) return series;
    const q = query.toLowerCase();
    return series.filter((s) => s.title.toLowerCase().includes(q));
  }, [series, query]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search class series"
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
              title={query ? 'No matches' : 'No class series'}
              subtitle={query ? 'Try a different search' : 'Tap + to create a recurring class'}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const ct = classTypes.get(item.class_type_id);
          const recurrenceText = formatRecurrenceSummary(item.recurrence_type, item.recurrence_days);
          return (
            <List.Item
              title={item.title}
              description={`${formatDisplayTime(item.class_time)} · ${recurrenceText}`}
              titleStyle={{ color: item.is_active ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}
              descriptionStyle={{ color: theme.colors.onSurfaceVariant }}
              style={{ backgroundColor: theme.colors.surface }}
              left={() => (
                <View
                  style={[
                    styles.colorBar,
                    { backgroundColor: ct?.color ?? theme.colors.primary, opacity: item.is_active ? 1 : 0.4 },
                  ]}
                />
              )}
              right={() => (
                <View style={styles.rightContent}>
                  {!item.is_active && (
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Cancelled
                    </Text>
                  )}
                  <List.Icon icon="chevron-right" />
                </View>
              )}
              onPress={() => navigation.navigate('AddEditClassSeries', { seriesId: item.id })}
            />
          );
        }}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: theme.colors.surfaceVariant }} />
        )}
      />
      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate('AddEditClassSeries', {})}
      />

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchbar: { margin: 8, borderRadius: 0 },
  fab: { position: 'absolute', bottom: 16, right: 16, borderRadius: 4 },
  colorBar: { width: 4, borderRadius: 2, marginVertical: 8, marginLeft: 8, marginRight: 4 },
  rightContent: { flexDirection: 'row', alignItems: 'center' },
});
