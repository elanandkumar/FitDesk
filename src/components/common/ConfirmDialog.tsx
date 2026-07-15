import React from 'react';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import AppModal from './AppModal';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export default function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Delete',
  destructive = true,
  onConfirm,
  onDismiss,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <AppModal
      visible={visible}
      onDismiss={onDismiss}
      title={title}
      confirmLabel={confirmLabel}
      onConfirm={onConfirm}
      destructive={destructive}
    >
      <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>{message}</Text>
    </AppModal>
  );
}
