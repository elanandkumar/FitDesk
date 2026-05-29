import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gradients, Brand, Radius } from '../../theme/brandColors';

interface Props {
  icon: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  color?: string;
}

export default function GradientFAB({ icon, onPress, style, color = Brand.textPrimary }: Props) {
  return (
    <View style={[styles.shadow, style]}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: 'rgba(255,255,255,0.2)', borderless: false }}
        style={styles.pressable}
      >
        <LinearGradient
          colors={Gradients.button}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <MaterialCommunityIcons name={icon as any} size={20} color={color} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: Radius.card,
    elevation: 8,
    shadowColor: Brand.purple,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  pressable: {
    borderRadius: Radius.card,
    overflow: 'hidden',
  },
  gradient: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
