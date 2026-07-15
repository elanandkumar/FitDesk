import React from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandCore, Radius } from '../../theme/brandColors';
import { useAppTheme } from '../../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBackup } from '../../context/BackupContext';
import AppIcon, { AppIconName } from '../common/AppIcon';

const TABS = [
  { name: 'Dashboard', label: 'Home', icon: 'home' },
  { name: 'Calendar', label: 'Calendar', icon: 'calendar' },
  { name: 'Contacts', label: 'Contacts', icon: 'users' },
  { name: 'Payments', label: 'Payments', icon: 'currencyInr' },
  { name: 'Settings', label: 'Settings', icon: 'gear' },
] as const;

type TabConfig = {
  name: string;
  label: string;
  icon: AppIconName;
};

const TAB_HEIGHT = 72;

function TabItem({
  tab,
  isActive,
  onPress,
  showDot,
}: {
  tab: TabConfig;
  isActive: boolean;
  onPress: () => void;
  showDot?: boolean;
}) {
  const { accentPalette, colors } = useAppTheme();

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
              colors={[accentPalette.main + '4D', accentPalette.accent + '26', accentPalette.warm + '33']}
              start={{ x: 0, y: 1 }}
              end={{ x: 1, y: 0 }}
              style={[styles.iconPill, { borderColor: accentPalette.warm + '40' }]}
            />
          )}
          <AppIcon
            name={tab.icon}
            size={22}
            color={isActive ? accentPalette.textAccent : colors.textMuted}
            weight={isActive ? 'duotone' : 'regular'}
          />
          {showDot && <View style={styles.dot} />}
        </View>
        <Text
          style={[styles.label, { color: isActive ? accentPalette.textAccent : colors.textMuted }]}
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
  const { isBackupOverdue } = useBackup();
  const { colors, isDark } = useAppTheme();

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom + 8 }]}>
      <View style={[styles.container, { backgroundColor: colors.surfaceRaised, borderColor: colors.border, shadowColor: colors.shadow }]}>
        <BlurView intensity={70} tint={isDark ? 'systemThinMaterialDark' : 'systemThinMaterialLight'} style={styles.fill} />
        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const isActive = state.index === index;
          return (
            <TabItem
              key={route.key}
              tab={tab}
              isActive={isActive}
              showDot={tab.name === 'Settings' && isBackupOverdue}
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
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
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
    borderWidth: 1,
    elevation: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.34,
    shadowRadius: 16,
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
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: 'Montserrat_600SemiBold',
    letterSpacing: 0.2,
  },
  dot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandCore.orange,
  },
});
