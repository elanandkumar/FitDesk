import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme';
import { Brand, Spacing } from '../../theme/brandColors';
import ManagerPaymentsScreen from './ManagerPaymentsScreen';
import TraineePackagesScreen from './TraineePackagesScreen';
import HelpSheet from '../../components/common/HelpSheet';

const HELP_MANAGERS =
  'Payments are auto-created when sessions are marked complete. Tap "Mark Paid" after you receive payment from the manager. Mark each payment individually to verify.';
const HELP_TRAINEES =
  'Create a monthly package per trainee. Session count increments automatically when a personal session is marked complete. Mark the package paid after receiving payment.';

export default function PaymentsTabScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const [segment, setSegment] = useState<'managers' | 'trainees'>('managers');
  const [helpVisible, setHelpVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="help-circle-outline"
          iconColor={theme.colors.primary}
          onPress={() => setHelpVisible(true)}
        />
      ),
    });
  }, [navigation, theme.colors.primary]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <SegmentedButtons
        value={segment}
        onValueChange={(v) => setSegment(v as 'managers' | 'trainees')}
        buttons={[
          { value: 'managers', label: 'Managers' },
          { value: 'trainees', label: 'Trainees' },
        ]}
        style={styles.segment}
        theme={{
          colors: {
            secondaryContainer: Brand.purple,
            onSecondaryContainer: Brand.textPrimary,
          },
        }}
      />
      {segment === 'managers' ? <ManagerPaymentsScreen /> : <TraineePackagesScreen />}
      <HelpSheet
        visible={helpVisible}
        onDismiss={() => setHelpVisible(false)}
        content={segment === 'managers' ? HELP_MANAGERS : HELP_TRAINEES}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  segment: { marginHorizontal: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.xs },
});
