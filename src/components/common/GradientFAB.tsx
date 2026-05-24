import React from 'react';
import { Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gradients, Brand } from '../../theme/brandColors';

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
          colors={Gradients.purpleOrange}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    borderRadius: 16,
    elevation: 8,
    shadowColor: Brand.purple,
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  pressable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
