import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import SectionHeader from '../../components/common/SectionHeader';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { Trainee } from '../../types';
import { getAllTrainees } from '../../database/repositories/traineeRepository';
import {
  cleanupOrphanedUnusedPendingPackage,
  getActivePackageForTrainee,
} from '../../database/repositories/paymentRepository';
import GradientButton from '../../components/common/GradientButton';
import AppButton from '../../components/common/AppButton';
import PickerModal, { PickerItem } from '../../components/common/PickerModal';
import AppIcon from '../../components/common/AppIcon';
import AppIconButton from '../../components/common/AppIconButton';
import AppModal from '../../components/common/AppModal';

type Nav = StackNavigationProp<RootStackParamList, 'AddPackage'>;
type Route = RouteProp<RootStackParamList, 'AddPackage'>;

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function maxSixDayWeekSessionsForMonth(ym: string): number {
  const [year, month] = ym.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const weekdayCounts = Array(7).fill(0) as number[];

  for (let day = 1; day <= daysInMonth; day += 1) {
    weekdayCounts[new Date(year, month - 1, day).getDay()] += 1;
  }

  return daysInMonth - Math.min(...weekdayCounts);
}

function describeExistingPackage(totalSessions: number, usedSessions: number, status: string): string {
  const statusLabel = status === 'paid' ? 'paid' : 'pending';
  return `A ${statusLabel} package with ${usedSessions}/${totalSessions} sessions used already exists`;
}

export default function AddPackageScreen() {
  const { accentPalette, theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [traineePickerVisible, setTraineePickerVisible] = useState(false);
  const [traineeId, setTraineeId] = useState<number | null>(route.params?.traineeId ?? null);
  const traineePickerItems: PickerItem[] = trainees.map(t => ({ id: t.id, label: t.name }));
  const [month, setMonth] = useState(currentYearMonth());
  const [totalSessions, setTotalSessions] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [schedulePromptVisible, setSchedulePromptVisible] = useState(false);
  const [savedPackage, setSavedPackage] = useState<{
    traineeId: number;
    month: string;
    totalSessions: number;
    amount: number;
    notes?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedTrainee = trainees.find((t) => t.id === traineeId);

  const load = useCallback(async () => {
    const ts = await getAllTrainees();
    setTrainees(ts);
  }, []);

  useEffect(() => {
    navigation.setOptions({ title: 'Add Package' });
    load();
  }, [navigation, load]);

  const adjustMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const isValid =
    traineeId !== null &&
    month.length === 7 &&
    parseInt(totalSessions, 10) > 0 &&
    parseFloat(amount) > 0;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const parsedTotalSessions = parseInt(totalSessions, 10);
      const maxSessions = maxSixDayWeekSessionsForMonth(month);
      if (parsedTotalSessions > maxSessions) {
        setErrorMessage(
          `${formatMonth(month)} supports up to ${maxSessions} package session${maxSessions === 1 ? '' : 's'} with FitDesk's one-session-per-day scheduling.`
        );
        return;
      }

      await cleanupOrphanedUnusedPendingPackage(traineeId!, month);
      const existingPackage = await getActivePackageForTrainee(traineeId!, month);
      if (existingPackage) {
        setErrorMessage(
          `${describeExistingPackage(existingPackage.total_sessions, existingPackage.used_sessions, existingPackage.status)} for ${selectedTrainee?.name ?? 'this trainee'} in ${formatMonth(month)}. Check All payments if it is not visible under Pending only.`
        );
        return;
      }

      setSavedPackage({
        traineeId: traineeId!,
        month,
        totalSessions: parsedTotalSessions,
        amount: parseFloat(amount),
        notes: notes.trim() || undefined,
      });
      setSchedulePromptVisible(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      const isDuplicate = message.includes('UNIQUE constraint failed');
      setErrorMessage(
        isDuplicate
          ? `${selectedTrainee?.name ?? 'This trainee'} already has a package for ${formatMonth(month)}. Check All payments if it is not visible under Pending only.`
          : 'Could not prepare package. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const dismissSchedulePrompt = () => {
    setSchedulePromptVisible(false);
    navigation.navigate('MainTabs', {
      screen: 'Payments',
      params: {
        initialSegment: 'trainees',
        focusKey: Date.now(),
        notice: 'Package was not created because scheduling is required.',
      },
    });
  };

  const handleSchedulePackage = () => {
    if (!savedPackage) return;
    setSchedulePromptVisible(false);
    navigation.replace('AddEditClassSeries', {
      prefillPackage: savedPackage,
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior="padding"
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <SectionHeader label="Trainee" />
        <View style={[styles.card, styles.pickerCard]}>
          <TouchableOpacity
            onPress={() => setTraineePickerVisible(true)}
            style={styles.pickerRow}
          >
            <AppIcon name="user" size={20} color={accentPalette.main} />
            <Text style={[styles.pickerText, !selectedTrainee && styles.pickerPlaceholder]}>
              {selectedTrainee
                ? selectedTrainee.name
                : trainees.length === 0
                  ? 'No trainees added yet'
                  : 'Select trainee...'}
            </Text>
            <AppIcon name="caretDown" size={20} color={Brand.textMuted} />
          </TouchableOpacity>
        </View>

        <SectionHeader label="Month" />
        <View style={[styles.card, styles.monthCard]}>
          <AppIconButton icon="caretLeft" size={24} onPress={() => adjustMonth(-1)} iconColor={Brand.textPrimary} />
          <Text style={styles.monthText}>{formatMonth(month)}</Text>
          <AppIconButton icon="caretRight" size={24} onPress={() => adjustMonth(1)} iconColor={Brand.textPrimary} />
        </View>

        <SectionHeader label="Package Details" />
        <View style={styles.card}>
          <TextInput
            label="Total Sessions *"
            value={totalSessions}
            onChangeText={(v) => setTotalSessions(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            mode="outlined"
            dense
          />
          <View style={styles.fieldGap} />
          <TextInput
            label="Amount (₹) *"
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            mode="outlined"
            dense
          />
          <View style={styles.fieldGap} />
          <TextInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <AppButton
          variant="ghost"
          label="Cancel"
          onPress={() => navigation.goBack()}
          style={styles.cancelBtn}
        />
        <GradientButton
          label={saving ? 'Saving...' : 'Save'}
          onPress={handleSave}
          loading={saving}
          disabled={!isValid}
          style={styles.saveBtn}
        />
      </View>

      <PickerModal
        visible={traineePickerVisible}
        onDismiss={() => setTraineePickerVisible(false)}
        title="Select Trainee"
        items={traineePickerItems}
        selectedIds={traineeId !== null ? [traineeId] : []}
        multiSelect={false}
        onSelect={(ids) => {
          setTraineeId(ids[0] ?? null);
          setTraineePickerVisible(false);
        }}
        showAvatar
      />

      <AppModal
        visible={schedulePromptVisible}
        onDismiss={dismissSchedulePrompt}
        title="Schedule Required"
        cancelLabel="Not Now"
        confirmLabel="Schedule"
        onConfirm={handleSchedulePackage}
      >
        <Text variant="bodyMedium" style={{ color: Brand.textSecondary }}>
          Schedule {savedPackage?.totalSessions ?? 0} calendar sessions to create this package.
        </Text>
      </AppModal>

      <AppModal
        visible={errorMessage.length > 0}
        onDismiss={() => setErrorMessage('')}
        title="Could Not Prepare Package"
        cancelLabel="OK"
      >
        <Text variant="bodyMedium" style={{ color: Brand.textSecondary }}>
          {errorMessage}
        </Text>
      </AppModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg },
  card: {
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    padding: Spacing.lg,
  },
  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.xs,
  },
  monthText: { ...Typography.h3, color: Brand.textPrimary, flex: 1, textAlign: 'center' },
  pickerCard: {
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    minHeight: 44,
  },
  pickerText: { ...Typography.h4, flex: 1, color: Brand.textPrimary },
  pickerPlaceholder: { color: Brand.textMuted },
  fieldGap: { height: Spacing.sm },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Brand.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
  },
  cancelBtn: {
    flex: 0,
    justifyContent: 'center',
    width: 100,
  },
  saveBtn: { flex: 1 },
});
