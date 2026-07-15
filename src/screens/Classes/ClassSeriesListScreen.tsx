import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from 'react-native-paper';
import AppSearchbar from '../../components/common/AppSearchbar';
import GradientFAB from '../../components/common/GradientFAB';
import AppIconButton from '../../components/common/AppIconButton';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { AppThemeColors, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { ClassSeries, ClassType } from '../../types';
import { getAllClassSeries } from '../../database/repositories/classSeriesRepository';
import { getAllClassTypes } from '../../database/repositories/classTypeRepository';
import { todayISO } from '../../utils/dateUtils';
import EmptyState from '../../components/common/EmptyState';
import { RootStackParamList } from '../../navigation/types';
import { listItemEntering } from '../../animations/listItemEntering';
import HelpSheet from '../../components/common/HelpSheet';
import { HELP } from '../../constants/helpContent';
import ClassSeriesCard from '../../components/common/ClassSeriesCard';

type Nav = StackNavigationProp<RootStackParamList>;
type SeriesStatusFilter = 'active' | 'all';
type SeriesSortOrder = 'latest' | 'az';

export default function ClassSeriesListScreen() {
  const { accentPalette, colors, theme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [series, setSeries] = useState<ClassSeries[]>([]);
  const [classTypes, setClassTypes] = useState<Map<number, ClassType>>(new Map());
  const [loading, setLoading] = useState(true);
  const [animationCycle, setAnimationCycle] = useState(0);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SeriesStatusFilter>('active');
  const [sortOrder, setSortOrder] = useState<SeriesSortOrder>('latest');
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const activeOnly = statusFilter === 'active';
  const filtersAreDefault = statusFilter === 'active' && sortOrder === 'latest';

  const resetFilters = () => {
    setStatusFilter('active');
    setSortOrder('latest');
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <AppIconButton icon="question" iconColor={accentPalette.textAccent} onPress={() => setHelpVisible(true)} />
      ),
    });
  }, [accentPalette.textAccent, navigation, theme.colors.primary]);

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

  useFocusEffect(useCallback(() => {
    setAnimationCycle((cycle) => cycle + 1);
    load();
  }, [load]));

  const today = todayISO();

  const filtered = useMemo(() => {
    let list = activeOnly ? series.filter((s) => s.is_active === 1) : series;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sortOrder === 'az') return a.title.localeCompare(b.title);
      return b.created_at.localeCompare(a.created_at);
    });
  }, [series, query, activeOnly, sortOrder]);

  const renderSheetTitle = (label: string) => (
    <View style={styles.sheetSectionTitleRow}>
      <View style={[styles.sheetSectionAccent, { backgroundColor: accentPalette.main }]} />
      <Text style={styles.sheetSectionTitle}>{label}</Text>
    </View>
  );

  const renderFilterChip = (
    label: string,
    selected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      activeOpacity={0.72}
      onPress={onPress}
      style={[
        styles.sheetChip,
        selected && { backgroundColor: accentPalette.main, borderColor: accentPalette.main },
      ]}
    >
      <Text
        numberOfLines={1}
        style={[styles.sheetChipText, selected && { color: theme.colors.onPrimary }]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppSearchbar
        placeholder="Search class series"
        value={query}
        onChangeText={setQuery}
        style={[styles.searchbar, { backgroundColor: colors.surface }]}
      />
      <View style={styles.filterRow}>
        <Text style={styles.filterSummary}>
          {activeOnly ? 'Active only' : 'All series'} · {sortOrder === 'latest' ? 'Latest first' : 'A-Z'}
        </Text>
        <AppIconButton
          icon="sliders"
          iconColor={accentPalette.textAccent}
          onPress={() => setFiltersVisible(true)}
          style={[
            styles.filterButton,
            {
              borderColor: filtersAreDefault ? accentPalette.main : accentPalette.textAccent,
              backgroundColor: filtersAreDefault ? colors.surface : accentPalette.main + '26',
            },
            !filtersAreDefault && styles.filterButtonActive,
          ]}
        />
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => `${animationCycle}-${item.id}`}
        contentContainerStyle={[
          filtered.length === 0 && !loading ? styles.emptyContainer : styles.listContent,
          { flexGrow: 1 },
        ]}
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
          const statusLabel = item.is_active ? undefined : item.end_date && item.end_date <= today ? 'Ended' : 'Cancelled';
          return (
            <Animated.View entering={listItemEntering(index)}>
              <ClassSeriesCard
                series={item}
                classType={ct}
                statusLabel={statusLabel}
                style={styles.seriesCard}
                onPress={() => navigation.navigate('AddEditClassSeries', { seriesId: item.id })}
              />
            </Animated.View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />
      <GradientFAB
        icon="plus"
        style={[styles.fab, { bottom: 16 + insets.bottom }]}
        onPress={() => navigation.navigate('AddEditClassSeries', {})}
      />

      <Modal
        visible={filtersVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFiltersVisible(false)}
        statusBarTranslucent
      >
        <Pressable style={styles.sheetRoot} onPress={() => setFiltersVisible(false)}>
          <Pressable
            style={[styles.sheet, { paddingBottom: insets.bottom || Spacing.lg }]}
            onPress={(event) => event.stopPropagation()}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={filtersAreDefault}
                hitSlop={8}
                onPress={resetFilters}
                style={filtersAreDefault && styles.sheetResetDisabled}
              >
                <Text style={[styles.sheetResetText, { color: accentPalette.textAccent }]}>Reset</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sheetSection}>
              {renderSheetTitle('Series status')}
              <View style={styles.sheetChipRow}>
                {renderFilterChip('Active only', statusFilter === 'active', () => setStatusFilter('active'))}
                {renderFilterChip('All series', statusFilter === 'all', () => setStatusFilter('all'))}
              </View>
            </View>

            <View style={styles.sheetSection}>
              {renderSheetTitle('Sort series')}
              <View style={styles.sheetChipRow}>
                {renderFilterChip('Latest first', sortOrder === 'latest', () => setSortOrder('latest'))}
                {renderFilterChip('A-Z', sortOrder === 'az', () => setSortOrder('az'))}
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP.classSeriesList} />
    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  searchbar: { margin: Spacing.md, marginBottom: 0, borderRadius: Radius.lg, elevation: 0, borderWidth: 1, borderColor: colors.border },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  filterSummary: { ...Typography.bodySm, color: colors.textSecondary, flex: 1 },
  filterButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    backgroundColor: colors.surface,
  },
  filterButtonActive: {
    borderWidth: 1.5,
  },
  listContent: { paddingBottom: Layout.LIST_PAD_WITH_FAB },
  emptyContainer: { flex: 1 },
  seriesCard: {
    marginHorizontal: Spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.surfaceRaised,
    borderTopLeftRadius: Radius.item,
    borderTopRightRadius: Radius.item,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: Radius.full,
    backgroundColor: colors.border,
    marginBottom: Spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: Spacing.md,
  },
  sheetTitle: { ...Typography.h4, color: colors.textPrimary, flex: 1 },
  sheetResetText: { ...Typography.labelSm },
  sheetResetDisabled: { opacity: 0.4 },
  sheetSection: { paddingBottom: Spacing.xl },
  sheetSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sheetSectionAccent: {
    width: 3,
    height: 14,
    borderRadius: Radius.xs,
  },
  sheetSectionTitle: {
    ...Typography.labelSm,
    color: colors.textPrimary,
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sheetChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sheetChip: {
    minHeight: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetChipText: { ...Typography.labelSm, color: colors.textSecondary },
});
