import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, ActivityIndicator } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import { useFonts, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat';
import { Outfit_400Regular } from '@expo-google-fonts/outfit';
import { ThemeProvider, useAppTheme } from './src/theme';
import { BackupProvider } from './src/context/BackupContext';
import { purgeOldNotifications } from './src/database/repositories/appNotificationRepository';
import AppNavigator from './src/navigation/AppNavigator';
import ErrorBoundary from './src/components/common/ErrorBoundary';
import AppSplashScreen from './src/screens/Splash/AppSplashScreen';
import { getDatabase } from './src/database/db';
import { extendActiveSeriesSessions } from './src/database/repositories/classSeriesRepository';
import { scheduleUpcomingNotifications, schedulePendingPaymentNotification, scheduleBackupReminderNotification } from './src/notifications/scheduler';
import { requestNotificationPermission } from './src/notifications/permissions';

SplashScreen.preventAutoHideAsync();

// expo-notifications push token support was removed from Expo Go in SDK 53
const isExpoGo = Constants.appOwnership === 'expo';

function Root() {
  const { theme } = useAppTheme();
  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <AppNavigator />
    </PaperProvider>
  );
}

type AppPhase = 'loading' | 'splash' | 'ready';

export default function App() {
  const [dbReady, setDbReady] = useState(false);
  const [phase, setPhase] = useState<AppPhase>('loading');

  const [fontsLoaded] = useFonts({
    Poppins_700Bold,
    Montserrat_600SemiBold,
    Outfit_400Regular,
  });

  useEffect(() => {
    async function init() {
      const db = await getDatabase();

      await purgeOldNotifications().catch(() => {});

      const today = new Date().toISOString().slice(0, 10);
      const lastExtend = await db.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = 'last_session_extend_date'"
      );
      if (lastExtend?.value !== today) {
        await extendActiveSeriesSessions();
        await db.runAsync(
          "INSERT OR REPLACE INTO settings (key, value) VALUES ('last_session_extend_date', ?)",
          [today]
        );
      }

      if (!isExpoGo) {
        try {
          await requestNotificationPermission();
          await scheduleUpcomingNotifications();
          await schedulePendingPaymentNotification();
          await scheduleBackupReminderNotification();
        } catch {
          // notifications unavailable — skip silently
        }
      }
      setDbReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
      setPhase('splash');
    }
  }, [fontsLoaded, dbReady]);

  const onSplashDone = useCallback(() => setPhase('ready'), []);

  if (phase === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ErrorBoundary>
        <ThemeProvider>
          <BackupProvider>
            <Root />
          </BackupProvider>
        </ThemeProvider>
      </ErrorBoundary>
      {phase === 'splash' && <AppSplashScreen onDone={onSplashDone} />}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B102F' },
});
