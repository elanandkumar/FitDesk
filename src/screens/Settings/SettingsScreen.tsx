import React, { useCallback, useLayoutEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Divider, IconButton, List, SegmentedButtons, Switch, Text } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Constants from 'expo-constants';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import { getDatabase } from '../../database/db';
import { scheduleUpcomingNotifications } from '../../notifications/scheduler';
import { requestNotificationPermission } from '../../notifications/permissions';
import HelpSheet from '../../components/common/HelpSheet';

const isExpoGo = Constants.appOwnership === 'expo';

const HELP =
  'Configure notification reminders, manage class types, and export/import your data. Export regularly to keep a backup — data is stored locally only.';

type Nav = StackNavigationProp<RootStackParamList>;

const MINUTES_OPTIONS = [
  { value: '15', label: '15 min', style: { borderRadius: 4 } },
  { value: '30', label: '30 min', style: { borderRadius: 4 } },
  { value: '60', label: '1 hr', style: { borderRadius: 4 } },
  { value: '120', label: '2 hr', style: { borderRadius: 4 } },
];

async function getSetting(key: string): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE settings SET value = ? WHERE key = ?', [value, key]);
}

export default function SettingsScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [minutesBefore, setMinutesBefore] = useState('60');
  const [helpVisible, setHelpVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="help-circle-outline"
          iconColor={theme.colors.primary}
          onPress={() => setHelpVisible(true)}
        />
      ),
    });
  }, [navigation, theme.colors.primary]);

  useFocusEffect(
    useCallback(() => {
      async function loadSettings() {
        const enabled = await getSetting('notification_enabled');
        const mins = await getSetting('notification_minutes_before');
        setNotifEnabled(enabled !== 'false');
        setMinutesBefore(mins ?? '60');
      }
      loadSettings();
    }, [])
  );

  const handleToggleNotifications = async (val: boolean) => {
    setNotifEnabled(val);
    await setSetting('notification_enabled', val ? 'true' : 'false');
    if (!isExpoGo) {
      if (val) {
        const granted = await requestNotificationPermission();
        if (granted) await scheduleUpcomingNotifications();
      } else {
        await scheduleUpcomingNotifications();
      }
    }
  };

  const handleMinutesChange = async (val: string) => {
    setMinutesBefore(val);
    await setSetting('notification_minutes_before', val);
    if (notifEnabled && !isExpoGo) await scheduleUpcomingNotifications();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <List.Section>
        <List.Subheader style={{ color: theme.colors.primary }}>Notifications</List.Subheader>
        <List.Item
          title="Enable Reminders"
          titleStyle={{ color: theme.colors.onSurface }}
          style={{ backgroundColor: theme.colors.surface }}
          left={(props) => (
            <List.Icon {...props} icon="bell-outline" color={theme.colors.primary} />
          )}
          right={() => (
            <Switch
              value={notifEnabled}
              onValueChange={handleToggleNotifications}
              color={theme.colors.primary}
            />
          )}
        />
        {notifEnabled && (
          <View style={[styles.minutesRow, { backgroundColor: theme.colors.surface }]}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginBottom: 8 }}>
              Remind me before class
            </Text>
            <SegmentedButtons
              value={minutesBefore}
              onValueChange={handleMinutesChange}
              buttons={MINUTES_OPTIONS}
              style={{ borderRadius: 4 }}
            />
          </View>
        )}
      </List.Section>

      <Divider />

      <List.Section>
        <List.Subheader style={{ color: theme.colors.primary }}>Data</List.Subheader>
        <List.Item
          title="Income Summary"
          titleStyle={{ color: theme.colors.onSurface }}
          style={{ backgroundColor: theme.colors.surface }}
          left={(props) => (
            <List.Icon {...props} icon="chart-bar" color={theme.colors.primary} />
          )}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('IncomeSummary')}
        />
        <List.Item
          title="Class Types"
          titleStyle={{ color: theme.colors.onSurface }}
          style={{ backgroundColor: theme.colors.surface }}
          left={(props) => (
            <List.Icon {...props} icon="tag-multiple" color={theme.colors.primary} />
          )}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('ClassTypes')}
        />
        <List.Item
          title="Class Series"
          titleStyle={{ color: theme.colors.onSurface }}
          style={{ backgroundColor: theme.colors.surface }}
          left={(props) => (
            <List.Icon {...props} icon="calendar-multiselect" color={theme.colors.primary} />
          )}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('ClassSeriesList')}
        />
        <List.Item
          title="Export / Import"
          titleStyle={{ color: theme.colors.onSurface }}
          style={{ backgroundColor: theme.colors.surface }}
          left={(props) => (
            <List.Icon {...props} icon="database-export" color={theme.colors.primary} />
          )}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('DataScreen')}
        />
      </List.Section>

      <Divider />
      <View style={styles.version}>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          FitDesk v1.0.0
        </Text>
      </View>

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  minutesRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  version: { padding: 24, alignItems: 'center' },
});
