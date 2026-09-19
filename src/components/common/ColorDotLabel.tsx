import React from 'react';
import { StyleProp, StyleSheet, TextStyle } from 'react-native';
import { Text } from 'react-native-paper';
import { Typography, useAppTheme } from '../../theme';

interface Props {
  color: string;
  label: string;
  style?: StyleProp<TextStyle>;
}

export default function ColorDotLabel({ color, label, style }: Props) {
  const { colors } = useAppTheme();

  return (
    <Text style={[styles.label, { color: colors.textPrimary }, style]}>
      <Text style={[styles.dot, { color }]}>●</Text>
      {`  ${label}`}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    ...Typography.labelMd,
    flexShrink: 1,
  },
  dot: {
    fontSize: 16,
  },
});
