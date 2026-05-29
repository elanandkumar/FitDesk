import React from 'react';
import { SegmentedButtons, SegmentedButtonsProps } from 'react-native-paper';
import { Brand } from '../../theme/brandColors';

type Props = Omit<SegmentedButtonsProps, 'theme'>;

export default function ThemedSegmentedButtons(props: Props) {
  return (
    <SegmentedButtons
      {...props}
      theme={{
        colors: {
          secondaryContainer: Brand.purple + '99',
          onSecondaryContainer: Brand.textPrimary,
        },
      }}
    />
  );
}
