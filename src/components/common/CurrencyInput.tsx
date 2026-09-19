import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { Layout, Spacing, Typography, useAppTheme } from '../../theme';

interface Props {
  accessibilityLabel: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: boolean;
}

export default function CurrencyInput({
  accessibilityLabel,
  value,
  onChangeText,
  placeholder,
  error = false,
}: Props) {
  const { colors } = useAppTheme();

  return (
    <View>
      <TextInput
        accessibilityLabel={accessibilityLabel}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        mode="outlined"
        dense
        error={error}
        style={styles.input}
        contentStyle={styles.content}
      />
      <View pointerEvents="none" style={styles.symbolContainer}>
        <Text style={[styles.symbol, { color: colors.textSecondary }]}>₹</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: Layout.INPUT_HEIGHT,
  },
  content: {
    paddingLeft: 40,
  },
  symbolContainer: {
    bottom: 0,
    justifyContent: 'center',
    left: Spacing.lg,
    position: 'absolute',
    top: 0,
  },
  symbol: {
    ...Typography.bodyLg,
  },
});
