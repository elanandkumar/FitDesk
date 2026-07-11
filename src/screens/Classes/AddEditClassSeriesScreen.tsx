import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import ThemedDatePickerModal from '../../components/common/ThemedDatePickerModal';
import ThemedTimePickerModal from '../../components/common/ThemedTimePickerModal';
import PickerModal from '../../components/common/PickerModal';
import PickerField from '../../components/common/PickerField';
import SectionHeader from '../../components/common/SectionHeader';
import ThemedSegmentedButtons from '../../components/common/ThemedSegmentedButtons';
import {
  Text,
  TextInput,
} from 'react-native-paper';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { Brand, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { ClassType, Manager, Trainee, Center, TraineePackage, RecurrenceType, LocationType, SourceType } from '../../types';
import { getAllClassTypes } from '../../database/repositories/classTypeRepository';
import { getAllManagers } from '../../database/repositories/managerRepository';
import { getAllTrainees } from '../../database/repositories/traineeRepository';
import { getAllCenters } from '../../database/repositories/centerRepository';
import { getActivePackageForTrainee } from '../../database/repositories/paymentRepository';
import { scheduleUpcomingNotifications } from '../../notifications/scheduler';
import {
  createClassSeries,
  updateClassSeries,
  getClassSeriesById,
  deactivateClassSeries,
  getTraineesForSeries,
  setTraineesForSeries,
} from '../../database/repositories/classSeriesRepository';
import {
  createSessionsBatch,
  deleteUpcomingSessionsForSeries,
} from '../../database/repositories/classSessionRepository';
import { generateSessionDates } from '../../utils/dateUtils';
import { DEFAULT_DURATION_MINUTES } from '../../constants';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import LoadingOverlay from '../../components/common/LoadingOverlay';
import GradientButton from '../../components/common/GradientButton';
import AppButton from '../../components/common/AppButton';

type Nav = StackNavigationProp<RootStackParamList, 'AddEditClassSeries'>;
type Route = RouteProp<RootStackParamList, 'AddEditClassSeries'>;

const DAYS = [
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
  { label: 'S', value: 0 },
];

function ErrorText({ msg }: { msg: string }) {
  return <Text variant="bodySmall" style={{ color: Brand.pink, marginTop: Spacing.xs }}>{msg}</Text>;
}

export default function AddEditClassSeriesScreen() {
  const { accentPalette } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const didInitialFocus = useRef(false);
  const { seriesId } = route.params ?? {};
  const isEdit = !!seriesId;

  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);

  const [title, setTitle] = useState('');
  const [selectedClassTypeId, setSelectedClassTypeId] = useState<number | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>('manager');
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);
  const [selectedCenterId, setSelectedCenterId] = useState<number | null>(null);
  const [selectedTraineeIds, setSelectedTraineeIds] = useState<number[]>([]);
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>('weekly');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [classTime, setClassTime] = useState('');
  const [duration, setDuration] = useState(String(DEFAULT_DURATION_MINUTES));
  const [locationType, setLocationType] = useState<LocationType>('offline');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [endSeriesVisible, setEndSeriesVisible] = useState(false);
  const [classTypePickerVisible, setClassTypePickerVisible] = useState(false);
  const [managerPickerVisible, setManagerPickerVisible] = useState(false);
  const [traineePickerVisible, setTraineePickerVisible] = useState(false);
  const [centerPickerVisible, setCenterPickerVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const loadPickerData = useCallback(async () => {
    const [types, mgrs, traineeList, centerList] = await Promise.all([
      getAllClassTypes(),
      getAllManagers(),
      getAllTrainees(),
      getAllCenters(),
    ]);
    setClassTypes(types);
    setManagers(mgrs);
    setTrainees(traineeList);
    setCenters(centerList);
    return { types, mgrs, traineeList, centerList };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const { types } = await loadPickerData();

      if (seriesId) {
        navigation.setOptions({ title: 'Edit Class Series' });
        const [s, linkedTrainees] = await Promise.all([
          getClassSeriesById(seriesId),
          getTraineesForSeries(seriesId),
        ]);
        if (s) {
          setTitle(s.title);
          setSelectedClassTypeId(s.class_type_id);
          setSourceType(s.source_type);
          setSelectedManagerId(s.manager_id ?? null);
          setSelectedCenterId(s.center_id ?? null);
          setRecurrenceType(s.recurrence_type);
          setSelectedDays(s.recurrence_days ? (JSON.parse(s.recurrence_days) as number[]) : []);
          setStartDate(s.start_date);
          setEndDate(s.end_date ?? '');
          setClassTime(s.class_time);
          setDuration(String(s.duration_minutes));
          setLocationType(s.location_type);
          setLocation(s.location ?? '');
          setNotes(s.notes ?? '');
          setSelectedTraineeIds(linkedTrainees.map((t) => t.id));
        }
      } else {
        navigation.setOptions({ title: 'New Class Series' });
        if (types.length > 0) setSelectedClassTypeId(types[0].id);
      }
    } catch {
      Alert.alert('Error', 'Could not load form data. Please go back and try again.');
    }
  }, [seriesId, navigation, loadPickerData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(useCallback(() => {
    if (!didInitialFocus.current) {
      didInitialFocus.current = true;
      return;
    }
    loadPickerData().catch(() => {
      Alert.alert('Error', 'Could not refresh form data. Please go back and try again.');
    });
  }, [loadPickerData]));

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort((a, b) => a - b)
    );
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!selectedClassTypeId) errs.classType = 'Select a class type';
    if (sourceType === 'manager' && !selectedManagerId) errs.manager = 'Select a manager';
    if (recurrenceType !== 'daily' && selectedDays.length === 0) {
      errs.days = 'Select at least one day';
    }
    if (!startDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      errs.startDate = 'Enter start date as YYYY-MM-DD';
    }
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      errs.endDate = 'Enter end date as YYYY-MM-DD or leave blank';
    }
    if (!classTime.trim() || !/^\d{2}:\d{2}$/.test(classTime)) {
      errs.classTime = 'Enter time as HH:MM (24h)';
    }
    const dur = parseInt(duration, 10);
    if (isNaN(dur) || dur < 1) errs.duration = 'Enter a valid duration';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const recurrenceDays =
        recurrenceType === 'daily' ? null : JSON.stringify(selectedDays);
      const data = {
        title: title.trim(),
        class_type_id: selectedClassTypeId!,
        source_type: sourceType,
        manager_id: sourceType === 'manager' ? selectedManagerId ?? undefined : undefined,
        center_id: sourceType === 'manager' ? selectedCenterId ?? undefined : undefined,
        recurrence_type: recurrenceType,
        recurrence_days: recurrenceDays ?? undefined,
        start_date: startDate,
        end_date: endDate.trim() || undefined,
        class_time: classTime,
        duration_minutes: parseInt(duration, 10),
        location_type: locationType,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        is_active: 1,
      };

      const dates = generateSessionDates(
        startDate,
        recurrenceType,
        recurrenceType === 'daily' ? [] : selectedDays,
        endDate.trim() || undefined
      );

      let savedSeriesId: number;
      if (isEdit) {
        await updateClassSeries(seriesId!, data);
        await deleteUpcomingSessionsForSeries(seriesId!);
        await createSessionsBatch(seriesId!, dates, classTime);
        savedSeriesId = seriesId!;
      } else {
        const created = await createClassSeries(data);
        await createSessionsBatch(created.id, dates, classTime);
        savedSeriesId = created.id;
      }

      if (sourceType === 'personal') {
        await setTraineesForSeries(savedSeriesId, selectedTraineeIds);
      }

      await scheduleUpcomingNotifications();

      if (sourceType === 'personal' && selectedTraineeIds.length > 0) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const packages = await Promise.all(
          selectedTraineeIds.map((tid) => getActivePackageForTrainee(tid, currentMonth))
        );

        const alerts: string[] = [];

        const packagesWithData = packages.filter((p): p is TraineePackage => p !== null);
        if (packagesWithData.length > 0) {
          const remainings = packagesWithData.map((p) => p.total_sessions - p.used_sessions);
          const minRemaining = Math.min(...remainings);
          if (dates.length > minRemaining) {
            const minIdx = remainings.indexOf(minRemaining);
            const minTid = packagesWithData[minIdx].trainee_id;
            const tname = trainees.find((t) => t.id === minTid)?.name ?? 'A trainee';
            alerts.push(
              `Session overflow: This series will create ${dates.length} sessions. ${tname}'s active package covers ${minRemaining} more. Extra sessions can be skipped from the calendar.`
            );
          }
        }

        const missing = selectedTraineeIds
          .filter((_, i) => packages[i] === null)
          .map((tid) => trainees.find((t) => t.id === tid)?.name)
          .filter((n): n is string => n !== undefined);

        if (missing.length > 0) {
          const monthDisplay = new Date(currentMonth + '-15').toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
          });
          alerts.push(
            `No package for ${monthDisplay}: ${missing.join(', ')}. Add packages from the Trainees screen.`
          );
        }

        if (alerts.length > 0) {
          Alert.alert('Heads Up', alerts.join('\n\n'), [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
          return;
        }
      }

      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  async function handleEndSeries() {
    if (!seriesId) return;
    try {
      await deactivateClassSeries(seriesId);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not end series. Please try again.');
    }
  }

  function dateToISO(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function displayDate(iso: string): string {
    if (!iso) return 'Select date';
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function displayTime(time: string): string {
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return 'Select time';
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  }

  const selectedClassType = classTypes.find((ct) => ct.id === selectedClassTypeId);
  const selectedManager = managers.find((m) => m.id === selectedManagerId);
  const selectedCenter = centers.find((c) => c.id === selectedCenterId);

  const classTypePickerItems = useMemo(
    () => classTypes.map((ct) => ({ id: ct.id, label: ct.name, leftColor: ct.color })),
    [classTypes]
  );
  const managerPickerItems = useMemo(
    () => managers.map((m) => ({ id: m.id, label: m.name })),
    [managers]
  );
  const traineePickerItems = useMemo(
    () => trainees.map((t) => ({ id: t.id, label: t.name })),
    [trainees]
  );
  const centerPickerItems = useMemo(
    () => centers.map((c) => ({ id: c.id, label: c.name, hint: c.address })),
    [centers]
  );

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior="padding"
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Class Info section */}
          <SectionHeader label="Class Info" />
          <View style={styles.card}>
            <TextInput
              label="Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              dense
              error={!!errors.title}
            />
            {errors.title ? <ErrorText msg={errors.title} /> : null}

            <View style={styles.fieldGap} />
            <Text variant="labelMedium" style={styles.fieldLabel}>Class Type *</Text>
            <PickerField
              placeholder="Select class type..."
              value={selectedClassType?.name}
              leftColor={selectedClassType?.color}
              onPress={() => setClassTypePickerVisible(true)}
              error={!!errors.classType}
            />
            {errors.classType ? <ErrorText msg={errors.classType} /> : null}

            <View style={styles.fieldGap} />
            <Text variant="labelMedium" style={styles.fieldLabel}>Source</Text>
            <ThemedSegmentedButtons
              value={sourceType}
              onValueChange={(v: string) => setSourceType(v as SourceType)}
              buttons={[
                { value: 'manager', label: 'Manager' },
                { value: 'personal', label: 'Personal' },
              ]}
            />

            {sourceType === 'manager' && (
              <>
                <View style={styles.fieldGap} />
                <Text variant="labelMedium" style={styles.fieldLabel}>Manager *</Text>
                <PickerField
                  placeholder="Select manager..."
                  value={selectedManager?.name}
                  onPress={() => setManagerPickerVisible(true)}
                  error={!!errors.manager}
                />
                {errors.manager ? <ErrorText msg={errors.manager} /> : null}

                <View style={styles.fieldGap} />
                <Text variant="labelMedium" style={styles.fieldLabel}>Center (optional)</Text>
                <PickerField
                  placeholder="Select center..."
                  value={selectedCenter?.name}
                  onPress={() => setCenterPickerVisible(true)}
                  onClear={selectedCenterId !== null ? () => setSelectedCenterId(null) : undefined}
                />
              </>
            )}

            {sourceType === 'personal' && (
              <>
                <View style={styles.fieldGap} />
                <Text variant="labelMedium" style={styles.fieldLabel}>Trainees (optional)</Text>
                <PickerField
                  placeholder="Select trainees..."
                  value={selectedTraineeIds.length === 0 ? undefined
                    : selectedTraineeIds.length === 1
                    ? trainees.find((t) => t.id === selectedTraineeIds[0])?.name ?? '1 trainee'
                    : `${selectedTraineeIds.length} trainees selected`}
                  onPress={() => setTraineePickerVisible(true)}
                />
              </>
            )}
          </View>

          {/* Schedule section */}
          <SectionHeader label="Schedule" />
          <View style={styles.card}>
            <Text variant="labelMedium" style={styles.fieldLabel}>Recurrence</Text>
            <ThemedSegmentedButtons
              value={recurrenceType}
              onValueChange={(v: string) => setRecurrenceType(v as RecurrenceType)}
              buttons={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'custom', label: 'Custom' },
              ]}
            />

            {recurrenceType !== 'daily' && (
              <>
                <View style={styles.fieldGap} />
                <Text variant="labelMedium" style={styles.fieldLabel}>Days *</Text>
                <View style={styles.daysRow}>
                  {DAYS.map((d) => {
                    const active = selectedDays.includes(d.value);
                    return (
                      <TouchableOpacity
                        key={d.value}
                        onPress={() => toggleDay(d.value)}
                        style={[
                          styles.dayButton,
                          d.value !== DAYS[0].value && { marginLeft: -1 },
                          active
                            ? { backgroundColor: accentPalette.main, borderColor: accentPalette.main }
                            : { backgroundColor: 'transparent', borderColor: Brand.borderSubtle },
                        ]}
                      >
                        <Text style={{ ...Typography.labelMd, color: active ? Brand.textPrimary : Brand.textSecondary }}>
                          {d.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {errors.days ? <ErrorText msg={errors.days} /> : null}
              </>
            )}

            <View style={styles.fieldGap} />
            <View style={styles.twoColRow}>
              <View style={styles.twoColCell}>
                <Text variant="labelMedium" style={styles.fieldLabel}>Start Date *</Text>
                <PickerField
                  placeholder="Select date"
                  value={displayDate(startDate)}
                  onPress={() => setShowStartDatePicker(true)}
                  error={!!errors.startDate}
                />
                {errors.startDate ? <ErrorText msg={errors.startDate} /> : null}
              </View>
              <View style={styles.twoColCell}>
                <Text variant="labelMedium" style={styles.fieldLabel}>End Date (optional)</Text>
                <PickerField
                  placeholder="Ongoing"
                  value={endDate ? displayDate(endDate) : undefined}
                  onPress={() => setShowEndDatePicker(true)}
                  onClear={endDate ? () => setEndDate('') : undefined}
                />
                {errors.endDate ? <ErrorText msg={errors.endDate} /> : null}
              </View>
            </View>

            <View style={styles.fieldGap} />
            <View style={styles.twoColRow}>
              <View style={styles.twoColCell}>
                <Text variant="labelMedium" style={styles.fieldLabel}>Class Time *</Text>
                <PickerField
                  placeholder="Select time"
                  value={displayTime(classTime)}
                  onPress={() => setShowTimePicker(true)}
                  error={!!errors.classTime}
                />
                {errors.classTime ? <ErrorText msg={errors.classTime} /> : null}
              </View>
              <View style={styles.twoColCell}>
                <Text variant="labelMedium" style={styles.fieldLabel}>Duration (min)</Text>
                <TextInput
                  value={duration}
                  onChangeText={setDuration}
                  mode="outlined"
                  keyboardType="numeric"
                  dense
                  error={!!errors.duration}
                />
                {errors.duration ? <ErrorText msg={errors.duration} /> : null}
              </View>
            </View>
          </View>

          {/* Location section */}
          <SectionHeader label="Location" />
          <View style={styles.card}>
            <TextInput
              label="Address (optional)"
              value={location}
              onChangeText={setLocation}
              mode="outlined"
              dense
            />
          </View>

          {/* Notes section */}
          <SectionHeader label="Notes" />
          <View style={styles.card}>
            <TextInput
              label="Notes (optional)"
              value={notes}
              onChangeText={setNotes}
              mode="outlined"
              multiline
              numberOfLines={3}
            />
          </View>

          {isEdit && (
            <View style={styles.seriesStatusActions}>
              <AppButton
                variant="secondary"
                label="End Series"
                onPress={() => setEndSeriesVisible(true)}
                fullWidth={false}
                color={Brand.textSecondary}
                style={styles.endSeriesButton}
              />
            </View>
          )}

          <View style={{ height: Spacing.lg }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
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
            style={styles.saveBtn}
          />
        </View>
      </KeyboardAvoidingView>

      {/* Date pickers */}
      <ThemedDatePickerModal
        visible={showStartDatePicker}
        value={startDate}
        title="Start Date"
        onConfirm={(date) => {
          setShowStartDatePicker(false);
          setStartDate(date);
        }}
        onDismiss={() => setShowStartDatePicker(false)}
      />
      <ThemedDatePickerModal
        visible={showEndDatePicker}
        value={endDate || dateToISO(new Date())}
        title="End Date"
        minDate={startDate}
        onConfirm={(date) => {
          setShowEndDatePicker(false);
          setEndDate(date);
        }}
        onDismiss={() => setShowEndDatePicker(false)}
      />
      <ThemedTimePickerModal
        visible={showTimePicker}
        value={classTime || '09:00'}
        onConfirm={(time) => {
          setShowTimePicker(false);
          setClassTime(time);
        }}
        onDismiss={() => setShowTimePicker(false)}
      />

      <PickerModal
        visible={classTypePickerVisible}
        onDismiss={() => setClassTypePickerVisible(false)}
        title="Select Class Type"
        items={classTypePickerItems}
        selectedIds={selectedClassTypeId ? [selectedClassTypeId] : []}
        onSelect={(ids) => { if (ids[0] !== undefined) setSelectedClassTypeId(ids[0]); }}
        onAddNew={() => { setClassTypePickerVisible(false); navigation.navigate('ClassTypes'); }}
        addNewLabel="Manage Class Types"
      />

      <PickerModal
        visible={managerPickerVisible}
        onDismiss={() => setManagerPickerVisible(false)}
        title="Select Manager"
        items={managerPickerItems}
        selectedIds={selectedManagerId ? [selectedManagerId] : []}
        onSelect={(ids) => { if (ids[0] !== undefined) setSelectedManagerId(ids[0]); }}
        onAddNew={() => { setManagerPickerVisible(false); navigation.navigate('AddEditManager', {}); }}
        addNewLabel="Add New Manager"
        showAvatar
      />

      <PickerModal
        visible={traineePickerVisible}
        onDismiss={() => setTraineePickerVisible(false)}
        title="Select Trainees"
        items={traineePickerItems}
        selectedIds={selectedTraineeIds}
        multiSelect
        onSelect={(ids) => setSelectedTraineeIds(ids)}
        onAddNew={() => { setTraineePickerVisible(false); navigation.navigate('AddEditTrainee', {}); }}
        addNewLabel="Add New Trainee"
        showAvatar
      />

      <PickerModal
        visible={centerPickerVisible}
        onDismiss={() => setCenterPickerVisible(false)}
        title="Select Center"
        items={centerPickerItems}
        selectedIds={selectedCenterId !== null ? [selectedCenterId] : []}
        onSelect={(ids) => setSelectedCenterId(ids[0] ?? null)}
        onAddNew={() => { setCenterPickerVisible(false); navigation.navigate('Centers'); }}
        addNewLabel="Manage Centers"
        leadingIcon="buildings"
      />

      <LoadingOverlay visible={saving} />

      <ConfirmDialog
        visible={endSeriesVisible}
        title="End Series"
        message="This will stop future sessions for this series. Existing sessions and payment history will remain."
        confirmLabel="End Series"
        onConfirm={handleEndSeries}
        onDismiss={() => setEndSeriesVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  content: { padding: Spacing.lg },
  card: {
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    padding: Spacing.lg,
  },
  fieldLabel: { color: Brand.textSecondary, marginBottom: Spacing.xs },
  fieldGap: { height: Spacing.sm },
  daysRow: { flexDirection: 'row' },
  dayButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius.sm,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    borderColor: Brand.borderSubtle,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: Layout.INPUT_HEIGHT,
    justifyContent: 'center',
  },
  pickerError: { borderColor: Brand.pink },
  endDateRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  twoColRow: { flexDirection: 'row', gap: Spacing.md },
  twoColCell: { flex: 1 },
  pickerSelected: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  colorDot: { width: 16, height: 16, borderRadius: Radius.full },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Brand.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
  },
  seriesStatusActions: {
    marginTop: Spacing.lg,
  },
  endSeriesButton: {
    borderColor: Brand.borderSubtle,
  },
  cancelBtn: { flex: 0, width: 100, justifyContent: 'center' },
  saveBtn: { flex: 1 },
});
