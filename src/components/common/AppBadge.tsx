import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { BadgeTone, getBadgeTones, Radius, Spacing, Typography, useAppTheme } from '../../theme';
import { withAlpha } from '../../utils/colorUtils';

interface Props {
  label: string;
  tone?: BadgeTone;
  accentColor?: string;
  tintAccent?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function AppBadge({ label, tone = 'neutral', accentColor, tintAccent = false, style }: Props) {
  const { colors: themeColors, resolvedThemeMode } = useAppTheme();
  const toneColors = getBadgeTones(resolvedThemeMode)[tone];
  const backgroundColor = tintAccent && accentColor
    ? withAlpha(accentColor, resolvedThemeMode === 'dark' ? 0.24 : 0.12)
    : toneColors.background;
  const textColor = tintAccent && accentColor ? themeColors.textPrimary : toneColors.text;

  return (
    <View style={[styles.badge, { backgroundColor }, style]}>
      {accentColor && <View style={[styles.dot, { backgroundColor: accentColor }]} />}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: Radius.default,
    flexDirection: 'row',
    gap: Spacing.xs,
    maxWidth: '100%',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  dot: {
    borderRadius: Radius.full,
    height: 7,
    width: 7,
  },
  label: {
    ...Typography.microLabel,
    flexShrink: 1,
  },
});
