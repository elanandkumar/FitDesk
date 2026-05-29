import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Brand, Layout, Radius, Spacing } from '../../theme/brandColors';

interface Props {
  placeholder: string;
  value?: string;
  onPress: () => void;
  error?: boolean;
  leftColor?: string;
  onClear?: () => void;
}

export default function PickerField({ placeholder, value, onPress, error, leftColor, onClear }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.field, error && styles.fieldError]}
      activeOpacity={0.7}
    >
      <View style={styles.inner}>
        {leftColor && <View style={[styles.colorDot, { backgroundColor: leftColor }]} />}
        <Text style={[styles.text, !value && styles.placeholder]} numberOfLines={1}>
          {value ?? placeholder}
        </Text>
      </View>
      <View style={styles.right}>
        {onClear && value ? (
          <TouchableOpacity
            onPress={onClear}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onStartShouldSetResponder={() => true}
          >
            <MaterialCommunityIcons name="close-circle" size={16} color={Brand.textMuted} />
          </TouchableOpacity>
        ) : null}
        <MaterialCommunityIcons name="chevron-down" size={18} color={Brand.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Layout.INPUT_HEIGHT,
    backgroundColor: Brand.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  fieldError: {
    borderColor: '#FF3D81',
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
    color: Brand.textPrimary,
    flex: 1,
  },
  placeholder: {
    color: Brand.textMuted,
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
