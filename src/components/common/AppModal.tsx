import React, { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { BlurView } from 'expo-blur';
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
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <BlurView intensity={60} tint="dark" style={[StyleSheet.absoluteFill, styles.blur]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
        <View style={styles.container}>
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
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    backgroundColor: 'rgba(10, 5, 25, 0.6)',
  },
  blur: {
    backgroundColor: 'rgba(10, 5, 25, 0.4)',
  },
  container: {
    borderRadius: Radius.card,
    backgroundColor: Brand.surfaceDark,
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
