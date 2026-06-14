import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Brand } from '../../theme/brandColors';

interface Props {
  onDone: () => void;
}

const { width, height } = Dimensions.get('window');
const BG = Brand.backgroundDark;
const TRANSPARENT = 'transparent';

export default function AppSplashScreen({ onDone }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => onDone());
    }, 2200);
    return () => clearTimeout(timer);
  }, [opacity, onDone]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Image
        source={require('../../../assets/splash-icon.png')}
        style={styles.image}
        resizeMode="contain"
      />
      {/* Top fade — blends status-bar gap into background */}
      <LinearGradient
        colors={[BG, TRANSPARENT]}
        style={styles.fadeTop}
        pointerEvents="none"
      />
      {/* Bottom fade — dissolves hard letterbox edge */}
      <LinearGradient
        colors={[TRANSPARENT, BG]}
        style={styles.fadeBottom}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

const FADE_HEIGHT = height * 0.18;

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  image: { width, height },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: FADE_HEIGHT,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: FADE_HEIGHT,
  },
});
