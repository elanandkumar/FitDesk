import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme';
import { Brand, Spacing } from '../../theme/brandColors';
import ManagerListScreen from '../Managers/ManagerListScreen';
import TraineeListScreen from '../Trainees/TraineeListScreen';
import HelpSheet from '../../components/common/HelpSheet';

const HELP_MANAGERS =
  'Add managers who assign you classes. Outstanding balance (in orange) shows total unpaid sessions. Tap a manager to see their payment history.';
const HELP_TRAINEES =
  'Add your personal training clients here. Tap a trainee to view their packages and session history.';

export default function ContactsScreen() {
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
      {segment === 'managers' ? <ManagerListScreen /> : <TraineeListScreen />}
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
