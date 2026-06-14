import React, { useCallback, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
import { AppNotification } from '../../types';
import {
  getRecentNotifications,
  markAllRead,
} from '../../database/repositories/appNotificationRepository';
import EmptyState from '../../components/common/EmptyState';

const TYPE_CONFIG: Record<string, { icon: string; color: string }> = {
  backup_overdue:   { icon: 'database-export',     color: Brand.orange },
  payment_pending:  { icon: 'currency-inr',         color: Brand.purple },
  payment_reminder: { icon: 'cash-clock',            color: Brand.purple },
  payment_overdue:  { icon: 'alert-circle-outline',  color: Brand.orange },
  payment_urgent:   { icon: 'alert-octagon-outline', color: Brand.pink },
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
  const config = TYPE_CONFIG[item.type] ?? { icon: 'bell', color: Brand.purple };
  const isUnread = !item.read_at;

  return (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).duration(300)}>
      <View style={[styles.item, isUnread && styles.itemUnread]}>
        <View style={[styles.iconWrap, { backgroundColor: config.color + '22' }]}>
          <MaterialCommunityIcons name={config.icon as never} size={20} color={config.color} />
        </View>
        <View style={styles.itemBody}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            {isUnread && <View style={[styles.unreadDot, { backgroundColor: config.color }]} />}
          </View>
          <Text style={styles.itemBodyText} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.itemTime}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  list: { flexGrow: 1, padding: Spacing.lg, gap: Spacing.xs },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    padding: Spacing.md,
  },
  itemUnread: {
    borderColor: Brand.borderSubtle,
    backgroundColor: Brand.surfaceDark + 'EE',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  itemBody: { flex: 1, gap: 2 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  itemTitle: {
    ...Typography.h4,
    color: Brand.textPrimary,
    flex: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
  },
  itemBodyText: { ...Typography.bodySm, color: Brand.textSecondary },
  itemTime: { ...Typography.labelMd, fontFamily: 'Outfit_400Regular', color: Brand.textMuted, marginTop: 2 },
  separator: { height: Spacing.xs },
});
