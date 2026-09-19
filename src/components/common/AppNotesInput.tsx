import React from 'react';
import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';
import { Spacing } from '../../theme';

interface Props {
  value: string;
  onChangeText: (value: string) => void;
  numberOfLines?: number;
}

export default function AppNotesInput({
  value,
  onChangeText,
  numberOfLines = 3,
}: Props) {
  return (
    <TextInput
      accessibilityLabel="Notes"
      placeholder="Add optional details..."
      value={value}
      onChangeText={onChangeText}
      mode="outlined"
      multiline
      numberOfLines={numberOfLines}
      contentStyle={styles.content}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.lg,
    textAlignVertical: 'top',
  },
});
