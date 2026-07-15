import React from 'react';
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Brand, Radius, Spacing } from '../../theme';
import { withAlpha } from '../../utils/colorUtils';

interface Props {
  accentColor: string;
  children: React.ReactNode;
  onPress?: () => void;
  muted?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function AccentListCard({
  accentColor,
  children,
  onPress,
  muted = false,
  style,
  accessibilityLabel,
  accessibilityHint,
}: Props) {
  const cardStyle = [
    styles.card,
    {
      borderColor: withAlpha(accentColor, 0.28),
      borderLeftColor: withAlpha(accentColor, muted ? 0.28 : 0.75),
      shadowColor: '#000000',
    },
    muted && styles.cardMuted,
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
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    borderLeftWidth: 4,
    elevation: 4,
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardMuted: {
    backgroundColor: Brand.surfaceCard,
  },
});
