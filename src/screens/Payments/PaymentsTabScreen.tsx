import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import ThemedSegmentedButtons from '../../components/common/ThemedSegmentedButtons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { Brand, Spacing } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import ManagerPaymentsScreen from './ManagerPaymentsScreen';
import TraineePackagesScreen from './TraineePackagesScreen';
import HelpSheet from '../../components/common/HelpSheet';
import { HELP } from '../../constants/helpContent';

type Nav = StackNavigationProp<RootStackParamList>;

export default function PaymentsTabScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const [segment, setSegment] = useState<'managers' | 'trainees'>('managers');
  const [helpVisible, setHelpVisible] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <IconButton
            icon="chart-bar"
            iconColor={Brand.textAccent}
            size={22}
            onPress={() => navigation.navigate('IncomeSummary')}
          />
          <IconButton
            icon="help-circle-outline"
            iconColor={Brand.textAccent}
            onPress={() => setHelpVisible(true)}
          />
        </View>
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
      {segment === 'managers' ? <ManagerPaymentsScreen /> : <TraineePackagesScreen />}
      <HelpSheet
        visible={helpVisible}
        onDismiss={() => setHelpVisible(false)}
        content={segment === 'managers' ? HELP.paymentsManagers : HELP.paymentsTrainees}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  segment: { marginHorizontal: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.xs },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
});
