import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';

interface Props {
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export default function EmptyState({ title, subtitle, icon }: Props) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.container}>
      {icon && (
        <MaterialCommunityIcons name={icon} size={48} color={theme.colors.onSurfaceVariant} />
      )}
      <Text variant="headlineSmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {title}
      </Text>
      {subtitle && (
        <Text
          variant="bodyMedium"
          style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
        >
          {subtitle}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
});
