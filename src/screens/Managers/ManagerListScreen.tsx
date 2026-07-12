import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Text } from 'react-native-paper';
import AppSearchbar from '../../components/common/AppSearchbar';
import GradientFAB from '../../components/common/GradientFAB';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { Brand, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { Manager } from '../../types';
import { getAllManagers } from '../../database/repositories/managerRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import EmptyState from '../../components/common/EmptyState';
import AppIcon from '../../components/common/AppIcon';
import { RootStackParamList } from '../../navigation/types';

type Nav = StackNavigationProp<RootStackParamList>;

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function ManagerListScreen() {
  const { accentPalette, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setManagers(await getAllManagers());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    if (!query.trim()) return managers;
    const q = query.toLowerCase();
    return managers.filter((m) => m.name.toLowerCase().includes(q));
  }, [managers, query]);

  return (
    <Animated.View entering={FadeIn.duration(350)} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <AppSearchbar
        placeholder="Search managers"
        value={query}
        onChangeText={setQuery}
        style={[styles.searchbar, { backgroundColor: Brand.surfaceDark }]}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title={query ? 'No matches' : 'No managers'}
              subtitle={query ? 'Try a different search' : 'Tap + to add a manager'}
            />
          ) : null
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 60).duration(350)}>
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ManagerDetail', { managerId: item.id })}
            activeOpacity={0.75}
          >
            <View style={[styles.avatar, { backgroundColor: `${accentPalette.main}22`, borderColor: `${accentPalette.main}55` }]}>
              <Text style={[styles.avatarText, { color: accentPalette.textAccent }]}>{initials(item.name)}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
            </View>
            <Text style={styles.cardRate}>{formatCurrency(item.per_class_rate)}/class</Text>
            <AppIcon name="caretRight" size={20} color={Brand.textMuted} />
          </TouchableOpacity>
          </Animated.View>
        )}
      />
      <GradientFAB
        icon="plus"
        style={[styles.fab, { bottom: Layout.FAB_BOTTOM + insets.bottom }]}
        onPress={() => navigation.navigate('AddEditManager', {})}
      />

    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchbar: { margin: Spacing.md, borderRadius: Radius.lg, elevation: 0, borderWidth: 1, borderColor: Brand.borderSubtle },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: Layout.LIST_PAD_WITH_FAB },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    elevation: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Brand.surfaceElevated,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...Typography.bodyLg, fontWeight: '700', color: Brand.textPrimary },
  cardContent: { flex: 1 },
  cardTitle: { ...Typography.h4, color: Brand.textPrimary },
  cardRate: { ...Typography.labelMd, fontFamily: 'Outfit_400Regular', color: Brand.textSecondary },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
