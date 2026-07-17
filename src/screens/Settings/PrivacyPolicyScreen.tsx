import React, { useMemo } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import AppButton from '../../components/common/AppButton';
import { PRIVACY_POLICY_URL } from '../../constants';
import { useAppTheme } from '../../theme';
import { AppThemeColors, Radius, Spacing, Typography } from '../../theme/brandColors';

const SECTIONS = [
  {
    title: 'Local-first by design',
    body: 'The information you enter in FitDesk is stored in the app database on your device. FitDesk has no account system, advertising, or analytics.',
  },
  {
    title: 'Local notifications',
    body: 'If you allow notifications, FitDesk schedules class, payment, and backup reminders on your device. It does not use push notifications.',
  },
  {
    title: 'User-controlled backups',
    body: 'Exporting creates a backup file and opens Android’s share interface. You choose whether and where to store or share it. Importing reads only the backup file you select.',
  },
] as const;

export default function PrivacyPolicyScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.introCard}>
        <Text style={styles.introTitle}>Your data stays under your control</Text>
        <Text style={styles.body}>
          Here is a summary of how FitDesk handles your information. The published policy is the authoritative and most current version.
        </Text>
      </View>
      {SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.heading}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </View>
      ))}
      <AppButton
        label="View Full Privacy Policy"
        onPress={() => void Linking.openURL(PRIVACY_POLICY_URL)}
        variant="filled"
      />
      <Text style={styles.websiteNote}>Opens apps.elanandkumar.com in your browser</Text>
    </ScrollView>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, gap: Spacing.xl, paddingBottom: Spacing.section },
  introCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  introTitle: { ...Typography.h3, color: colors.textPrimary },
  section: { gap: Spacing.sm },
  heading: { ...Typography.h4, color: colors.textPrimary },
  body: { ...Typography.body, color: colors.textSecondary, lineHeight: 21 },
  websiteNote: { ...Typography.bodySm, color: colors.textMuted, textAlign: 'center' },
});
