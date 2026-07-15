import React from 'react';
import { SegmentedButtons, SegmentedButtonsProps } from 'react-native-paper';
import { useAppTheme } from '../../theme';

type Props = Omit<SegmentedButtonsProps, 'theme' | 'value' | 'onValueChange' | 'multiSelect'> & {
  value: string;
  onValueChange: (value: string) => void;
  multiSelect?: false;
};

export default function ThemedSegmentedButtons(props: Props) {
  const { accentPalette } = useAppTheme();

  return (
    <SegmentedButtons
      {...props}
      theme={{
        colors: {
          secondaryContainer: accentPalette.main,
          onSecondaryContainer: '#FFFFFF',
        },
      }}
    />
  );
}
