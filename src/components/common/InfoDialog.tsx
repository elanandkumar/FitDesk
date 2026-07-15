import React from 'react';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import AppModal from './AppModal';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
}

export default function InfoDialog({
  visible,
  title,
  message,
  onDismiss,
}: Props) {
  const { colors } = useAppTheme();
  return (
    <AppModal
      visible={visible}
      onDismiss={onDismiss}
      title={title}
      cancelLabel="OK"
    >
      <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>{message}</Text>
    </AppModal>
  );
}
