import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brand, Radius } from '../../theme/brandColors';
import { useAppTheme } from '../../theme';

const TRACK_W = 58;
const TRACK_H = 32;
const THUMB = 26;
const PADDING = 3;

interface Props {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}

export default function GradientSwitch({ value, onValueChange, disabled }: Props) {
  const { accentPalette } = useAppTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  }, [value]);

  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [PADDING, TRACK_W - THUMB - PADDING],
  });

  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={disabled ? styles.disabled : undefined}
    >
      <View style={styles.track}>
        <LinearGradient
          colors={
            value
              ? [accentPalette.main + '52', accentPalette.accent + '32', accentPalette.main + '42']
              : [Brand.surfaceElevated, Brand.borderSubtle, Brand.surfaceElevated]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View
          style={[
            styles.thumb,
            {
              backgroundColor: value ? accentPalette.main : Brand.textMuted,
              transform: [{ translateX }],
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_W,
    height: TRACK_H,
    borderRadius: Radius.full,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: Radius.full,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  disabled: {
    opacity: 0.4,
  },
});
