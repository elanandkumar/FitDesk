import React from 'react';
import { ViewStyle } from 'react-native';
import { Button } from 'react-native-paper';
import GradientButton from './GradientButton';
import { Brand, Radius } from '../../theme/brandColors';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'filled';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  fullWidth?: boolean;
  color?: string;
}

export default function AppButton({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  fullWidth,
  color,
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

  if (variant === 'filled') {
    return (
      <Button
        mode="contained"
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        style={[{ borderRadius: Radius.lg }, style]}
        contentStyle={{ height: 48 }}
        buttonColor={Brand.purple}
        textColor={Brand.textPrimary}
      >
        {label}
      </Button>
    );
  }

  if (variant === 'secondary') {
    const c = color ?? Brand.purple;
    return (
      <Button
        mode="outlined"
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        style={[{ borderColor: c, borderRadius: Radius.lg }, style]}
        contentStyle={{ height: 48 }}
        textColor={c}
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
