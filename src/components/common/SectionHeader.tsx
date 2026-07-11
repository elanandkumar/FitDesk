import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
import { useAppTheme } from '../../theme';

interface Props {
  label: string;
}

export default function SectionHeader({ label }: Props) {
  const { accentPalette } = useAppTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.accent, { backgroundColor: accentPalette.main }]} />
      <Text style={styles.label}>{label}</Text>
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
    color: Brand.textPrimary + 'CC',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
