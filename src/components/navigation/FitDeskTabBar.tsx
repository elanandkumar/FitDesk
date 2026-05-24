import React, { useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import {
  House,
  CalendarBlank,
  Users,
  CurrencyInr,
  Gear,
} from 'phosphor-react-native';
import { Brand } from '../../theme/brandColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { name: 'Dashboard', label: 'Home', Icon: House },
  { name: 'Calendar', label: 'Calendar', Icon: CalendarBlank },
  { name: 'People', label: 'People', Icon: Users },
  { name: 'Payments', label: 'Payments', Icon: CurrencyInr },
  { name: 'Settings', label: 'Settings', Icon: Gear },
] as const;

const TAB_HEIGHT = 72;
const SPRING_CONFIG = { damping: 18, stiffness: 200, mass: 0.8 };

function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: (typeof TABS)[number];
  isActive: boolean;
  onPress: () => void;
}) {
  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isActive ? 1 : 0.6, { duration: 200 }),
  }));

  const pressScale = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={1}
      onPressIn={() => { pressScale.value = withSpring(0.88, SPRING_CONFIG); }}
      onPressOut={() => { pressScale.value = withSpring(1, SPRING_CONFIG); }}
    >
      <Animated.View style={[styles.tabItemInner, pressStyle]}>
        <tab.Icon
          size={22}
          color={isActive ? Brand.purple : Brand.textMuted}
          weight={isActive ? 'fill' : 'regular'}
        />
        <Animated.Text
          style={[styles.label, { color: isActive ? Brand.purple : Brand.textMuted }, labelStyle]}
          numberOfLines={1}
        >
          {tab.label}
        </Animated.Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function FitDeskTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View style={styles.container}>
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill as any} />
        <View style={styles.innerBorder} />
        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const isActive = state.index === index;
          return (
            <TabItem
              key={route.key}
              tab={tab}
              isActive={isActive}
              onPress={() => {
                if (!isActive) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  container: {
    flexDirection: 'row',
    height: TAB_HEIGHT,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: Brand.surfaceDark + 'CC',
    elevation: 12,
    shadowColor: Brand.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  innerBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    zIndex: 1,
    pointerEvents: 'none',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.2,
  },
});
