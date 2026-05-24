import React, { useCallback, useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import ThemedDatePickerModal from '../../components/common/ThemedDatePickerModal';
import ThemedTimePickerModal from '../../components/common/ThemedTimePickerModal';
import {
  Button,
  List,
  SegmentedButtons,
  Surface,
  Text,
  TextInput,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { ClassType, Manager, RecurrenceType, LocationType, SourceType } from '../../types';
import { getAllClassTypes } from '../../database/repositories/classTypeRepository';
import { getAllManagers } from '../../database/repositories/managerRepository';
import {
  createClassSeries,
  updateClassSeries,
  getClassSeriesById,
  deactivateClassSeries,
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

function FormSection({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

function ErrorText({ msg }: { msg: string }) {
  return <Text variant="bodySmall" style={{ color: Brand.pink, marginTop: 2 }}>{msg}</Text>;
}

export default function AddEditClassSeriesScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { seriesId } = route.params ?? {};
  const isEdit = !!seriesId;

  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);

  const [title, setTitle] = useState('');
  const [selectedClassTypeId, setSelectedClassTypeId] = useState<number | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>('manager');
  const [selectedManagerId, setSelectedManagerId] = useState<number | null>(null);
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
  const [cancelVisible, setCancelVisible] = useState(false);
  const [classTypePickerVisible, setClassTypePickerVisible] = useState(false);
  const [managerPickerVisible, setManagerPickerVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [types, mgrs] = await Promise.all([getAllClassTypes(), getAllManagers()]);
      setClassTypes(types);
      setManagers(mgrs);

      if (seriesId) {
        navigation.setOptions({ title: 'Edit Class Series' });
        const s = await getClassSeriesById(seriesId);
        if (s) {
          setTitle(s.title);
          setSelectedClassTypeId(s.class_type_id);
          setSourceType(s.source_type);
          setSelectedManagerId(s.manager_id ?? null);
          setRecurrenceType(s.recurrence_type);
          setSelectedDays(s.recurrence_days ? (JSON.parse(s.recurrence_days) as number[]) : []);
          setStartDate(s.start_date);
          setEndDate(s.end_date ?? '');
          setClassTime(s.class_time);
          setDuration(String(s.duration_minutes));
          setLocationType(s.location_type);
          setLocation(s.location ?? '');
          setNotes(s.notes ?? '');
        }
      } else {
        navigation.setOptions({ title: 'New Class Series' });
        if (types.length > 0) setSelectedClassTypeId(types[0].id);
      }
    } catch {
      Alert.alert('Error', 'Could not load form data. Please go back and try again.');
    }
  }, [seriesId, navigation]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

      if (isEdit) {
        await updateClassSeries(seriesId!, data);
        await deleteUpcomingSessionsForSeries(seriesId!);
        await createSessionsBatch(seriesId!, dates, classTime);
      } else {
        const created = await createClassSeries(data);
        await createSessionsBatch(created.id, dates, classTime);
      }

      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  async function handleCancelSeries() {
    if (!seriesId) return;
    try {
      await deactivateClassSeries(seriesId);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not cancel series. Please try again.');
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

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Class Info section */}
          <FormSection label="Class Info" />
          <View style={styles.card}>
            <TextInput
              label="Title *"
              value={title}
              onChangeText={setTitle}
              mode="outlined"
              error={!!errors.title}
            />
            {errors.title ? <ErrorText msg={errors.title} /> : null}

            <View style={styles.fieldGap} />
            <Text variant="labelMedium" style={styles.fieldLabel}>Class Type *</Text>
            <TouchableOpacity
              onPress={() => setClassTypePickerVisible(true)}
              style={[styles.pickerButton, errors.classType ? styles.pickerError : {}]}
            >
              {selectedClassType ? (
                <View style={styles.pickerSelected}>
                  <View style={[styles.colorDot, { backgroundColor: selectedClassType.color }]} />
                  <Text style={{ color: Brand.textPrimary }}>{selectedClassType.name}</Text>
                </View>
              ) : (
                <Text style={{ color: Brand.textMuted }}>Select class type...</Text>
              )}
            </TouchableOpacity>
            {errors.classType ? <ErrorText msg={errors.classType} /> : null}

            <View style={styles.fieldGap} />
            <Text variant="labelMedium" style={styles.fieldLabel}>Source</Text>
            <SegmentedButtons
              value={sourceType}
              onValueChange={(v) => setSourceType(v as SourceType)}
              buttons={[
                { value: 'manager', label: 'Manager' },
                { value: 'personal', label: 'Personal' },
              ]}
              theme={{ colors: { secondaryContainer: Brand.purple, onSecondaryContainer: Brand.textPrimary } }}
            />

            {sourceType === 'manager' && (
              <>
                <View style={styles.fieldGap} />
                <Text variant="labelMedium" style={styles.fieldLabel}>Manager *</Text>
                <TouchableOpacity
                  onPress={() => setManagerPickerVisible(true)}
                  style={[styles.pickerButton, errors.manager ? styles.pickerError : {}]}
                >
                  {selectedManager ? (
                    <Text style={{ color: Brand.textPrimary }}>{selectedManager.name}</Text>
                  ) : (
                    <Text style={{ color: Brand.textMuted }}>Select manager...</Text>
                  )}
                </TouchableOpacity>
                {errors.manager ? <ErrorText msg={errors.manager} /> : null}
              </>
            )}
          </View>

          {/* Schedule section */}
          <FormSection label="Schedule" />
          <View style={styles.card}>
            <Text variant="labelMedium" style={styles.fieldLabel}>Recurrence</Text>
            <SegmentedButtons
              value={recurrenceType}
              onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}
              buttons={[
                { value: 'daily', label: 'Daily' },
                { value: 'weekly', label: 'Weekly' },
                { value: 'custom', label: 'Custom' },
              ]}
              theme={{ colors: { secondaryContainer: Brand.purple, onSecondaryContainer: Brand.textPrimary } }}
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
                            ? { backgroundColor: Brand.purple, borderColor: Brand.purple }
                            : { backgroundColor: 'transparent', borderColor: Brand.borderSubtle },
                        ]}
                      >
                        <Text style={{ color: active ? Brand.textPrimary : Brand.textSecondary, fontSize: 13 }}>
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
                <TouchableOpacity
                  onPress={() => setShowStartDatePicker(true)}
                  style={[styles.pickerButton, errors.startDate ? styles.pickerError : {}]}
                >
                  <Text style={{ color: startDate ? Brand.textPrimary : Brand.textMuted }}>
                    {displayDate(startDate)}
                  </Text>
                </TouchableOpacity>
                {errors.startDate ? <ErrorText msg={errors.startDate} /> : null}
              </View>
              <View style={styles.twoColCell}>
                <Text variant="labelMedium" style={styles.fieldLabel}>End Date (optional)</Text>
                <TouchableOpacity
                  onPress={() => setShowEndDatePicker(true)}
                  style={[styles.pickerButton, styles.endDateRow]}
                >
                  <Text style={{ color: endDate ? Brand.textPrimary : Brand.textMuted, flex: 1 }}>
                    {endDate ? displayDate(endDate) : 'Ongoing'}
                  </Text>
                  {endDate ? (
                    <TouchableOpacity
                      onPress={() => setEndDate('')}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={{ color: Brand.textMuted, fontSize: 16, lineHeight: 20 }}>✕</Text>
                    </TouchableOpacity>
                  ) : null}
                </TouchableOpacity>
                {errors.endDate ? <ErrorText msg={errors.endDate} /> : null}
              </View>
            </View>

            <View style={styles.fieldGap} />
            <View style={styles.twoColRow}>
              <View style={styles.twoColCell}>
                <Text variant="labelMedium" style={styles.fieldLabel}>Class Time *</Text>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(true)}
                  style={[styles.pickerButton, errors.classTime ? styles.pickerError : {}]}
                >
                  <Text style={{ color: classTime ? Brand.textPrimary : Brand.textMuted }}>
                    {displayTime(classTime)}
                  </Text>
                </TouchableOpacity>
                {errors.classTime ? <ErrorText msg={errors.classTime} /> : null}
              </View>
              <View style={styles.twoColCell}>
                <Text variant="labelMedium" style={styles.fieldLabel}>Duration (min)</Text>
                <TextInput
                  value={duration}
                  onChangeText={setDuration}
                  mode="outlined"
                  keyboardType="numeric"
                  error={!!errors.duration}
                  dense
                />
                {errors.duration ? <ErrorText msg={errors.duration} /> : null}
              </View>
            </View>
          </View>

          {/* Location section */}
          <FormSection label="Location" />
          <View style={styles.card}>
            <SegmentedButtons
              value={locationType}
              onValueChange={(v) => setLocationType(v as LocationType)}
              buttons={[
                { value: 'offline', label: 'Offline' },
                { value: 'online', label: 'Online' },
              ]}
              theme={{ colors: { secondaryContainer: Brand.purple, onSecondaryContainer: Brand.textPrimary } }}
            />
            <View style={styles.fieldGap} />
            <TextInput
              label={locationType === 'offline' ? 'Address (optional)' : 'Meeting link (optional)'}
              value={location}
              onChangeText={setLocation}
              mode="outlined"
            />
          </View>

          {/* Notes section */}
          <FormSection label="Notes" />
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
            <Button
              mode="outlined"
              onPress={() => setCancelVisible(true)}
              textColor={Brand.pink}
              style={{ borderColor: Brand.pink, marginTop: 8 }}
            >
              Cancel This Series
            </Button>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.cancelBtn}
            textColor={Brand.textSecondary}
          >
            Cancel
          </Button>
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

      {/* Class Type Picker Modal */}
      <Modal
        visible={classTypePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setClassTypePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          onPress={() => setClassTypePickerVisible(false)}
          activeOpacity={1}
        >
          <Surface style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Class Type</Text>
            {classTypes.map((ct) => (
              <List.Item
                key={ct.id}
                title={ct.name}
                titleStyle={{ color: Brand.textPrimary }}
                left={() => (
                  <View style={[styles.colorDot, { backgroundColor: ct.color, marginVertical: 'auto', marginLeft: 8 }]} />
                )}
                onPress={() => {
                  setSelectedClassTypeId(ct.id);
                  setClassTypePickerVisible(false);
                }}
              />
            ))}
          </Surface>
        </TouchableOpacity>
      </Modal>

      {/* Manager Picker Modal */}
      <Modal
        visible={managerPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setManagerPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          onPress={() => setManagerPickerVisible(false)}
          activeOpacity={1}
        >
          <Surface style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Select Manager</Text>
            {managers.map((m) => (
              <List.Item
                key={m.id}
                title={m.name}
                titleStyle={{ color: Brand.textPrimary }}
                onPress={() => {
                  setSelectedManagerId(m.id);
                  setManagerPickerVisible(false);
                }}
              />
            ))}
          </Surface>
        </TouchableOpacity>
      </Modal>

      <LoadingOverlay visible={saving} />

      <ConfirmDialog
        visible={cancelVisible}
        title="Cancel Series"
        message="Mark this series as cancelled? Existing sessions will remain but no new ones will be generated."
        confirmLabel="Cancel Series"
        onConfirm={handleCancelSeries}
        onDismiss={() => setCancelVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  content: { padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 20,
  },
  sectionAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: Brand.orange },
  sectionLabel: {
    color: Brand.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Brand.surfaceDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    padding: 14,
  },
  fieldLabel: { color: Brand.textSecondary, marginBottom: 6 },
  fieldGap: { height: 10 },
  daysRow: { flexDirection: 'row' },
  dayButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 4,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerButton: {
    borderWidth: 1,
    borderRadius: 8,
    borderColor: Brand.borderSubtle,
    padding: 14,
    minHeight: 52,
    justifyContent: 'center',
  },
  pickerError: { borderColor: Brand.pink },
  endDateRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  twoColRow: { flexDirection: 'row', gap: 12 },
  twoColCell: { flex: 1 },
  pickerSelected: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Brand.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
  },
  cancelBtn: { flex: 0, width: 100, borderColor: Brand.borderSubtle, justifyContent: 'center' },
  saveBtn: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Brand.surfaceElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '60%',
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
  },
  modalTitle: {
    padding: 16,
    paddingBottom: 8,
    color: Brand.textPrimary,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 15,
  },
});
