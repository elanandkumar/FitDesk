import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import { AppThemeColors, BrandCore, Radius, Spacing, Typography } from '../../theme/brandColors';
import AppButton from '../../components/common/AppButton';
import AppIcon from '../../components/common/AppIcon';
import AppModal from '../../components/common/AppModal';
import InfoDialog from '../../components/common/InfoDialog';
import { exportData, pickAndImportData } from '../../utils/exportUtils';
import { useBackup } from '../../context/BackupContext';

export default function DataScreen() {
  const { accentPalette, colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [confirmImportVisible, setConfirmImportVisible] = useState(false);
  const [infoDialog, setInfoDialog] = useState<{ title: string; message: string } | null>(null);
  const { refresh: refreshBackup } = useBackup();

  async function handleExport() {
    setExporting(true);
    try {
      await exportData();
      await refreshBackup();
    } catch (err) {
      setInfoDialog({
        title: 'Export failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setExporting(false);
    }
  }

  async function confirmImport() {
    setConfirmImportVisible(false);
    setImporting(true);
    try {
      await pickAndImportData();
      await refreshBackup();
      setInfoDialog({
        title: 'Import complete',
        message: 'All data restored from backup.',
      });
    } catch (err) {
      setInfoDialog({
        title: 'Import failed',
        message: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setImporting(false);
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Export</Text>
        <Text variant="bodySmall" style={styles.sectionDesc}>
          Save all your FitDesk data as a backup file. Share it to cloud storage or another device.
        </Text>
        {exporting ? (
          <ActivityIndicator animating color={accentPalette.main} />
        ) : (
          <AppButton variant="filled" label="Export Backup" onPress={handleExport} />
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Import</Text>
        <Text variant="bodySmall" style={styles.sectionDesc}>
          Restore from a FitDesk backup. Older backups are still supported. All existing data will be replaced.
        </Text>
        <View style={styles.warningBox}>
          <AppIcon name="warning" size={18} color={BrandCore.orange} style={styles.warningIcon} />
          <Text variant="bodySmall" style={styles.warningText}>
            Import is destructive and cannot be undone.
          </Text>
        </View>
        {importing ? (
          <ActivityIndicator animating style={{ marginTop: Spacing.md }} color="#FF5252" />
        ) : (
          <AppButton
            variant="danger"
            label="Import Backup"
            onPress={() => setConfirmImportVisible(true)}
            style={styles.importBtn}
          />
        )}
      </View>

      <AppModal
        visible={confirmImportVisible}
        onDismiss={() => setConfirmImportVisible(false)}
        title="Import Backup"
        confirmLabel="Replace All Data"
        onConfirm={confirmImport}
        destructive
      >
        <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
          This will replace ALL current data with the backup. This cannot be undone. Continue?
        </Text>
      </AppModal>

      <InfoDialog
        visible={infoDialog !== null}
        title={infoDialog?.title ?? ''}
        message={infoDialog?.message ?? ''}
        onDismiss={() => setInfoDialog(null)}
      />
    </ScrollView>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.item,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.h4,
    color: colors.textPrimary,
  },
  sectionDesc: {
    color: colors.textSecondary,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: BrandCore.orange + '12',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: BrandCore.orange + '33',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  warningIcon: { flexShrink: 0 },
  warningText: {
    flex: 1,
    color: BrandCore.orange,
  },
  importBtn: { marginTop: Spacing.xs },
});
