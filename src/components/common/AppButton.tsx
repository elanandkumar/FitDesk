import React from 'react';
import { ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';
import GradientButton from './GradientButton';
import { Brand, Radius } from '../../theme/brandColors';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
}

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  fullWidth,
}: AppButtonProps) {
  if (variant === 'primary') {
    const wrapStyle: ViewStyle = fullWidth === false ? { alignSelf: 'flex-start' } : {};
    return (
      <GradientButton
        label={label}
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        style={[wrapStyle, style]}
      />
    );
  }

  if (variant === 'secondary') {
    return (
      <Button
        mode="outlined"
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        style={[{ borderColor: Brand.purple, borderRadius: Radius.lg }, style]}
        textColor={Brand.purple}
      >
        {label}
      </Button>
    );
  }

  if (variant === 'danger') {
    return (
      <Button
        mode="text"
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        style={style}
        textColor="#FF5252"
      >
        {label}
      </Button>
    );
  }

  // ghost
  return (
    <Button
      mode="text"
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      style={style}
      textColor={Brand.textSecondary}
    >
      {label}
    </Button>
  );
}
