import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Button, Dialog, Portal, Text } from 'react-native-paper';
import { Calendar } from 'react-native-calendars';
import { useAppTheme } from '../../theme';

interface Props {
  visible: boolean;
  value: string; // ISO YYYY-MM-DD
  onConfirm: (date: string) => void;
  onDismiss: () => void;
  minDate?: string;
  maxDate?: string;
  title?: string;
}

export default function ThemedDatePickerModal({
  visible,
  value,
  onConfirm,
  onDismiss,
  minDate,
  maxDate,
  title = 'Select Date',
}: Props) {
  const { theme } = useAppTheme();
  const [selected, setSelected] = React.useState(value);

  React.useEffect(() => {
    if (visible) setSelected(value);
  }, [visible, value]);

  const calTheme = {
    backgroundColor: theme.colors.surface,
    calendarBackground: theme.colors.surface,
    textSectionTitleColor: theme.colors.onSurfaceVariant,
    selectedDayBackgroundColor: theme.colors.primary,
    selectedDayTextColor: theme.colors.onPrimary,
    todayTextColor: theme.colors.primary,
    dayTextColor: theme.colors.onSurface,
    textDisabledColor: theme.colors.onSurfaceVariant,
    arrowColor: theme.colors.primary,
    monthTextColor: theme.colors.onSurface,
  };

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={{ backgroundColor: theme.colors.surface }}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content style={styles.content}>
          <Calendar
            current={selected}
            markedDates={{ [selected]: { selected: true } }}
            onDayPress={(day) => setSelected(day.dateString)}
            minDate={minDate}
            maxDate={maxDate}
            theme={calTheme}
            style={{ borderRadius: 8 }}
          />
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
          <Button onPress={() => onConfirm(selected)}>OK</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 0 },
});
