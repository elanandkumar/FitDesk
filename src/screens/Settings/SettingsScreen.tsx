import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAppTheme } from '../../theme';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { getDatabase } from '../../database/db';
import { scheduleUpcomingNotifications, schedulePendingPaymentNotification } from '../../notifications/scheduler';
import { requestNotificationPermission } from '../../notifications/permissions';
import HelpSheet from '../../components/common/HelpSheet';
import SectionHeader from '../../components/common/SectionHeader';
import GradientSwitch from '../../components/common/GradientSwitch';
import ThemedSegmentedButtons from '../../components/common/ThemedSegmentedButtons';
import ThemedTimePickerModal from '../../components/common/ThemedTimePickerModal';
import { formatDisplayTime } from '../../utils/dateUtils';
import { HELP } from '../../constants/helpContent';

const isExpoGo = Constants.appOwnership === 'expo';

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

function SettingsCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

interface NavRowProps {
  icon: string;
  label: string;
  onPress: () => void;
  iconColor?: string;
  isLast?: boolean;
}

function NavRow({ icon, label, onPress, iconColor = Brand.purple, isLast }: NavRowProps) {
  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.rowIcon}>
          <MaterialCommunityIcons name={icon as never} size={18} color={iconColor} />
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
  const [paymentNotifTime, setPaymentNotifTime] = useState('09:00');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton icon="help-circle-outline" iconColor={Brand.textAccent} onPress={() => setHelpVisible(true)} />
      ),
    });
  }, [navigation, theme.colors.primary]);

  useFocusEffect(
    useCallback(() => {
      async function loadSettings() {
        const enabled = await getSetting('notification_enabled');
        const mins = await getSetting('notification_minutes_before');
        const paymentEnabled = await getSetting('payment_notification_enabled');
        const paymentTime = await getSetting('payment_notification_time');
        setNotifEnabled(enabled !== 'false');
        setMinutesBefore(mins ?? '60');
        setPaymentNotifEnabled(paymentEnabled !== 'false');
        setPaymentNotifTime(paymentTime ?? '09:00');
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

  const handlePaymentTimeChange = async (time: string) => {
    setPaymentNotifTime(time);
    setTimePickerVisible(false);
    await setSetting('payment_notification_time', time);
    if (paymentNotifEnabled && !isExpoGo) {
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
            <MaterialCommunityIcons name="bell-outline" size={18} color={Brand.purple} />
          </View>
          <Text style={[styles.rowLabel, { flex: 1 }]}>Enable Reminders</Text>
          <GradientSwitch
            value={notifEnabled}
            onValueChange={handleToggleNotifications}
          />
        </View>
        {notifEnabled && (
          <>
            <View style={styles.divider} />
            <View style={styles.minutesRow}>
              <Text style={styles.minutesLabel}>Remind me before class</Text>
              <ThemedSegmentedButtons
                value={minutesBefore}
                onValueChange={handleMinutesChange}
                buttons={MINUTES_OPTIONS}
              />
            </View>
          </>
        )}
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <MaterialCommunityIcons name="cash-clock" size={18} color={Brand.pink} />
          </View>
          <Text style={[styles.rowLabel, { flex: 1 }]}>Payment Reminders</Text>
          <GradientSwitch
            value={paymentNotifEnabled}
            onValueChange={handleTogglePaymentNotifications}
          />
        </View>
        {paymentNotifEnabled && (
          <>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.row} onPress={() => setTimePickerVisible(true)} activeOpacity={0.7}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={Brand.orange} />
              </View>
              <Text style={[styles.rowLabel, { flex: 1 }]}>Reminder Time</Text>
              <Text style={styles.timeValue}>{formatDisplayTime(paymentNotifTime)}</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Brand.textMuted} />
            </TouchableOpacity>
          </>
        )}
      </SettingsCard>

      <ThemedTimePickerModal
        visible={timePickerVisible}
        value={paymentNotifTime}
        onConfirm={handlePaymentTimeChange}
        onDismiss={() => setTimePickerVisible(false)}
      />

      <SectionHeader label="Data" />
      <SettingsCard>
        <NavRow
          icon="tag-multiple"
          label="Class Types"
          iconColor={Brand.purple}
          onPress={() => navigation.navigate('ClassTypes')}
        />
        <NavRow
          icon="map-marker-multiple"
          label="Centers"
          iconColor={Brand.pink}
          onPress={() => navigation.navigate('Centers')}
        />
        <NavRow
          icon="database-export"
          label="Export / Import"
          iconColor={Brand.orange}
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

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP.settings} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 96 },
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { ...Typography.h4, color: Brand.textPrimary, flex: 1 },
  divider: { height: 1, backgroundColor: Brand.borderSubtle, marginHorizontal: Spacing.lg },
  minutesRow: { padding: Spacing.lg, gap: Spacing.sm },
  timeValue: { ...Typography.body, color: Brand.textAccent, marginRight: Spacing.xs },
  minutesLabel: { ...Typography.labelMd, fontFamily: 'Outfit_400Regular', color: Brand.textSecondary },
  about: { alignItems: 'center', paddingTop: Spacing.section, paddingBottom: Spacing.lg, gap: Spacing.xs },
  logoImage: {
    width: 120,
    height: 30,
    marginBottom: Spacing.xs,
  },
  version: { ...Typography.labelMd, fontFamily: 'Outfit_400Regular', color: Brand.textMuted },
  tagline: { ...Typography.bodySm, color: Brand.textMuted },
});
