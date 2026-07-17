import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { ReleaseNote } from '../../constants/releases';
import { useAppTheme } from '../../theme';
import { AppThemeColors, Radius, Spacing, Typography } from '../../theme/brandColors';
import AppIcon from './AppIcon';
import AppModal from './AppModal';

interface WhatsNewModalProps {
  visible: boolean;
  release: ReleaseNote | undefined;
  onDismiss: () => void;
}

export default function WhatsNewModal({ visible, release, onDismiss }: WhatsNewModalProps) {
  const { accentPalette, colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!release) return null;

  return (
    <AppModal
      visible={visible}
      onDismiss={onDismiss}
      title={`What's New in ${release.version}`}
      cancelLabel="Got it"
    >
      <Text style={styles.releaseTitle}>{release.title}</Text>
      <View style={styles.changeList}>
        {release.changes.map((change) => (
          <View key={change} style={styles.changeRow}>
            <View style={[styles.iconCircle, { backgroundColor: `${accentPalette.main}18` }]}>
              <AppIcon name="check" size={14} color={accentPalette.textAccent} weight="bold" />
            </View>
            <Text style={styles.changeText}>{change}</Text>
          </View>
        ))}
      </View>
    </AppModal>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  releaseTitle: {
    ...Typography.labelMd,
    color: colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  changeList: { gap: Spacing.md },
  changeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeText: { ...Typography.body, color: colors.textPrimary, flex: 1, paddingTop: 2 },
});
