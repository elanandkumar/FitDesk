import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppTheme } from '../theme';
import { TabParamList } from './types';
import DashboardScreen from '../screens/Dashboard/DashboardScreen';
import CalendarScreen from '../screens/Calendar/CalendarScreen';
import PeopleNavigator from './PeopleNavigator';
import PaymentsNavigator from './PaymentsNavigator';
import SettingsScreen from '../screens/Settings/SettingsScreen';
import FitDeskTabBar from '../components/navigation/FitDeskTabBar';
import { Brand } from '../theme/brandColors';

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  const { theme } = useAppTheme();
  return (
    <Tab.Navigator
      tabBar={(props) => <FitDeskTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Calendar" component={CalendarScreen} />
      <Tab.Screen name="People" component={PeopleNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Payments" component={PaymentsNavigator} options={{ headerShown: false }} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}
