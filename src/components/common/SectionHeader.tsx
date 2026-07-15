import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Radius, Spacing, Typography } from '../../theme/brandColors';
import { useAppTheme } from '../../theme';
import { withAlpha } from '../../utils/colorUtils';

interface Props {
  label: string;
}

export default function SectionHeader({ label }: Props) {
  const { accentPalette, colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.accent, { backgroundColor: accentPalette.main }]} />
      <Text style={[styles.label, { color: withAlpha(colors.textPrimary, 0.8) }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
  },
  accent: {
    width: 3,
    height: 14,
    borderRadius: Radius.xs,
  },
  label: {
    ...Typography.labelMd,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
