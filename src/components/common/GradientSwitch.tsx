import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brand, Radius } from '../../theme/brandColors';
import { useAppTheme } from '../../theme';

const TRACK_W = 50;
const TRACK_H = 28;
const THUMB = 22;
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
      style={disabled ? styles.disabled : undefined}
    >
      <View style={styles.track}>
        {value ? (
          <LinearGradient
            colors={[accentPalette.main + '4D', accentPalette.accent + '26', accentPalette.warm + '33']}
            start={{ x: 0, y: 1 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.trackOff]} />
        )}
        <Animated.View style={[styles.thumb, { backgroundColor: accentPalette.main, transform: [{ translateX }] }]} />
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
  trackOff: {
    backgroundColor: Brand.borderSubtle,
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
