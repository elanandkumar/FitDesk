import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { IconButton, Searchbar, Text } from 'react-native-paper';
import GradientFAB from '../../components/common/GradientFAB';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Brand, Radius } from '../../theme/brandColors';
import { ClassSeries, ClassType } from '../../types';
import { getAllClassSeries } from '../../database/repositories/classSeriesRepository';
import { getAllClassTypes } from '../../database/repositories/classTypeRepository';
import { formatDisplayTime, formatRecurrenceSummary, todayISO } from '../../utils/dateUtils';
import { Chip } from 'react-native-paper';
import EmptyState from '../../components/common/EmptyState';
import { RootStackParamList } from '../../navigation/types';
import HelpSheet from '../../components/common/HelpSheet';

const HELP =
  'A series defines a recurring class schedule. Sessions are auto-generated 90 days ahead. Tap a series to edit it. Tap + to create a new one.';

type Nav = StackNavigationProp<RootStackParamList>;

export default function ClassSeriesListScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [series, setSeries] = useState<ClassSeries[]>([]);
  const [classTypes, setClassTypes] = useState<Map<number, ClassType>>(new Map());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);
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

  const today = todayISO();

  const filtered = useMemo(() => {
    let list = showInactive ? series : series.filter((s) => s.is_active === 1);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q));
    }
    return list;
  }, [series, query, showInactive]);

  return (
    <Animated.View entering={FadeIn.duration(350)} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search class series"
        value={query}
        onChangeText={setQuery}
        style={[styles.searchbar, { backgroundColor: Brand.surfaceDark }]}
        inputStyle={{ color: Brand.textPrimary }}
        iconColor={Brand.textMuted}
        placeholderTextColor={Brand.textMuted}
      />
      <View style={styles.filterRow}>
        <Chip
          selected={!showInactive}
          onPress={() => setShowInactive(false)}
          style={[styles.filterChip, !showInactive && styles.filterChipActive]}
          textStyle={{ color: !showInactive ? Brand.textPrimary : Brand.textSecondary }}
        >
          Active
        </Chip>
        <Chip
          selected={showInactive}
          onPress={() => setShowInactive(true)}
          style={[styles.filterChip, showInactive && styles.filterChipActive]}
          textStyle={{ color: showInactive ? Brand.textPrimary : Brand.textSecondary }}
        >
          All
        </Chip>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={query ? 'No matches' : 'No class series'}
              subtitle={query ? 'Try a different search' : 'Tap + to create a recurring class'}
            />
          ) : null
        }
        renderItem={({ item, index }) => {
          const ct = classTypes.get(item.class_type_id);
          const accentColor = ct?.color ?? Brand.purple;
          const recurrenceText = formatRecurrenceSummary(item.recurrence_type, item.recurrence_days);
          return (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).duration(350)}>
            <TouchableOpacity
              style={[styles.card, !item.is_active && styles.cardInactive]}
              onPress={() => navigation.navigate('AddEditClassSeries', { seriesId: item.id })}
              activeOpacity={0.75}
            >
              <View style={[styles.colorBar, { backgroundColor: accentColor, opacity: item.is_active ? 1 : 0.4 }]} />
              <View style={styles.cardContent}>
                <Text style={[styles.cardTitle, !item.is_active && styles.textInactive]}>
                  {item.title}
                </Text>
                <Text style={styles.cardSub}>
                  {formatDisplayTime(item.class_time)} · {recurrenceText}
                </Text>
              </View>
              {!item.is_active && (
                <View style={styles.cancelledBadge}>
                  <Text style={styles.cancelledText}>
                    {item.end_date && item.end_date <= today ? 'Ended' : 'Cancelled'}
                  </Text>
                </View>
              )}
              <MaterialCommunityIcons name="chevron-right" size={20} color={Brand.textMuted} />
            </TouchableOpacity>
            </Animated.View>
          );
        }}
      />
      <GradientFAB
        icon="plus"
        style={[styles.fab, { bottom: 16 + insets.bottom }]}
        onPress={() => navigation.navigate('AddEditClassSeries', {})}
      />

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchbar: { margin: 12, marginBottom: 0, borderRadius: Radius.lg, elevation: 0 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
  filterChip: { backgroundColor: Brand.surfaceDark, borderColor: Brand.borderSubtle },
  filterChipActive: { backgroundColor: Brand.purple },
  listContent: { paddingHorizontal: 12, paddingBottom: 96 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 8,
    elevation: 4,
    shadowColor: Brand.purple,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    gap: 12,
    overflow: 'hidden',
  },
  cardInactive: { opacity: 0.6 },
  colorBar: { width: 4, height: 40, borderRadius: Radius.xs },
  cardContent: { flex: 1 },
  cardTitle: { color: Brand.textPrimary, fontSize: 15, fontWeight: '600' },
  textInactive: { color: Brand.textSecondary },
  cardSub: { color: Brand.textSecondary, fontSize: 13, marginTop: 2 },
  cancelledBadge: {
    backgroundColor: `${Brand.textMuted}26`,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cancelledText: { color: Brand.textMuted, fontSize: 11, fontWeight: '600' },
  fab: {
    position: 'absolute',
    right: 16,
  },
});
