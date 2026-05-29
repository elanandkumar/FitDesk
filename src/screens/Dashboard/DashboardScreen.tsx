import React, { useCallback, useLayoutEffect, useState } from 'react';
import { SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { IconButton, Text } from 'react-native-paper';
import GradientFAB from '../../components/common/GradientFAB';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme, Brand, Radius, Spacing, Typography } from '../../theme';
import { Layout } from '../../theme/brandColors';
import { EnrichedSession } from '../../types';
import {
  getEnrichedSessionsByDateRange,
} from '../../database/repositories/classSessionRepository';
import { extendActiveSeriesSessions } from '../../database/repositories/classSeriesRepository';
import { getWeekEarningsSplit } from '../../database/repositories/paymentRepository';
import { getDatabase } from '../../database/db';
import { formatDisplayTime, todayISO, addDays } from '../../utils/dateUtils';
import { RootStackParamList } from '../../navigation/types';
import StatusBadge, { getDisplayStatus } from '../../components/common/StatusBadge';
import EmptyState from '../../components/common/EmptyState';
import HelpSheet from '../../components/common/HelpSheet';
import HeroCard from '../../components/common/HeroCard';
import EarningsCard from '../../components/common/EarningsCard';

const HELP =
  'Sessions for the next 7 days. Tap a session to mark complete or skip. Use the + button to add a one-off session. Tap the chart icon for income reports.';

type Nav = StackNavigationProp<RootStackParamList>;

type Section = { title: string; data: EnrichedSession[] };

function sectionTitle(isoDate: string, todayStr: string): string {
  if (isoDate === todayStr) return 'Today';
  if (isoDate === addDays(todayStr, 1)) return 'Tomorrow';
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
}

export default function DashboardScreen() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [helpVisible, setHelpVisible] = useState(false);
  const [weekEarnings, setWeekEarnings] = useState<{ pending: number; paid: number }>({ pending: 0, paid: 0 });
  const [trainerName, setTrainerName] = useState<string | undefined>(undefined);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <IconButton icon="chart-bar" iconColor={theme.colors.primary} onPress={() => navigation.navigate('IncomeSummary')} />
          <IconButton icon="help-circle-outline" iconColor={theme.colors.primary} onPress={() => setHelpVisible(true)} />
        </View>
      ),
    });
  }, [navigation, theme.colors.primary]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const db = await getDatabase();
      const nameRow = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'trainer_name'"
      );
      setTrainerName(nameRow?.value || undefined);

      await extendActiveSeriesSessions();
      const today = todayISO();
      const end = addDays(today, 6);
      const weekStart = addDays(today, -6);

      const [upcomingSessions, earningsSplit] = await Promise.all([
        getEnrichedSessionsByDateRange(today, end),
        getWeekEarningsSplit(weekStart, today),
      ]);

      const map = new Map<string, EnrichedSession[]>();
      for (const s of upcomingSessions) {
        const existing = map.get(s.session_date) ?? [];
        existing.push(s);
        map.set(s.session_date, existing);
      }

      const result: Section[] = [];
      for (const [date, data] of map.entries()) {
        result.push({ title: sectionTitle(date, today), data });
      }
      setSections(result);
      setWeekEarnings(earningsSplit);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const todayCount = sections[0]?.title === 'Today'
    ? sections[0].data.filter(s => s.status !== 'skipped').length
    : 0;
  const weekTotal = sections.reduce((acc, s) => acc + s.data.length, 0);

  return (
    <Animated.View entering={FadeIn.duration(350)} style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <>
            <HeroCard todayCount={todayCount} weekTotal={weekTotal} trainerName={trainerName} />
            <EarningsCard pending={weekEarnings.pending} paid={weekEarnings.paid} />
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="No upcoming sessions"
              subtitle="Tap + to add a session"
            />
          ) : null
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionAccent} />
            <Text
              variant="titleSmall"
              numberOfLines={1}
              style={[styles.sectionHeaderText, { color: theme.colors.onSurface }]}
            >
              {section.title}
            </Text>
            <Text style={styles.sectionCount}>
              {section.data.length} {section.data.length === 1 ? 'session' : 'sessions'}
            </Text>
          </View>
        )}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 55).duration(350)}>
          <TouchableOpacity
            onPress={() => navigation.navigate('ClassSessionDetail', { sessionId: item.id })}
            style={styles.sessionCard}
            activeOpacity={0.75}
          >
            <View style={[styles.colorBar, { backgroundColor: item.class_type_color }]} />
            <View style={styles.sessionInfo}>
              <Text variant="titleSmall" style={{ color: Brand.textPrimary }}>
                {item.series_title}
              </Text>
              <Text variant="bodySmall" style={{ color: Brand.textSecondary }}>
                {formatDisplayTime(item.class_time)} · {item.class_type_name} · {item.duration_minutes} min
              </Text>
              {item.location && (
                <Text variant="bodySmall" style={{ color: Brand.textMuted }}>
                  {item.location}
                </Text>
              )}
            </View>
            <StatusBadge status={getDisplayStatus(item.status, item.session_date, item.class_time)} />
          </TouchableOpacity>
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        SectionSeparatorComponent={() => <View style={{ height: 4 }} />}
      />

      <GradientFAB
        icon="plus"
        style={[styles.fab, { bottom: Layout.FAB_BOTTOM + insets.bottom }]}
        onPress={() => navigation.navigate('AddSession', {})}
      />

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { flexGrow: 1, paddingBottom: Layout.LIST_PAD_WITH_FAB },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  sectionAccent: {
    width: 4,
    height: 16,
    borderRadius: Radius.xs,
    backgroundColor: Brand.orange,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionCount: {
    ...Typography.bodySm,
    color: Brand.textMuted,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingRight: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    elevation: 4,
    shadowColor: Brand.purple,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  colorBar: { width: 4, alignSelf: 'stretch', borderRadius: Radius.xs, marginLeft: Spacing.sm },
  sessionInfo: { flex: 1, gap: 0 },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
