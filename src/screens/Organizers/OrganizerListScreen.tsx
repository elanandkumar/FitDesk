import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from 'react-native-paper';
import AppSearchbar from '../../components/common/AppSearchbar';
import GradientFAB from '../../components/common/GradientFAB';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { AppThemeColors, Elevation, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { Organizer } from '../../types';
import { getAllOrganizers } from '../../database/repositories/organizerRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import EmptyState from '../../components/common/EmptyState';
import { RootStackParamList } from '../../navigation/types';
import { listItemEntering } from '../../animations/listItemEntering';
import ThemedSegmentedButtons from '../../components/common/ThemedSegmentedButtons';
import { OrganizerContactType } from '../../types';

type Nav = StackNavigationProp<RootStackParamList>;

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function OrganizerListScreen() {
  const { accentPalette, colors, theme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [loading, setLoading] = useState(true);
  const [animationCycle, setAnimationCycle] = useState(0);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | OrganizerContactType>('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrganizers(await getAllOrganizers());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setAnimationCycle((cycle) => cycle + 1);
    load();
  }, [load]));

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return organizers.filter(
      (m) =>
        (filter === 'all' || m.contact_type === filter) &&
        (!query.trim() || m.name.toLowerCase().includes(q))
    );
  }, [filter, organizers, query]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppSearchbar
        placeholder="Search organizers"
        value={query}
        onChangeText={setQuery}
        style={[styles.searchbar, { backgroundColor: colors.surface }]}
      />
      <ThemedSegmentedButtons
        value={filter}
        onValueChange={(value: string) => setFilter(value as 'all' | OrganizerContactType)}
        buttons={[
          { value: 'all', label: 'All' },
          { value: 'regular', label: 'Regular' },
          { value: 'one_time', label: 'One-time' },
        ]}
        style={styles.filters}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => `${animationCycle}-${item.id}`}
        contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={query || filter !== 'all' ? 'No matches' : 'No organizers'}
              subtitle={query || filter !== 'all' ? 'Try a different search or filter' : 'Tap + to add an organizer'}
            />
          ) : null
        }
        renderItem={({ item, index }) => (
          <View style={styles.cardShadow}>
            <Animated.View entering={listItemEntering(index)}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`${item.name} organizer details`}
                accessibilityHint="Opens organizer details"
                style={styles.card}
                onPress={() => navigation.navigate('OrganizerDetail', { organizerId: item.id })}
                activeOpacity={0.75}
              >
                <View style={[styles.avatar, { backgroundColor: `${accentPalette.main}22`, borderColor: `${accentPalette.main}55` }]}>
                  <Text style={[styles.avatarText, { color: accentPalette.textAccent }]}>{initials(item.name)}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
                  <View style={styles.cardMetaRow}>
                    <Text style={styles.cardMeta}>
                      {item.contact_type === 'one_time' ? 'One-time' : 'Regular'}
                    </Text>
                    {item.contact_type === 'regular' && item.per_class_rate > 0 ? (
                      <Text style={styles.cardRate}>
                        {formatCurrency(item.per_class_rate)}/session
                      </Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      />
      <GradientFAB
        icon="plus"
        style={[styles.fab, { bottom: Layout.FAB_BOTTOM + insets.bottom }]}
        onPress={() => navigation.navigate('AddEditOrganizer', {})}
      />

    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  searchbar: { margin: Spacing.md, borderRadius: Radius.lg, elevation: 0, borderWidth: 1, borderColor: colors.border },
  filters: { marginHorizontal: Spacing.md, marginBottom: Spacing.md },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Layout.LIST_PAD_WITH_FAB },
  cardShadow: {
    ...Elevation.interactive,
    backgroundColor: colors.surface,
    borderRadius: Radius.card,
    marginBottom: Spacing.sm,
    shadowColor: colors.shadow,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...Typography.bodyLg, fontWeight: '700', color: colors.textPrimary },
  cardContent: { flex: 1, gap: Spacing.xs },
  cardTitle: { ...Typography.h4, color: colors.textPrimary },
  cardMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  cardMeta: { ...Typography.bodySm, color: colors.textSecondary },
  cardRate: { ...Typography.bodySm, color: colors.textSecondary, flexShrink: 0 },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
