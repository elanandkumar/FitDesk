import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import AppIcon, { AppIconName } from './AppIcon';

interface Props {
  title: string;
  subtitle?: string;
  icon?: AppIconName;
}

export default function EmptyState({ title, subtitle, icon }: Props) {
  const { theme } = useAppTheme();
  return (
    <View style={styles.container}>
      {icon && (
        <AppIcon name={icon} size={48} color={theme.colors.onSurfaceVariant} />
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
