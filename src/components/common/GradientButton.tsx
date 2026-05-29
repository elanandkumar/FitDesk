import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Brand, Gradients, Radius } from '../../theme/brandColors';

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function GradientButton({ label, onPress, loading, disabled, style }: Props) {
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.wrapper, style, animStyle]}>
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => { scale.value = withSpring(0.96, { damping: 15, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
        style={styles.pressable}
      >
        <LinearGradient
          colors={isDisabled ? ['#3a3a4a', '#2a2a3a'] : Gradients.button}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {!isDisabled && (
            <LinearGradient
              colors={['rgba(255,255,255,0.25)', 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}
          {loading ? (
            <ActivityIndicator color={Brand.textPrimary} size={20} />
          ) : (
            <Text style={[styles.label, isDisabled && styles.labelDisabled]}>{label}</Text>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: Radius.lg, overflow: 'hidden' },
  pressable: { width: '100%' },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  label: {
    color: Brand.textPrimary,
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    includeFontPadding: false,
  } as any,
  labelDisabled: { color: Brand.textMuted },
});
