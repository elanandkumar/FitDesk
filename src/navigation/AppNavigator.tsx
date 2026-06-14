import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppTheme } from '../theme';
import { RootStackParamList } from './types';
import TabNavigator from './TabNavigator';
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import AddEditManagerScreen from '../screens/Managers/AddEditManagerScreen';
import ManagerDetailScreen from '../screens/Managers/ManagerDetailScreen';
import AddEditTraineeScreen from '../screens/Trainees/AddEditTraineeScreen';
import TraineeDetailScreen from '../screens/Trainees/TraineeDetailScreen';
import ClassSeriesListScreen from '../screens/Classes/ClassSeriesListScreen';
import AddEditClassSeriesScreen from '../screens/Classes/AddEditClassSeriesScreen';
import ClassTypesScreen from '../screens/Settings/ClassTypesScreen';
import CentersScreen from '../screens/Settings/CentersScreen';
import ClassSessionDetailScreen from '../screens/Classes/ClassSessionDetailScreen';
import IncomeSummaryScreen from '../screens/Reports/IncomeSummaryScreen';
import IncomeMonthDetailScreen from '../screens/Reports/IncomeMonthDetailScreen';
import DataScreen from '../screens/Settings/DataScreen';
import AddPackageScreen from '../screens/Payments/AddPackageScreen';
import ManagerPaymentDetailScreen from '../screens/Payments/ManagerPaymentDetailScreen';
import AddSessionScreen from '../screens/Calendar/AddSessionScreen';
import NotificationsScreen from '../screens/Notifications/NotificationsScreen';
import PaymentThresholdsScreen from '../screens/Settings/PaymentThresholdsScreen';
import { getDatabase } from '../database/db';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { theme } = useAppTheme();
  const [initialRoute, setInitialRoute] = useState<'Onboarding' | 'MainTabs' | null>(null);

  useEffect(() => {
    async function checkOnboarding() {
      const db = await getDatabase();
      const row = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'onboarding_done'"
      );
      setInitialRoute(row?.value === 'true' ? 'MainTabs' : 'Onboarding');
    }
    checkOnboarding();
  }, []);

  if (!initialRoute) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.surface },
          headerTintColor: theme.colors.onSurface,
          cardStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen
          name="Onboarding"
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="AddEditManager" component={AddEditManagerScreen} />
        <Stack.Screen name="ManagerDetail" component={ManagerDetailScreen} />
        <Stack.Screen name="AddEditTrainee" component={AddEditTraineeScreen} />
        <Stack.Screen name="TraineeDetail" component={TraineeDetailScreen} />
        <Stack.Screen
          name="ClassSeriesList"
          component={ClassSeriesListScreen}
          options={{ title: 'Class Series' }}
        />
        <Stack.Screen name="AddEditClassSeries" component={AddEditClassSeriesScreen} />
        <Stack.Screen
          name="ClassTypes"
          component={ClassTypesScreen}
          options={{ title: 'Class Types' }}
        />
        <Stack.Screen
          name="Centers"
          component={CentersScreen}
          options={{ title: 'Centers' }}
        />
        <Stack.Screen
          name="ClassSessionDetail"
          component={ClassSessionDetailScreen}
          options={{ title: 'Session Detail' }}
        />
        <Stack.Screen
          name="IncomeSummary"
          component={IncomeSummaryScreen}
          options={{ title: 'Income Summary' }}
        />
        <Stack.Screen name="IncomeMonthDetail" component={IncomeMonthDetailScreen} />
        <Stack.Screen
          name="DataScreen"
          component={DataScreen}
          options={{ title: 'Export / Import' }}
        />
        <Stack.Screen
          name="AddPackage"
          component={AddPackageScreen}
          options={{ title: 'Add Package' }}
        />
        <Stack.Screen
          name="ManagerPaymentDetail"
          component={ManagerPaymentDetailScreen}
        />
        <Stack.Screen
          name="AddSession"
          component={AddSessionScreen}
          options={{ title: 'Add Session' }}
        />
        <Stack.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ title: 'Notifications' }}
        />
        <Stack.Screen
          name="PaymentThresholds"
          component={PaymentThresholdsScreen}
          options={{ title: 'Payment Overdue Alerts' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
