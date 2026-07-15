import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Layout, Radius, Spacing } from '../../theme/brandColors';
import { useAppTheme } from '../../theme';
import AppIcon from './AppIcon';

interface Props {
  placeholder: string;
  value?: string;
  onPress: () => void;
  error?: boolean;
  leftColor?: string;
  onClear?: () => void;
}

export default function PickerField({ placeholder, value, onPress, error, leftColor, onClear }: Props) {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.field, { backgroundColor: colors.surfaceRaised, borderColor: error ? colors.danger : colors.border }]}
      activeOpacity={0.7}
    >
      <View style={styles.inner}>
        {leftColor && <View style={[styles.colorDot, { backgroundColor: leftColor }]} />}
        <Text style={[styles.text, { color: value ? colors.textPrimary : colors.textMuted }]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
      </View>
      <View style={styles.right}>
        {onClear && value ? (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name="xCircle" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
        <AppIcon name="caretDown" size={18} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Layout.INPUT_HEIGHT,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Outfit_400Regular',
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 999,
  },
});
