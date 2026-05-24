import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { IconButton, Searchbar, Text } from 'react-native-paper';
import GradientFAB from '../../components/common/GradientFAB';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialTopTabNavigationProp } from '@react-navigation/material-top-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Brand, Layout, Radius } from '../../theme/brandColors';
import { Manager } from '../../types';
import { getAllManagers } from '../../database/repositories/managerRepository';
import { getManagerOutstandingBalance } from '../../database/repositories/paymentRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import EmptyState from '../../components/common/EmptyState';
import { RootStackParamList, PeopleTabParamList } from '../../navigation/types';
import HelpSheet from '../../components/common/HelpSheet';

const HELP =
  'Add managers who assign you classes. Outstanding balance (in orange) shows total unpaid sessions. Tap a manager to see their payment history.';

type Nav = CompositeNavigationProp<
  MaterialTopTabNavigationProp<PeopleTabParamList, 'Managers'>,
  StackNavigationProp<RootStackParamList>
>;

interface ManagerWithBalance extends Manager {
  outstanding: number;
}

function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export default function ManagerListScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
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
    <Animated.View entering={FadeIn.duration(350)} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Searchbar
        placeholder="Search managers"
        value={query}
        onChangeText={setQuery}
        style={[styles.searchbar, { backgroundColor: Brand.surfaceDark }]}
        inputStyle={{ color: Brand.textPrimary }}
        iconColor={Brand.textMuted}
        placeholderTextColor={Brand.textMuted}
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
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials(item.name)}</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardSub}>{formatCurrency(item.per_class_rate)}/class</Text>
            </View>
            {item.outstanding > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{formatCurrency(item.outstanding)}</Text>
              </View>
            )}
            <MaterialCommunityIcons name="chevron-right" size={20} color={Brand.textMuted} />
          </TouchableOpacity>
          </Animated.View>
        )}
      />
      <GradientFAB
        icon="plus"
        style={[styles.fab, { bottom: Layout.FAB_BOTTOM + insets.bottom }]}
        onPress={() => navigation.navigate('AddEditManager', {})}
      />

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchbar: { margin: 12, borderRadius: Radius.lg, elevation: 0 },
  listContent: { paddingHorizontal: 12, paddingBottom: Layout.LIST_PAD_WITH_FAB },
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
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    backgroundColor: Brand.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Brand.textPrimary, fontWeight: '700', fontSize: 16 },
  cardContent: { flex: 1 },
  cardTitle: { color: Brand.textPrimary, fontSize: 15, fontWeight: '600' },
  cardSub: { color: Brand.textSecondary, fontSize: 13, marginTop: 2 },
  badge: {
    backgroundColor: `${Brand.orange}33`,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: Brand.orange, fontSize: 12, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 16,
  },
});
