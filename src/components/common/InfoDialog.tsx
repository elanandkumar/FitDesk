import React from 'react';
import { Text } from 'react-native-paper';
import { Brand } from '../../theme/brandColors';
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
  return (
    <AppModal
      visible={visible}
      onDismiss={onDismiss}
      title={title}
      cancelLabel="OK"
    >
      <Text variant="bodyMedium" style={{ color: Brand.textSecondary }}>{message}</Text>
    </AppModal>
  );
}
