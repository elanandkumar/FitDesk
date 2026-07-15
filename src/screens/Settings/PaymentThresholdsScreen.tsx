import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useFocusEffect } from '@react-navigation/native';
import { useAppTheme } from '../../theme';
import { AppThemeColors, Radius, Spacing, Typography } from '../../theme/brandColors';
import AppIcon, { AppIconName } from '../../components/common/AppIcon';
import { getDatabase } from '../../database/db';
import { schedulePendingPaymentNotification } from '../../notifications/scheduler';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

async function getSetting(key: string): Promise<string> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? '';
}

async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE settings SET value = ? WHERE key = ?', [value, key]);
}

interface TierRowProps {
  icon: AppIconName;
  iconColor: string;
  activeColor: string;
  label: string;
  sublabel: string;
  value: string;
  onChangeText: (v: string) => void;
  onBlur: () => void;
}

function TierRow({ icon, iconColor, activeColor, label, sublabel, value, onChangeText, onBlur }: TierRowProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.tierRow}>
      <View style={styles.tierIcon}>
        <AppIcon name={icon} size={18} color={iconColor} />
      </View>
      <View style={styles.tierBody}>
        <Text style={styles.tierLabel}>{label}</Text>
        <Text style={styles.tierSub}>{sublabel}</Text>
      </View>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onBlur={onBlur}
          keyboardType="numeric"
          mode="outlined"
          dense
          style={styles.input}
          contentStyle={styles.inputContent}
          outlineColor={colors.border}
          activeOutlineColor={activeColor}
          cursorColor={activeColor}
          selectionColor={`${activeColor}55`}
          textColor={colors.textPrimary}
          theme={{
            colors: {
              background: colors.surfaceRaised,
              primary: activeColor,
              onSurfaceVariant: colors.textMuted,
            },
          }}
          maxLength={2}
          selectTextOnFocus
        />
        <Text style={styles.daysLabel}>days</Text>
      </View>
    </View>
  );
}

export default function PaymentThresholdsScreen() {
  const { accentPalette, colors, theme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [reminder, setReminder] = useState('3');
  const [high, setHigh] = useState('10');
  const [urgent, setUrgent] = useState('15');

  useFocusEffect(useCallback(() => {
    async function load() {
      const [r, h, u] = await Promise.all([
        getSetting('payment_threshold_reminder'),
        getSetting('payment_threshold_high'),
        getSetting('payment_threshold_urgent'),
      ]);
      setReminder(r || '3');
      setHigh(h || '10');
      setUrgent(u || '15');
    }
    load();
  }, []));

  async function save(key: string, value: string, fallback: string) {
    const n = parseInt(value, 10);
    const safe = isNaN(n) || n < 1 ? fallback : String(n);
    await setSetting(key, safe);
    if (!isExpoGo) await schedulePendingPaymentNotification().catch(() => {});
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <Text style={styles.description}>
        Payments are bucketed by how long they have been pending since session completion.
        Set the day thresholds for each priority level.
      </Text>

      <View style={styles.card}>
        <TierRow
          icon="bellRinging"
          iconColor={accentPalette.textAccent}
          activeColor={accentPalette.main}
          label="Reminder"
          sublabel="Gentle nudge — collect soon"
          value={reminder}
          onChangeText={setReminder}
          onBlur={() => save('payment_threshold_reminder', reminder, '3')}
        />
        <View style={styles.divider} />
        <TierRow
          icon="clockAlert"
          iconColor={accentPalette.textAccent}
          activeColor={accentPalette.main}
          label="High Priority"
          sublabel="Overdue — follow up needed"
          value={high}
          onChangeText={setHigh}
          onBlur={() => save('payment_threshold_high', high, '10')}
        />
        <View style={styles.divider} />
        <TierRow
          icon="warningOctagon"
          iconColor={accentPalette.textAccent}
          activeColor={accentPalette.main}
          label="Urgent"
          sublabel="Significantly overdue"
          value={urgent}
          onChangeText={setUrgent}
          onBlur={() => save('payment_threshold_urgent', urgent, '15')}
        />
      </View>

      <Text style={styles.note}>
        Payments pending fewer than {reminder || '3'} days are in the grace period — no notification sent.
      </Text>
    </ScrollView>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md },
  description: { ...Typography.body, color: colors.textSecondary },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  tierIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tierBody: { flex: 1, gap: 2 },
  tierLabel: { ...Typography.h4, color: colors.textPrimary },
  tierSub: { ...Typography.bodySm, color: colors.textSecondary },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, alignSelf: 'center' },
  input: { width: 64, maxHeight: 44 },
  inputContent: { textAlign: 'center', paddingHorizontal: 0 },
  daysLabel: { ...Typography.bodySm, color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: Spacing.lg },
  note: { ...Typography.bodySm, color: colors.textMuted, textAlign: 'center' },
});
