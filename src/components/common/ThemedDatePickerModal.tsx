import React from 'react';
import { StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useAppTheme, Radius } from '../../theme';
import AppModal from './AppModal';

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
  const { colors, theme } = useAppTheme();
  const [selected, setSelected] = React.useState(value);

  React.useEffect(() => {
    if (visible) setSelected(value);
  }, [visible, value]);

  const calTheme = {
    // The calendar lives inside AppModal's raised surface. Keeping the same
    // surface avoids a nested white/dark card that is unrelated to hierarchy.
    backgroundColor: colors.surfaceRaised,
    calendarBackground: colors.surfaceRaised,
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
    <AppModal
      visible={visible}
      onDismiss={onDismiss}
      title={title}
      confirmLabel="Select"
      onConfirm={() => onConfirm(selected)}
    >
      <Calendar
        current={selected}
        markedDates={{ [selected]: { selected: true } }}
        onDayPress={(day) => setSelected(day.dateString)}
        minDate={minDate}
        maxDate={maxDate}
        theme={calTheme}
        style={[styles.calendar, { backgroundColor: colors.surfaceRaised }]}
      />
    </AppModal>
  );
}

const styles = StyleSheet.create({
  calendar: { borderRadius: Radius.md, marginHorizontal: -4 },
});
