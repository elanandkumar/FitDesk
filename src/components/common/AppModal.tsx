import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Modal, Portal, Text } from 'react-native-paper';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
import AppButton from './AppButton';

interface AppModalProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  children: ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  cancelLabel?: string;
  loading?: boolean;
  destructive?: boolean;
}

export default function AppModal({
  visible,
  onDismiss,
  title,
  children,
  confirmLabel = 'Confirm',
  onConfirm,
  cancelLabel = 'Cancel',
  loading,
  destructive,
}: AppModalProps) {
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={styles.container}
      >
        <Text style={styles.title}>{title}</Text>
        <View style={styles.body}>{children}</View>
        <View style={styles.footer}>
          <AppButton
            label={cancelLabel}
            onPress={onDismiss}
            variant="ghost"
            disabled={loading}
            fullWidth={false}
          />
          {onConfirm && (
            <AppButton
              label={confirmLabel}
              onPress={onConfirm}
              variant={destructive ? 'danger' : 'filled'}
              loading={loading}
              disabled={loading}
              style={destructive ? undefined : styles.confirmBtn}
              fullWidth={false}
            />
          )}
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.card,
    backgroundColor: Brand.surfaceElevated,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    overflow: 'hidden',
  },
  title: {
    ...Typography.h3,
    color: Brand.textPrimary,
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  body: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  confirmBtn: {
    minWidth: 120,
  },
});
