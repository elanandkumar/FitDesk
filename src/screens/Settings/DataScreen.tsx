import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
import GradientButton from '../../components/common/GradientButton';
import AppButton from '../../components/common/AppButton';
import { exportData, pickAndImportData } from '../../utils/exportUtils';
import { useBackup } from '../../context/BackupContext';

export default function DataScreen() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const { refresh: refreshBackup } = useBackup();

  async function handleExport() {
    setExporting(true);
    try {
      await exportData();
      await refreshBackup();
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
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Export</Text>
        <Text variant="bodySmall" style={styles.sectionDesc}>
          Save all your FitDesk data as a JSON file. Share it to cloud storage or another device.
        </Text>
        {exporting ? (
          <ActivityIndicator animating color={Brand.orange} />
        ) : (
          <GradientButton label="Export Backup" onPress={handleExport} />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Import</Text>
        <Text variant="bodySmall" style={styles.sectionDesc}>
          Restore from a FitDesk JSON backup. All existing data will be replaced.
        </Text>
        <View style={styles.warningBox}>
          <Text variant="bodySmall" style={{ color: Brand.pink }}>
            Warning: import is destructive and cannot be undone.
          </Text>
        </View>
        {importing ? (
          <ActivityIndicator animating style={{ marginTop: Spacing.md }} color={Brand.pink} />
        ) : (
          <AppButton
            variant="secondary"
            color={Brand.pink}
            label="Import Backup"
            onPress={handleImport}
            style={styles.importBtn}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  card: {
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    elevation: 4,
    shadowColor: Brand.purple,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Brand.textPrimary,
  },
  sectionDesc: {
    color: Brand.textSecondary,
  },
  warningBox: {
    backgroundColor: Brand.pink + '18',
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  importBtn: { marginTop: Spacing.xs },
});
