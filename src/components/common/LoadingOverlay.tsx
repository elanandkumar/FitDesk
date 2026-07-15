import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Portal } from 'react-native-paper';
import { useAppTheme } from '../../theme';

interface Props {
  visible: boolean;
}

export default function LoadingOverlay({ visible }: Props) {
  const { colors } = useAppTheme();
  if (!visible) return null;
  return (
    <Portal>
      <View style={[styles.overlay, { backgroundColor: colors.scrim }]}>
        <ActivityIndicator size="large" />
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
