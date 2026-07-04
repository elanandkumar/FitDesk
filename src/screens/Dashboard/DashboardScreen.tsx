import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Pressable, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';
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
import { getUnreadCount } from '../../database/repositories/appNotificationRepository';
import { formatDisplayTime, todayISO, addDays } from '../../utils/dateUtils';
import { withAlpha } from '../../utils/colorUtils';
import { RootStackParamList } from '../../navigation/types';
import StatusBadge, { getDisplayStatus } from '../../components/common/StatusBadge';
import { useBackup } from '../../context/BackupContext';
import EmptyState from '../../components/common/EmptyState';
import HelpSheet from '../../components/common/HelpSheet';
import HeroCard from '../../components/common/HeroCard';
import EarningsCard from '../../components/common/EarningsCard';
import { HELP } from '../../constants/helpContent';

type Nav = StackNavigationProp<RootStackParamList>;

type Section = { title: string; data: EnrichedSession[] };

function traineeLabel(names?: string): string | null {
  if (!names) return null;
  const parts = names.split(', ');
  if (parts.length === 1) return parts[0];
  return `${parts[0]} +${parts.length - 1}`;
}

function sectionTitle(isoDate: string, todayStr: string): string {
  if (isoDate === todayStr) return 'Today';
  if (isoDate === addDays(todayStr, 1)) return 'Tomorrow';
  const d = new Date(isoDate + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' });
}

export default function DashboardScreen() {
  const { accentPalette, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { isBackupOverdue } = useBackup();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [helpVisible, setHelpVisible] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [weekEarnings, setWeekEarnings] = useState<{ pending: number; paid: number }>({ pending: 0, paid: 0 });
  const [trainerName, setTrainerName] = useState<string | undefined>(undefined);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <IconButton icon="chart-bar" iconColor={accentPalette.textAccent} onPress={() => navigation.navigate('IncomeSummary')} />
          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            style={styles.bellWrap}
            hitSlop={8}
          >
            <IconButton icon="bell-outline" iconColor={accentPalette.textAccent} style={{ margin: 0 }} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <IconButton icon="help-circle-outline" iconColor={accentPalette.textAccent} onPress={() => setHelpVisible(true)} />
        </View>
      ),
    });
  }, [accentPalette.textAccent, navigation, unreadCount]);

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

  const refreshUnread = useCallback(async () => {
    setUnreadCount(await getUnreadCount());
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    refreshUnread();
  }, [load, refreshUnread]));

  // Re-fetch after BackupContext finishes inserting its notification
  useEffect(() => { refreshUnread(); }, [isBackupOverdue, refreshUnread]);

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
            {isBackupOverdue && (
              <Pressable
                style={styles.backupBanner}
                onPress={() => navigation.navigate('DataScreen')}
              >
                <Text variant="bodySmall" style={styles.backupBannerText}>
                  ⚠ Data not backed up in 7+ days
                </Text>
                <View style={styles.backupBannerBtn}>
                  <Text style={styles.backupBannerBtnText}>Backup Now</Text>
                </View>
              </Pressable>
            )}
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
            style={[
              styles.sessionCard,
              { borderLeftColor: withAlpha(item.class_type_color, 0.7), shadowColor: accentPalette.main },
            ]}
            activeOpacity={0.75}
          >
            <View style={styles.sessionInfo}>
              <Text variant="titleSmall" style={{ color: Brand.textPrimary }}>
                {item.series_title}
              </Text>
              <Text variant="bodySmall" style={{ color: Brand.textSecondary }}>
                {formatDisplayTime(item.class_time)} · {item.class_type_name} · {item.duration_minutes} min
              </Text>
              {item.source_type === 'personal' && traineeLabel(item.trainee_names) && (
                <Text variant="bodySmall" style={{ color: accentPalette.textAccent }}>
                  {traineeLabel(item.trainee_names)}
                </Text>
              )}
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

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP.dashboard} />
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
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    gap: Spacing.md,
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    borderLeftWidth: 4,
    elevation: 4,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  bellWrap: {
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Brand.orange,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Brand.backgroundDark,
  },
  bellBadgeText: {
    color: Brand.backgroundDark,
    fontSize: 9,
    fontFamily: 'Montserrat_600SemiBold',
    lineHeight: 12,
  },
  backupBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Brand.orange + '18',
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: Brand.orange + '60',
    gap: Spacing.sm,
  },
  backupBannerText: {
    flex: 1,
    color: Brand.orange,
  },
  backupBannerBtn: {
    borderWidth: 1,
    borderColor: Brand.orange,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    flexShrink: 0,
  },
  backupBannerBtnText: {
    color: Brand.orange,
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
  },
  sessionInfo: { flex: 1, gap: 0 },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
