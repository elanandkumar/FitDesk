import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { Searchbar } from 'react-native-paper';
import { Layout } from '../../theme/brandColors';
import { useAppTheme } from '../../theme';
import AppIcon from './AppIcon';

interface Props {
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  style?: StyleProp<ViewStyle>;
}

export default function AppSearchbar({ placeholder, value, onChangeText, style }: Props) {
  const { colors } = useAppTheme();
  return (
    <Searchbar
      placeholder={placeholder}
      value={value}
      onChangeText={onChangeText}
      style={[{ height: Layout.INPUT_HEIGHT }, style]}
      inputStyle={{ color: colors.textPrimary, minHeight: 0 }}
      icon={({ color, size }) => <AppIcon name="search" color={color} size={size} />}
      clearIcon={({ color, size }) => <AppIcon name="xCircle" color={color} size={size} />}
      iconColor={colors.textMuted}
      placeholderTextColor={colors.textMuted}
    />
  );
}
