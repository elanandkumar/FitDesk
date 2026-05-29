import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';

interface Props {
  label: string;
}

export default function SectionHeader({ label }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.accent} />
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
    backgroundColor: Brand.orange,
  },
  label: {
    ...Typography.labelMd,
    color: Brand.textPrimary + 'CC',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
