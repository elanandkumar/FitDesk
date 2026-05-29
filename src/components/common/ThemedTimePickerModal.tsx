import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text as RNText, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';
import { useAppTheme, Radius } from '../../theme';
import { Brand } from '../../theme/brandColors';
import AppModal from './AppModal';

interface Props {
  visible: boolean;
  value: string; // HH:MM 24h
  onConfirm: (time: string) => void;
  onDismiss: () => void;
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function to12h(hour24: number): { display: number; period: 'AM' | 'PM' } {
  const period = hour24 < 12 ? 'AM' : 'PM';
  const display = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
  return { display, period };
}

function to24h(display: number, period: 'AM' | 'PM'): number {
  if (period === 'AM') return display === 12 ? 0 : display;
  return display === 12 ? 12 : display + 12;
}

export default function ThemedTimePickerModal({ visible, value, onConfirm, onDismiss }: Props) {
  const { theme } = useAppTheme();
  const [hour24, setHour24] = useState(0);
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    if (visible) {
      const [h, m] = value.split(':').map(Number);
      setHour24(isNaN(h) ? 0 : h);
      setMinute(isNaN(m) ? 0 : m);
    }
  }, [visible, value]);

  const { display: displayHour, period } = to12h(hour24);

  const changeHour = (delta: number) => {
    setHour24(h => {
      const { display, period: p } = to12h(h);
      const newDisplay = ((display - 1 + delta + 12) % 12) + 1;
      return to24h(newDisplay, p);
    });
  };

  const changeMinute = (delta: number) => setMinute((m) => (m + delta + 60) % 60);
  const togglePeriod = () => setHour24(h => h < 12 ? h + 12 : h - 12);

  const col = theme.colors;

  return (
    <AppModal
      visible={visible}
      onDismiss={onDismiss}
      title="Select Time"
      confirmLabel="Set"
      onConfirm={() => onConfirm(`${pad(hour24)}:${pad(minute)}`)}
    >
      <View style={styles.row}>
        {/* Hour */}
        <View style={styles.col}>
          <IconButton icon="chevron-up" size={32} onPress={() => changeHour(1)} iconColor={col.primary} />
          <View style={[styles.timeBox, { backgroundColor: col.surfaceVariant, borderColor: col.primary }]}>
            <Text variant="displaySmall" style={{ color: col.onSurface, fontVariant: ['tabular-nums'] }}>
              {pad(displayHour)}
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

        {/* AM/PM pill — vertical, right of time */}
        <View style={[styles.periodCol, { marginLeft: 12 }]}>
          <View style={styles.periodPill}>
            <Pressable
              onPress={period === 'PM' ? togglePeriod : undefined}
              style={[styles.periodSegment, period === 'AM' && styles.periodActive]}
            >
              <RNText style={[styles.periodLabel, { color: period === 'AM' ? '#FFFFFF' : Brand.textSecondary }]}>
                AM
              </RNText>
            </Pressable>
            <Pressable
              onPress={period === 'AM' ? togglePeriod : undefined}
              style={[styles.periodSegment, period === 'PM' && styles.periodActive]}
            >
              <RNText style={[styles.periodLabel, { color: period === 'PM' ? '#FFFFFF' : Brand.textSecondary }]}>
                PM
              </RNText>
            </Pressable>
          </View>
        </View>
      </View>

      <Text variant="bodySmall" style={{ color: col.onSurfaceVariant, textAlign: 'center', marginTop: 8 }}>
        Minutes in steps of 5
      </Text>
    </AppModal>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  col: { alignItems: 'center' },
  timeBox: {
    width: 96,
    height: 72,
    borderRadius: Radius.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodCol: {
    alignSelf: 'center',
  },
  periodPill: {
    flexDirection: 'column',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    overflow: 'hidden',
  },
  periodSegment: {
    width: 52,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodActive: {
    backgroundColor: Brand.purple,
  },
  periodLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
});
