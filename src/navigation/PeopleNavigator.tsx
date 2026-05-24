import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme';
import { PeopleTabParamList } from './types';
import ManagerListScreen from '../screens/Managers/ManagerListScreen';
import TraineeListScreen from '../screens/Trainees/TraineeListScreen';

const Tab = createMaterialTopTabNavigator<PeopleTabParamList>();

export default function PeopleNavigator() {
  const { theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
        tabBarStyle: { backgroundColor: theme.colors.surface, paddingTop: insets.top },
      }}
    >
      <Tab.Screen name="Managers" component={ManagerListScreen} />
      <Tab.Screen name="Trainees" component={TraineeListScreen} />
    </Tab.Navigator>
  );
}
