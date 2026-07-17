import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { useBackup } from '../../context/BackupContext';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Constants from 'expo-constants';
import { AccentKey, AccentPalettes, ThemePreference, useAppTheme } from '../../theme';
import { AppThemeColors, BrandCore, Radius, Spacing, Typography } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { getDatabase } from '../../database/db';
import { scheduleUpcomingNotifications, schedulePendingPaymentNotification } from '../../notifications/scheduler';
import { requestNotificationPermission } from '../../notifications/permissions';
import HelpSheet from '../../components/common/HelpSheet';
import SectionHeader from '../../components/common/SectionHeader';
import GradientSwitch from '../../components/common/GradientSwitch';
import ThemedSegmentedButtons from '../../components/common/ThemedSegmentedButtons';
import ThemedTimePickerModal from '../../components/common/ThemedTimePickerModal';
import AppIcon, { AppIconName } from '../../components/common/AppIcon';
import AppIconButton from '../../components/common/AppIconButton';
import { formatDisplayTime } from '../../utils/dateUtils';
import { HELP } from '../../constants/helpContent';

const isExpoGo = Constants.appOwnership === 'expo';
const appVersion = Constants.nativeAppVersion ?? Constants.expoConfig?.version ?? null;
const versionLabel = appVersion ? `Version ${appVersion}` : 'Version unavailable';

type Nav = StackNavigationProp<RootStackParamList>;

const MINUTES_OPTIONS = [
  { value: '15', label: '15 mins' },
  { value: '30', label: '30 mins' },
  { value: '60', label: '1 hr' },
];

const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
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
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <View style={styles.card}>{children}</View>;
}

interface NavRowProps {
  icon: AppIconName;
  label: string;
  onPress: () => void;
  iconColor?: string;
  isLast?: boolean;
  showDot?: boolean;
  subtitle?: string;
}

function NavRow({ icon, label, onPress, iconColor, isLast, showDot, subtitle }: NavRowProps) {
  const { accentPalette, colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const resolvedIconColor = iconColor ?? accentPalette.main;

  return (
    <>
      <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
        <View style={styles.rowIcon}>
          <AppIcon name={icon} size={18} color={resolvedIconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>{label}</Text>
          {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
        </View>
        {showDot && <View style={styles.rowDot} />}
        <AppIcon name="caretRight" size={20} color={colors.textMuted} />
      </TouchableOpacity>
      {!isLast && <View style={styles.divider} />}
    </>
  );
}

export default function SettingsScreen() {
  const {
    accentKey,
    accentPalette,
    colors,
    setAccentKey,
    setThemePreference,
    theme,
    themePreference,
  } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        <AppIconButton icon="question" iconColor={accentPalette.textAccent} onPress={() => setHelpVisible(true)} />
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
      <SectionHeader label="Notifications" />
      <SettingsCard>
        <View style={styles.row}>
          <View style={styles.rowIcon}>
            <AppIcon name="bell" size={18} color={accentPalette.main} />
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
            <AppIcon name="handCoins" size={18} color={accentPalette.main} />
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
                <AppIcon name="clockAlert" size={18} color={accentPalette.main} />
              </View>
              <Text style={[styles.rowLabel, { flex: 1 }]}>Reminder Time</Text>
              <Text style={[styles.timeValue, { color: accentPalette.textAccent }]}>
                {formatDisplayTime(paymentNotifTime)}
              </Text>
              <AppIcon name="caretRight" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <View style={styles.divider} />
            <NavRow
              icon="sliders"
              label="Payment Overdue Alerts"
              subtitle={`Notify after ${thresholdReminder}, ${thresholdHigh} & ${thresholdUrgent} days`}
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
          icon="tag"
          label="Class Types"
          onPress={() => navigation.navigate('ClassTypes')}
        />
        <NavRow
          icon="mapPin"
          label="Centers"
          onPress={() => navigation.navigate('Centers')}
        />
        <NavRow
          icon="database"
          label="Export / Import"
          onPress={() => navigation.navigate('DataScreen')}
          showDot={isBackupOverdue}
          isLast
        />
      </SettingsCard>

      <SectionHeader label="Appearance" />
      <SettingsCard>
        <View style={styles.themePreferenceRow}>
          <Text style={styles.rowLabel}>Theme</Text>
          <Text style={styles.rowSubtitle}>Use your device appearance or choose a fixed theme</Text>
          <ThemedSegmentedButtons
            value={themePreference}
            onValueChange={(value) => setThemePreference(value as ThemePreference)}
            buttons={THEME_OPTIONS}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.appearanceRow}>
          <Text style={styles.rowLabel}>Accent Color</Text>
          <Text style={styles.rowSubtitle}>Applies to buttons, selected tabs, and highlights</Text>
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
                    {selected && <AppIcon name="check" size={15} color={theme.colors.onPrimary} weight="bold" />}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </SettingsCard>

      <SectionHeader label="About" />
      <SettingsCard>
        <NavRow
          icon="notePencil"
          label="What's New"
          onPress={() => navigation.navigate('WhatsNew')}
        />
        <NavRow
          icon="lock"
          label="Privacy Policy"
          onPress={() => navigation.navigate('PrivacyPolicy')}
          isLast
        />
      </SettingsCard>

      <View style={styles.about}>
        <Image
          source={require('../../../assets/logo-text.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={styles.version}>{versionLabel}</Text>
        <Text style={styles.tagline}>Your fitness class companion</Text>
      </View>

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP.settings} />
    </ScrollView>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 96 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  appearanceRow: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  themePreferenceRow: {
    padding: Spacing.lg,
    gap: Spacing.sm,
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
  rowLabel: { ...Typography.h4, color: colors.textPrimary },
  rowSubtitle: { ...Typography.bodySm, color: colors.textMuted, marginTop: 1 },
  rowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandCore.orange,
    marginRight: Spacing.xs,
  },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: Spacing.lg },
  minutesRow: { padding: Spacing.lg, gap: Spacing.sm },
  timeValue: { ...Typography.body, marginRight: Spacing.xs },
  minutesLabel: { ...Typography.labelMd, fontFamily: 'Outfit_400Regular', color: colors.textSecondary },
  about: { alignItems: 'center', paddingTop: Spacing.section, paddingBottom: Spacing.lg, gap: Spacing.xs },
  logoImage: {
    width: 120,
    height: 30,
    marginBottom: Spacing.xs,
  },
  version: { ...Typography.labelMd, fontFamily: 'Outfit_400Regular', color: colors.textMuted },
  tagline: { ...Typography.bodySm, color: colors.textMuted },
});
