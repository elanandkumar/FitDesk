import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { BadgeTone, BadgeTones, Radius, Spacing, Typography } from '../../theme';

interface Props {
  label: string;
  tone?: BadgeTone;
  accentColor?: string;
  style?: StyleProp<ViewStyle>;
}

export default function AppBadge({ label, tone = 'neutral', accentColor, style }: Props) {
  const colors = BadgeTones[tone];

  return (
    <View style={[styles.badge, { backgroundColor: colors.background }, style]}>
      {accentColor && <View style={[styles.dot, { backgroundColor: accentColor }]} />}
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.full,
    flexDirection: 'row',
    gap: Spacing.xs,
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  dot: {
    borderRadius: Radius.full,
    height: 7,
    width: 7,
  },
  label: {
    ...Typography.labelSm,
    flexShrink: 1,
  },
});
