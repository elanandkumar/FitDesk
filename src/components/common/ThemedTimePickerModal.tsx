import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, IconButton, Portal, Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';

interface Props {
  visible: boolean;
  value: string; // HH:MM 24h
  onConfirm: (time: string) => void;
  onDismiss: () => void;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

export default function ThemedTimePickerModal({ visible, value, onConfirm, onDismiss }: Props) {
  const { theme } = useAppTheme();
  const [hour, setHour] = useState(0);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    if (visible) {
      const [h, m] = value.split(':').map(Number);
      setHour(isNaN(h) ? 0 : h);
      setMinute(isNaN(m) ? 0 : m);
    }
  }, [visible, value]);

  const changeHour = (delta: number) => setHour((h) => (h + delta + 24) % 24);
  const changeMinute = (delta: number) => setMinute((m) => (m + delta + 60) % 60);

  const col = theme.colors;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: col.surface }}>
        <Dialog.Title style={{ textAlign: 'center' }}>Select Time</Dialog.Title>
        <Dialog.Content>
          <View style={styles.row}>
            {/* Hour */}
            <View style={styles.col}>
              <IconButton icon="chevron-up" size={32} onPress={() => changeHour(1)} iconColor={col.primary} />
              <View style={[styles.timeBox, { backgroundColor: col.surfaceVariant, borderColor: col.primary }]}>
                <Text variant="displaySmall" style={{ color: col.onSurface, fontVariant: ['tabular-nums'] }}>
                  {pad(hour)}
                </Text>
              </View>
              <IconButton icon="chevron-down" size={32} onPress={() => changeHour(-1)} iconColor={col.primary} />
            </View>

            <Text variant="displaySmall" style={{ color: col.onSurface, alignSelf: 'center', marginHorizontal: 4 }}>
              :
            </Text>

            {/* Minute */}
            <View style={styles.col}>
              <IconButton icon="chevron-up" size={32} onPress={() => changeMinute(5)} iconColor={col.primary} />
              <View style={[styles.timeBox, { backgroundColor: col.surfaceVariant, borderColor: col.primary }]}>
                <Text variant="displaySmall" style={{ color: col.onSurface, fontVariant: ['tabular-nums'] }}>
                  {pad(minute)}
                </Text>
              </View>
              <IconButton icon="chevron-down" size={32} onPress={() => changeMinute(-5)} iconColor={col.primary} />
            </View>
          </View>

          <Text variant="bodySmall" style={{ color: col.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
            24-hour · minutes in steps of 5
          </Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={() => onConfirm(`${pad(hour)}:${pad(minute)}`)}>OK</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  col: { alignItems: 'center' },
  timeBox: {
    width: 96,
    height: 72,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
