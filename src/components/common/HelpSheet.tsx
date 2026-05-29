import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Modal, Portal, Text } from 'react-native-paper';
import { useAppTheme, Brand, Radius } from '../../theme';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  content: string;
}

export default function HelpSheet({ visible, onDismiss, content }: Props) {
  const { theme } = useAppTheme();
  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.sheet, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
          Help
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, lineHeight: 22 }}>
          {content}
        </Text>
        <Button mode="text" textColor={Brand.textAccent} onPress={onDismiss} style={styles.close}>
          Got it
        </Button>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: { margin: 24, padding: 24, borderRadius: Radius.card },
  close: { alignSelf: 'flex-end', marginTop: 12 },
});
