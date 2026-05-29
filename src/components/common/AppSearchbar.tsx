import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { Brand, Layout } from '../../theme/brandColors';

interface Props {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}

export default function AppSearchbar({ placeholder, value, onChangeText, style }: Props) {
  return (
    <Searchbar
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={[{ height: Layout.INPUT_HEIGHT }, style]}
      inputStyle={{ color: Brand.textPrimary, minHeight: 0 }}
      iconColor={Brand.textMuted}
      placeholderTextColor={Brand.textMuted}
    />
  );
}
