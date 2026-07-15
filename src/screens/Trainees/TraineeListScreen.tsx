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
import { AppThemeColors, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { Trainee } from '../../types';
import { getAllTrainees } from '../../database/repositories/traineeRepository';
import EmptyState from '../../components/common/EmptyState';
import { RootStackParamList } from '../../navigation/types';
import { listItemEntering } from '../../animations/listItemEntering';

type Nav = StackNavigationProp<RootStackParamList>;

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function TraineeListScreen() {
  const { accentPalette, colors, theme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [loading, setLoading] = useState(true);
  const [animationCycle, setAnimationCycle] = useState(0);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTrainees(await getAllTrainees());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setAnimationCycle((cycle) => cycle + 1);
    load();
  }, [load]));

  const filtered = useMemo(() => {
    if (!query.trim()) return trainees;
    const q = query.toLowerCase();
    return trainees.filter((t) => t.name.toLowerCase().includes(q));
  }, [trainees, query]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppSearchbar
        placeholder="Search trainees"
        value={query}
        onChangeText={setQuery}
        style={[styles.searchbar, { backgroundColor: colors.surface }]}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => `${animationCycle}-${item.id}`}
        contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={query ? 'No matches' : 'No trainees'}
              subtitle={query ? 'Try a different search' : 'Tap + to add a trainee'}
            />
          ) : null
        }
        renderItem={({ item, index }) => (
          <View style={styles.cardShadow}>
            <Animated.View entering={listItemEntering(index)}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`${item.name} trainee details`}
                accessibilityHint="Opens trainee details"
                style={styles.card}
                onPress={() => navigation.navigate('TraineeDetail', { traineeId: item.id })}
                activeOpacity={0.75}
              >
                <View style={[styles.avatar, { backgroundColor: `${accentPalette.main}22`, borderColor: `${accentPalette.main}55` }]}>
                  <Text style={[styles.avatarText, { color: accentPalette.textAccent }]}>{initials(item.name)}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  {(item.phone || item.email) && (
                    <Text style={styles.cardSub} numberOfLines={1}>
                      {item.phone ?? item.email}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        )}
      />
      <GradientFAB
        icon="plus"
        style={[styles.fab, { bottom: Layout.FAB_BOTTOM + insets.bottom }]}
        onPress={() => navigation.navigate('AddEditTrainee', {})}
      />

    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  searchbar: { margin: Spacing.md, borderRadius: Radius.lg, elevation: 0, borderWidth: 1, borderColor: colors.border },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Layout.LIST_PAD_WITH_FAB },
  cardShadow: {
    backgroundColor: colors.surface,
    borderRadius: Radius.item,
    marginBottom: Spacing.sm,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: Spacing.lg,
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
  cardContent: { flex: 1 },
  cardTitle: { ...Typography.h4, color: colors.textPrimary },
  cardSub: { ...Typography.labelMd, fontFamily: 'Outfit_400Regular', color: colors.textSecondary, marginTop: 0 },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
