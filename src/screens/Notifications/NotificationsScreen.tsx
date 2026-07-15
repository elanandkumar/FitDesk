import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAppTheme } from '../../theme';
import { AppThemeColors, BrandCore, Radius, Spacing, Typography } from '../../theme/brandColors';
import { AppNotification } from '../../types';
import {
  getRecentNotifications,
  markAllRead,
} from '../../database/repositories/appNotificationRepository';
import EmptyState from '../../components/common/EmptyState';
import AppIcon, { AppIconName } from '../../components/common/AppIcon';

const TYPE_CONFIG: Record<string, { icon: AppIconName; color?: string; useAccent?: boolean }> = {
  backup_overdue:   { icon: 'database',       color: BrandCore.orange },
  payment_pending:  { icon: 'currencyInr',    useAccent: true },
  payment_reminder: { icon: 'handCoins',      useAccent: true },
  payment_overdue:  { icon: 'warningCircle',  color: BrandCore.orange },
  payment_urgent:   { icon: 'warningOctagon', color: '#FF5252' },
};

function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return diffMin <= 1 ? 'Just now' : `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function NotificationItem({ item, index }: { item: AppNotification; index: number }) {
  const { accentPalette, colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const config = TYPE_CONFIG[item.type] ?? { icon: 'bell', useAccent: true };
  const color = config.useAccent ? accentPalette.main : config.color ?? accentPalette.main;
  const isUnread = !item.read_at;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(300)}>
      <View style={[styles.item, isUnread && styles.itemUnread]}>
        <View style={styles.iconWrap}>
          <AppIcon name={config.icon} size={20} color={color} />
        </View>
        <View style={styles.itemBody}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            {isUnread && <View style={[styles.unreadDot, { backgroundColor: color }]} />}
          </View>
          <Text style={styles.itemBodyText} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.itemTime}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const markTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    async function load() {
      setLoading(true);
      const items = await getRecentNotifications();
      setNotifications(items);
      setLoading(false);
    }
    load();

    markTimer.current = setTimeout(async () => {
      await markAllRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
      );
    }, 1500);

    return () => {
      if (markTimer.current) clearTimeout(markTimer.current);
    };
  }, []));

  return (
    <View style={styles.container}>
      <FlatList
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => <NotificationItem item={item} index={index} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          !loading ? (
            <EmptyState
              title="No notifications"
              subtitle="Payment reminders and backup alerts appear here"
            />
          ) : null
        }
      />
    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { flexGrow: 1, padding: Spacing.lg, gap: Spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: colors.surface,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.md,
  },
  itemUnread: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  iconWrap: {
    width: 24,
    paddingTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemBody: { flex: 1, gap: 2 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  itemTitle: {
    ...Typography.h4,
    color: colors.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  itemBodyText: { ...Typography.bodySm, color: colors.textSecondary },
  itemTime: { ...Typography.labelMd, fontFamily: 'Outfit_400Regular', color: colors.textMuted, marginTop: 2 },
  separator: { height: Spacing.xs },
});
