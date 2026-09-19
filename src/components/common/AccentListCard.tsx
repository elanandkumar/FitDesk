import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Elevation, Radius, Spacing, useAppTheme } from '../../theme';
import { withAlpha } from '../../utils/colorUtils';

interface Props {
  accentColor: string;
  children: React.ReactNode;
  onPress?: () => void;
  muted?: boolean;
  showAccentRail?: boolean;
  dense?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function AccentListCard({
  accentColor,
  children,
  onPress,
  muted = false,
  showAccentRail = true,
  dense = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const { colors } = useAppTheme();
  const cardStyle = [
    styles.card,
    {
      borderColor: colors.border,
      borderLeftColor: withAlpha(accentColor, muted ? 0.28 : 0.75),
      shadowColor: colors.shadow,
      backgroundColor: muted ? colors.surfaceCard : colors.surface,
    },
    !showAccentRail && [styles.noAccentRail, { borderLeftColor: colors.border }],
    onPress ? styles.interactive : styles.flat,
    dense && styles.dense,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        onPress={onPress}
        style={cardStyle}
        activeOpacity={0.75}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.md,
    gap: Spacing.md,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderLeftWidth: 4,
  },
  noAccentRail: {
    borderLeftWidth: 1,
  },
  flat: Elevation.flat,
  interactive: Elevation.interactive,
  dense: {
    paddingVertical: Spacing.sm,
  },
});
