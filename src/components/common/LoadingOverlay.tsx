import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Portal } from 'react-native-paper';

interface Props {
  visible: boolean;
}

export default function LoadingOverlay({ visible }: Props) {
  if (!visible) return null;
  return (
    <Portal>
      <View style={styles.overlay}>
        <ActivityIndicator size="large" />
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
