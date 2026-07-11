import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import AppIcon, { AppIconName } from './AppIcon';

interface Props {
  icon: AppIconName;
  iconColor: string;
  onPress: () => void;
  size?: number;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export default function AppIconButton({
  icon,
  iconColor,
  onPress,
  size = 24,
  style,
  disabled,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        style,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <AppIcon name={icon} size={size} color={iconColor} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.4 },
});
