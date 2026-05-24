import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton, SegmentedButtons, Switch, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { useAppTheme } from '../../theme';
import { Brand, Radius } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { getDatabase } from '../../database/db';
import { scheduleUpcomingNotifications, schedulePendingPaymentNotification } from '../../notifications/scheduler';
import { requestNotificationPermission } from '../../notifications/permissions';
import HelpSheet from '../../components/common/HelpSheet';

const isExpoGo = Constants.appOwnership === 'expo';

const HELP =
  'Configure notification reminders, manage class types, and export/import your data. Export regularly to keep a backup — data is stored locally only.';

type Nav = StackNavigationProp<RootStackParamList>;

const MINUTES_OPTIONS = [
  { value: '15', label: '15 mins' },
  { value: '30', label: '30 mins' },
  { value: '60', label: '1 hr' },
];

async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE settings SET value = ? WHERE key = ?', [value, key]);
}

function SectionHeader({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

interface NavRowProps {
  icon: string;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}

function NavRow({ icon, label, onPress, isLast }: NavRowProps) {
  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.rowIcon}>
          <MaterialCommunityIcons name={icon as never} size={20} color={Brand.purple} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
        <MaterialCommunityIcons name="chevron-right" size={20} color={Brand.textMuted} />
      </TouchableOpacity>
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

export default function SettingsScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [minutesBefore, setMinutesBefore] = useState('60');
  const [paymentNotifEnabled, setPaymentNotifEnabled] = useState(true);
  const [helpVisible, setHelpVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton icon="help-circle-outline" iconColor={theme.colors.primary} onPress={() => setHelpVisible(true)} />
      ),
    });
  }, [navigation, theme.colors.primary]);

  useFocusEffect(
    useCallback(() => {
      async function loadSettings() {
        const enabled = await getSetting('notification_enabled');
        const mins = await getSetting('notification_minutes_before');
        const paymentEnabled = await getSetting('payment_notification_enabled');
        setNotifEnabled(enabled !== 'false');
        setMinutesBefore(mins ?? '60');
        setPaymentNotifEnabled(paymentEnabled !== 'false');
      }
      loadSettings();
    }, [])
  );

  const handleToggleNotifications = async (val: boolean) => {
    setNotifEnabled(val);
    await setSetting('notification_enabled', val ? 'true' : 'false');
    if (!isExpoGo) {
      if (val) {
        const granted = await requestNotificationPermission();
        if (granted) {
          await scheduleUpcomingNotifications();
          await schedulePendingPaymentNotification();
        }
      } else {
        await scheduleUpcomingNotifications();
        await schedulePendingPaymentNotification();
      }
    }
  };

  const handleMinutesChange = async (val: string) => {
    setMinutesBefore(val);
    await setSetting('notification_minutes_before', val);
    if (notifEnabled && !isExpoGo) {
      await scheduleUpcomingNotifications();
      await schedulePendingPaymentNotification();
    }
  };

  const handleTogglePaymentNotifications = async (val: boolean) => {
    setPaymentNotifEnabled(val);
    await setSetting('payment_notification_enabled', val ? 'true' : 'false');
    if (!isExpoGo) {
      if (val) {
        const granted = await requestNotificationPermission();
        if (granted) await schedulePendingPaymentNotification();
      } else {
        await schedulePendingPaymentNotification();
      }
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <SectionHeader label="Notifications" />
      <SettingsCard>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={Brand.purple} />
          </View>
          <Text style={[styles.rowLabel, { flex: 1 }]}>Enable Reminders</Text>
          <Switch
            value={notifEnabled}
            onValueChange={handleToggleNotifications}
            color={Brand.purple}
          />
        </View>
        {notifEnabled && (
          <>
            <View style={styles.divider} />
            <View style={styles.minutesRow}>
              <Text style={styles.minutesLabel}>Remind me before class</Text>
              <SegmentedButtons
                value={minutesBefore}
                onValueChange={handleMinutesChange}
                buttons={MINUTES_OPTIONS}
                theme={{ colors: { secondaryContainer: Brand.purple, onSecondaryContainer: Brand.textPrimary } }}
              />
            </View>
          </>
        )}
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <MaterialCommunityIcons name="cash-clock" size={20} color={Brand.purple} />
          </View>
          <Text style={[styles.rowLabel, { flex: 1 }]}>Payment Reminders</Text>
          <Switch
            value={paymentNotifEnabled}
            onValueChange={handleTogglePaymentNotifications}
            color={Brand.purple}
          />
        </View>
      </SettingsCard>

      <SectionHeader label="Data & Reports" />
      <SettingsCard>
        <NavRow
          icon="chart-bar"
          label="Income Summary"
          onPress={() => navigation.navigate('IncomeSummary')}
        />
        <NavRow
          icon="tag-multiple"
          label="Class Types"
          onPress={() => navigation.navigate('ClassTypes')}
        />
        <NavRow
          icon="calendar-multiselect"
          label="Class Series"
          onPress={() => navigation.navigate('ClassSeriesList')}
        />
        <NavRow
          icon="database-export"
          label="Export / Import"
          onPress={() => navigation.navigate('DataScreen')}
          isLast
        />
      </SettingsCard>

      <View style={styles.about}>
        <Image
          source={require('../../../assets/logo-text.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.tagline}>Your fitness class companion</Text>
      </View>

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 96 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 20,
  },
  sectionAccent: {
    width: 3,
    height: 16,
    borderRadius: Radius.xs,
    backgroundColor: Brand.orange,
  },
  sectionLabel: {
    color: Brand.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: `${Brand.purple}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { color: Brand.textPrimary, fontSize: 15 },
  divider: { height: 1, backgroundColor: Brand.borderSubtle, marginHorizontal: 16 },
  minutesRow: { padding: 16, gap: 10 },
  minutesLabel: { color: Brand.textSecondary, fontSize: 13 },
  about: { alignItems: 'center', paddingTop: 36, paddingBottom: 16, gap: 6 },
  logoImage: {
    width: 120,
    height: 30,
    marginBottom: 4,
  },
  version: { color: Brand.textMuted, fontSize: 13 },
  tagline: { color: Brand.textMuted, fontSize: 12 },
});
