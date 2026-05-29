import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import ThemedSegmentedButtons from '../../components/common/ThemedSegmentedButtons';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../../theme';
import { Brand, Spacing } from '../../theme/brandColors';
import ManagerListScreen from '../Managers/ManagerListScreen';
import TraineeListScreen from '../Trainees/TraineeListScreen';
import HelpSheet from '../../components/common/HelpSheet';
import { HELP } from '../../constants/helpContent';

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
          iconColor={Brand.textAccent}
          onPress={() => setHelpVisible(true)}
        />
      ),
    });
  }, [navigation, theme.colors.primary]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ThemedSegmentedButtons
        value={segment}
        onValueChange={(v) => setSegment(v as 'managers' | 'trainees')}
        buttons={[
          { value: 'managers', label: 'Managers' },
          { value: 'trainees', label: 'Trainees' },
        ]}
        style={styles.segment}
      />
      {segment === 'managers' ? <ManagerListScreen /> : <TraineeListScreen />}
      <HelpSheet
        visible={helpVisible}
        onDismiss={() => setHelpVisible(false)}
        content={segment === 'managers' ? HELP.contactsManagers : HELP.contactsTrainees}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  segment: { marginHorizontal: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.xs },
});
