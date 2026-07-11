import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import ThemedSegmentedButtons from '../../components/common/ThemedSegmentedButtons';
import AppIconButton from '../../components/common/AppIconButton';
import { RouteProp, useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { Spacing } from '../../theme/brandColors';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import ManagerPaymentsScreen from './ManagerPaymentsScreen';
import TraineePackagesScreen from './TraineePackagesScreen';
import HelpSheet from '../../components/common/HelpSheet';
import { HELP } from '../../constants/helpContent';

type Nav = StackNavigationProp<RootStackParamList>;
type PaymentsRoute = RouteProp<TabParamList, 'Payments'>;

export default function PaymentsTabScreen() {
  const { accentPalette, theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<PaymentsRoute>();
  const [segment, setSegment] = useState<'managers' | 'trainees'>('managers');
  const [helpVisible, setHelpVisible] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      if (route.params?.initialSegment) {
        setSegment(route.params.initialSegment);
      }
    }, [route.params?.focusKey, route.params?.initialSegment]),
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerActions}>
          <AppIconButton
            icon="chartBar"
            iconColor={accentPalette.textAccent}
            size={22}
            onPress={() => navigation.navigate('IncomeSummary')}
          />
          <AppIconButton
            icon="question"
            iconColor={accentPalette.textAccent}
            onPress={() => setHelpVisible(true)}
          />
        </View>
      ),
    });
  }, [accentPalette.textAccent, navigation, theme.colors.primary]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ThemedSegmentedButtons
        value={segment}
        onValueChange={(v: string) => setSegment(v as 'managers' | 'trainees')}
        buttons={[
          { value: 'managers', label: 'Managers' },
          { value: 'trainees', label: 'Trainees' },
        ]}
        style={styles.segment}
      />
      {segment === 'managers' ? (
        <ManagerPaymentsScreen
          initialPendingOnly={route.params?.pendingOnly}
          focusKey={route.params?.focusKey}
        />
      ) : (
        <TraineePackagesScreen />
      )}
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
