import React, { useCallback, useLayoutEffect, useState } from 'react';
import { useBackup } from '../../context/BackupContext';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IconButton, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { AccentKey, AccentPalettes, useAppTheme } from '../../theme';
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

const ACCENT_OPTIONS = Object.entries(AccentPalettes).map(([key, palette]) => ({
  key: key as AccentKey,
  palette,
}));

async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
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
  showDot?: boolean;
  subtitle?: string;
}

function NavRow({ icon, label, onPress, iconColor, isLast, showDot, subtitle }: NavRowProps) {
  const { accentPalette } = useAppTheme();
  const resolvedIconColor = iconColor ?? accentPalette.main;

  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.rowIcon}>
          <MaterialCommunityIcons name={icon as never} size={18} color={resolvedIconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{label}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
        {showDot && <View style={styles.rowDot} />}
        <MaterialCommunityIcons name="chevron-right" size={20} color={Brand.textMuted} />
      </TouchableOpacity>
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

export default function SettingsScreen() {
  const { accentKey, accentPalette, setAccentKey, theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const { isBackupOverdue } = useBackup();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [minutesBefore, setMinutesBefore] = useState('60');
  const [paymentNotifEnabled, setPaymentNotifEnabled] = useState(true);
  const [paymentNotifTime, setPaymentNotifTime] = useState('09:00');
  const [thresholdReminder, setThresholdReminder] = useState('3');
  const [thresholdHigh, setThresholdHigh] = useState('10');
  const [thresholdUrgent, setThresholdUrgent] = useState('15');
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton icon="help-circle-outline" iconColor={accentPalette.textAccent} onPress={() => setHelpVisible(true)} />
      ),
    });
  }, [accentPalette.textAccent, navigation, theme.colors.primary]);

  useFocusEffect(
    useCallback(() => {
      async function loadSettings() {
        const enabled = await getSetting('notification_enabled');
        const mins = await getSetting('notification_minutes_before');
        const paymentEnabled = await getSetting('payment_notification_enabled');
        const paymentTime = await getSetting('payment_notification_time');
        const tReminder = await getSetting('payment_threshold_reminder');
        const tHigh = await getSetting('payment_threshold_high');
        const tUrgent = await getSetting('payment_threshold_urgent');
        setNotifEnabled(enabled !== 'false');
        setMinutesBefore(mins ?? '60');
        setPaymentNotifEnabled(paymentEnabled !== 'false');
        setPaymentNotifTime(paymentTime ?? '09:00');
        setThresholdReminder(tReminder || '3');
        setThresholdHigh(tHigh || '10');
        setThresholdUrgent(tUrgent || '15');
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
      <SectionHeader label="Appearance" />
      <SettingsCard>
        <View style={styles.appearanceRow}>
          <View style={styles.appearanceCopy}>
            <Text style={styles.rowLabel}>Accent Color</Text>
            <Text style={styles.rowSubtitle}>Applies to buttons, selected tabs, and highlights</Text>
          </View>
          <View style={styles.swatchRow}>
            {ACCENT_OPTIONS.map(({ key, palette }) => {
              const selected = accentKey === key;
              return (
                <TouchableOpacity
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={`${palette.label} accent`}
                  accessibilityState={{ selected }}
                  onPress={() => setAccentKey(key)}
                  style={[styles.swatchButton, selected && { borderColor: palette.textAccent }]}
                  activeOpacity={0.75}
                >
                  <LinearGradient
                    colors={[palette.main, palette.accent]}
                    start={{ x: 0, y: 1 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.swatch}
                  >
                    {selected && <MaterialCommunityIcons name="check" size={15} color={Brand.textPrimary} />}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SettingsCard>

      <SectionHeader label="Notifications" />
      <SettingsCard>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <MaterialCommunityIcons name="bell-outline" size={18} color={accentPalette.main} />
          </View>
          <Text style={[styles.rowLabel, { flex: 1 }]}>Class Reminders</Text>
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
              <Text style={[styles.timeValue, { color: accentPalette.textAccent }]}>
                {formatDisplayTime(paymentNotifTime)}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Brand.textMuted} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <NavRow
              icon="tune-vertical"
              label="Payment Overdue Alerts"
              subtitle={`Notify after ${thresholdReminder}, ${thresholdHigh} & ${thresholdUrgent} days`}
              iconColor={Brand.pink}
              onPress={() => navigation.navigate('PaymentThresholds')}
              isLast
            />
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
          iconColor={accentPalette.main}
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
          showDot={isBackupOverdue}
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
  appearanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  appearanceCopy: {
    flex: 1,
    minWidth: 0,
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  swatchButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
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
  rowLabel: { ...Typography.h4, color: Brand.textPrimary },
  rowSubtitle: { ...Typography.bodySm, color: Brand.textMuted, marginTop: 1 },
  rowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.orange,
    marginRight: Spacing.xs,
  },
  divider: { height: 1, backgroundColor: Brand.borderSubtle, marginHorizontal: Spacing.lg },
  minutesRow: { padding: Spacing.lg, gap: Spacing.sm },
  timeValue: { ...Typography.body, marginRight: Spacing.xs },
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
