import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import {
  House,
  CalendarBlank,
  Users,
  CurrencyInr,
  Gear,
} from 'phosphor-react-native';
import { Brand, Gradients, Radius } from '../../theme/brandColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const TABS = [
  { name: 'Dashboard', label: 'Home', Icon: House },
  { name: 'Calendar', label: 'Calendar', Icon: CalendarBlank },
  { name: 'Contacts', label: 'Contacts', Icon: Users },
  { name: 'Payments', label: 'Payments', Icon: CurrencyInr },
  { name: 'Settings', label: 'Settings', Icon: Gear },
] as const;

const TAB_HEIGHT = 72;

function TabItem({
  tab,
  isActive,
  onPress,
}: {
  tab: (typeof TABS)[number];
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.tabItemInner}>
        <View style={styles.iconWrap}>
          {isActive && (
            <LinearGradient
              colors={[Brand.purple + '4D', Brand.orange + '33']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.iconPill}
            />
          )}
          <tab.Icon
            size={22}
            color={isActive ? Brand.textAccent : Brand.textMuted}
            weight={isActive ? 'duotone' : 'regular'}
          />
        </View>
        <Text
          style={[styles.label, { color: isActive ? Brand.textAccent : Brand.textMuted }]}
          numberOfLines={1}
        >
          {tab.label}
        </Text>
      </View>
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
                if (!isActive) navigation.navigate(route.name);
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
    borderRadius: Radius.hero,
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
    borderRadius: Radius.hero,
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
  iconWrap: {
    width: 46,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconPill: {
    position: 'absolute',
    width: 46,
    height: 30,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Brand.orange + '40',
  },
  label: {
    fontSize: 10,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.2,
  },
});
