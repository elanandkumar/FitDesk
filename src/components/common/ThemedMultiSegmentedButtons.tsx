import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Text } from 'react-native-paper';
import { Radius, Typography, useAppTheme } from '../../theme';

type SegmentValue = string | number;

interface SegmentButton<T extends SegmentValue> {
  value: T;
  label: string;
  accessibilityLabel?: string;
  disabled?: boolean;
}

interface Props<T extends SegmentValue> {
  value: readonly T[];
  onValueChange: (value: T[]) => void;
  buttons: readonly SegmentButton<T>[];
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export default function ThemedMultiSegmentedButtons<T extends SegmentValue>({
  value,
  onValueChange,
  buttons,
  style,
  labelStyle,
}: Props<T>) {
  const { accentPalette, colors } = useAppTheme();

  const toggleValue = (nextValue: T) => {
    onValueChange(
      value.includes(nextValue)
        ? value.filter((currentValue) => currentValue !== nextValue)
        : [...value, nextValue]
    );
  };

  return (
    <View style={[styles.container, { borderColor: colors.border }, style]}>
      {buttons.map((button, index) => {
        const selected = value.includes(button.value);

        return (
          <TouchableOpacity
            key={button.value}
            accessibilityLabel={button.accessibilityLabel ?? button.label}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected, disabled: button.disabled }}
            activeOpacity={0.78}
            disabled={button.disabled}
            onPress={() => toggleValue(button.value)}
            style={[
              styles.segment,
              {
                backgroundColor: selected ? accentPalette.main : 'transparent',
                borderRightColor: colors.border,
              },
              index < buttons.length - 1 && styles.segmentDivider,
              button.disabled && styles.disabled,
            ]}
          >
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.85}
              numberOfLines={1}
              style={[
                styles.label,
                { color: selected ? '#FFFFFF' : colors.textSecondary },
                labelStyle,
              ]}
            >
              {button.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.default,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 0,
    paddingHorizontal: 2,
  },
  segmentDivider: {
    borderRightWidth: 1,
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    ...Typography.labelSm,
    textAlign: 'center',
  },
});
