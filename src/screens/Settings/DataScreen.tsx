import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Card, Divider, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import { exportData, pickAndImportData } from '../../utils/exportUtils';

export default function DataScreen() {
  const { theme } = useAppTheme();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      await exportData();
    } catch (err) {
      Alert.alert('Export failed', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setExporting(false);
    }
  }

  function handleImport() {
    Alert.alert(
      'Import Backup',
      'This will replace ALL current data with the backup. This cannot be undone. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Replace All Data',
          style: 'destructive',
          onPress: async () => {
            setImporting(true);
            try {
              await pickAndImportData();
              Alert.alert('Import complete', 'All data restored from backup.');
            } catch (err) {
              Alert.alert('Import failed', err instanceof Error ? err.message : 'Unknown error');
            } finally {
              setImporting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
    >
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Export</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 16 }}>
            Save all your FitDesk data as a JSON file. Share it to cloud storage or another device.
          </Text>
          {exporting ? (
            <ActivityIndicator animating />
          ) : (
            <Button mode="contained" icon="database-export" onPress={handleExport}>
              Export Backup
            </Button>
          )}
        </Card.Content>
      </Card>

      <Divider style={styles.divider} />

      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Import</Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}>
            Restore from a FitDesk JSON backup. All existing data will be replaced.
          </Text>
          <View style={styles.warningBox}>
            <Text variant="bodySmall" style={{ color: theme.colors.error }}>
              Warning: import is destructive and cannot be undone.
            </Text>
          </View>
          {importing ? (
            <ActivityIndicator animating style={{ marginTop: 12 }} />
          ) : (
            <Button
              mode="outlined"
              icon="database-import"
              onPress={handleImport}
              textColor={theme.colors.error}
              style={{ borderColor: theme.colors.error, marginTop: 12 }}
            >
              Import Backup
            </Button>
          )}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16 },
  card: { marginBottom: 8 },
  sectionTitle: { marginBottom: 8 },
  divider: { marginVertical: 8 },
  warningBox: {
    backgroundColor: 'rgba(255,0,0,0.07)',
    borderRadius: 6,
    padding: 10,
  },
});
