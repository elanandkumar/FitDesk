import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import AppIcon from '../../components/common/AppIcon';
import { RELEASE_NOTES } from '../../constants/releases';
import { useAppTheme } from '../../theme';
import { AppThemeColors, Radius, Spacing, Typography } from '../../theme/brandColors';

export default function WhatsNewScreen() {
  const { accentPalette, colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {RELEASE_NOTES.map((release) => (
        <View key={release.version} style={styles.card}>
          <Text style={[styles.version, { color: accentPalette.textAccent }]}>Version {release.version}</Text>
          <Text style={styles.title}>{release.title}</Text>
          <View style={styles.changeList}>
            {release.changes.map((change) => (
              <View key={change} style={styles.changeRow}>
                <AppIcon name="check" size={16} color={accentPalette.textAccent} weight="bold" />
                <Text style={styles.changeText}>{change}</Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: Spacing.section },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.lg,
  },
  version: { ...Typography.labelMd, marginBottom: Spacing.xs },
  title: { ...Typography.h3, color: colors.textPrimary, marginBottom: Spacing.lg },
  changeList: { gap: Spacing.md },
  changeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  changeText: { ...Typography.body, color: colors.textSecondary, flex: 1 },
});
