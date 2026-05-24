import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useAppTheme } from '../theme';
import { PaymentsTabParamList } from './types';
import ManagerPaymentsScreen from '../screens/Payments/ManagerPaymentsScreen';
import TraineePackagesScreen from '../screens/Payments/TraineePackagesScreen';

const Tab = createMaterialTopTabNavigator<PaymentsTabParamList>();

export default function PaymentsNavigator() {
  const { theme } = useAppTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarIndicatorStyle: { backgroundColor: theme.colors.primary },
        tabBarStyle: { backgroundColor: theme.colors.surface },
      }}
    >
      <Tab.Screen name="ManagerPayments" component={ManagerPaymentsScreen} options={{ title: 'Managers' }} />
      <Tab.Screen name="TraineePackages" component={TraineePackagesScreen} options={{ title: 'Trainees' }} />
    </Tab.Navigator>
  );
}
