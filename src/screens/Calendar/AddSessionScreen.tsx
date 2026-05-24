import React, { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal as RNModal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import ThemedDatePickerModal from '../../components/common/ThemedDatePickerModal';
import ThemedTimePickerModal from '../../components/common/ThemedTimePickerModal';
import { Button, List, SegmentedButtons, Surface, Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, Radius } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { ClassType, LocationType, Manager, SourceType } from '../../types';
import { getAllClassTypes } from '../../database/repositories/classTypeRepository';
import { getAllManagers } from '../../database/repositories/managerRepository';
import {
  AdHocSessionInput,
  createAdHocSession,
} from '../../database/repositories/classSessionRepository';
import { todayISO } from '../../utils/dateUtils';
import { DEFAULT_DURATION_MINUTES } from '../../constants';
import { scheduleUpcomingNotifications } from '../../notifications/scheduler';
import GradientButton from '../../components/common/GradientButton';

type Nav = StackNavigationProp<RootStackParamList, 'AddSession'>;
type Route = RouteProp<RootStackParamList, 'AddSession'>;

function isoToDate(iso: string): Date {
  return new Date(iso + 'T00:00:00');
}

function dateToISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function timeToDisplay(hhmm: string): string {
  if (!hhmm) return 'Select time';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

function displayDate(iso: string): string {
  if (!iso) return 'Select date';
  return isoToDate(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function FormSection({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

export default function AddSessionScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [classTypePickerVisible, setClassTypePickerVisible] = useState(false);
  const [managerPickerVisible, setManagerPickerVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const [classTypeId, setClassTypeId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('manager');
  const [managerId, setManagerId] = useState<number | null>(null);
  const [sessionDate, setSessionDate] = useState(route.params?.initialDate ?? todayISO());
  const [classTime, setClassTime] = useState('09:00');
  const [duration, setDuration] = useState(String(DEFAULT_DURATION_MINUTES));
  const [locationType, setLocationType] = useState<LocationType>('offline');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const selectedClassType = classTypes.find((ct) => ct.id === classTypeId);
  const selectedManager = managers.find((m) => m.id === managerId);

  const load = useCallback(async () => {
    const [types, mgrs] = await Promise.all([getAllClassTypes(), getAllManagers()]);
    setClassTypes(types);
    setManagers(mgrs);
  }, []);

  useEffect(() => {
    navigation.setOptions({ title: 'Add Session' });
    load();
  }, [navigation, load]);

  const isValid =
    classTypeId !== null &&
    sessionDate.length === 10 &&
    classTime.length === 5 &&
    (sourceType === 'personal' || managerId !== null);

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const input: AdHocSessionInput = {
        title: title.trim() || `${selectedClassType?.name ?? 'Class'} (Ad-hoc)`,
        classTypeId: classTypeId!,
        sourceType,
        managerId: sourceType === 'manager' ? (managerId ?? undefined) : undefined,
        sessionDate,
        classTime,
        durationMinutes: parseInt(duration, 10) || DEFAULT_DURATION_MINUTES,
        locationType,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      await createAdHocSession(input);
      await scheduleUpcomingNotifications();
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior="padding"
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Session Info section */}
        <FormSection label="Session Info" />
        <View style={styles.card}>
          <Text variant="labelMedium" style={styles.fieldLabel}>Class Type *</Text>
          <TouchableOpacity
            onPress={() => setClassTypePickerVisible(true)}
            style={styles.pickerButton}
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

          <View style={styles.fieldGap} />
          <TextInput
            label={`Title (default: ${selectedClassType?.name ?? 'Class'} (Ad-hoc))`}
            value={title}
            onChangeText={setTitle}
            mode="outlined"
          />

          <View style={styles.fieldGap} />
          <Text variant="labelMedium" style={styles.fieldLabel}>Source *</Text>
          <SegmentedButtons
            value={sourceType}
            onValueChange={(v) => {
              setSourceType(v as SourceType);
              setManagerId(null);
            }}
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
                style={styles.pickerButton}
              >
                {selectedManager ? (
                  <Text style={{ color: Brand.textPrimary }}>{selectedManager.name}</Text>
                ) : managers.length === 0 ? (
                  <Text style={{ color: Brand.textMuted }}>No managers added yet</Text>
                ) : (
                  <Text style={{ color: Brand.textMuted }}>Select manager...</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Date & Time section */}
        <FormSection label="Date & Time" />
        <View style={styles.card}>
          <View style={styles.twoColRow}>
            <View style={styles.twoColCell}>
              <Text variant="labelMedium" style={styles.fieldLabel}>Date *</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                style={styles.pickerButton}
              >
                <Text style={{ color: Brand.textPrimary }}>{displayDate(sessionDate)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.twoColCell}>
              <Text variant="labelMedium" style={styles.fieldLabel}>Time *</Text>
              <TouchableOpacity
                onPress={() => setShowTimePicker(true)}
                style={styles.pickerButton}
              >
                <Text style={{ color: Brand.textPrimary }}>{timeToDisplay(classTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.fieldGap} />
          <TextInput
            label="Duration (min) (optional)"
            value={duration}
            onChangeText={(v) => setDuration(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            mode="outlined"
          />
        </View>

        {/* Location section */}
        <FormSection label="Location" />
        <View style={styles.card}>
          <TextInput
            label="Address (optional)"
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
            numberOfLines={2}
          />
        </View>

        <View style={{ height: 16 }} />

        <ThemedDatePickerModal
          visible={showDatePicker}
          value={sessionDate}
          onConfirm={(date) => {
            setShowDatePicker(false);
            setSessionDate(date);
          }}
          onDismiss={() => setShowDatePicker(false)}
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

        {/* Class Type Picker */}
        <RNModal
          visible={classTypePickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setClassTypePickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => setClassTypePickerVisible(false)}
            activeOpacity={1}
          >
            <Surface style={styles.sheet}>
              <Text style={styles.sheetTitle}>Select Class Type</Text>
              {classTypes.map((ct) => (
                <List.Item
                  key={ct.id}
                  title={ct.name}
                  titleStyle={{ color: Brand.textPrimary }}
                  left={() => (
                    <View style={[styles.colorDot, { backgroundColor: ct.color, marginVertical: 'auto', marginLeft: 8 }]} />
                  )}
                  onPress={() => {
                    setClassTypeId(ct.id);
                    setClassTypePickerVisible(false);
                  }}
                />
              ))}
            </Surface>
          </TouchableOpacity>
        </RNModal>

        {/* Manager Picker */}
        <RNModal
          visible={managerPickerVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setManagerPickerVisible(false)}
        >
          <TouchableOpacity
            style={styles.backdrop}
            onPress={() => setManagerPickerVisible(false)}
            activeOpacity={1}
          >
            <Surface style={styles.sheet}>
              <Text style={styles.sheetTitle}>Select Manager</Text>
              {managers.map((m) => (
                <List.Item
                  key={m.id}
                  title={m.name}
                  titleStyle={{ color: Brand.textPrimary }}
                  onPress={() => {
                    setManagerId(m.id);
                    setManagerPickerVisible(false);
                  }}
                />
              ))}
            </Surface>
          </TouchableOpacity>
        </RNModal>
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
          label={saving ? 'Saving...' : 'Add Session'}
          onPress={handleSave}
          loading={saving}
          disabled={!isValid || saving}
          style={styles.saveBtn}
        />
      </View>
    </KeyboardAvoidingView>
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
  sectionAccent: { width: 3, height: 14, borderRadius: Radius.xs, backgroundColor: Brand.orange },
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
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    padding: 14,
  },
  fieldLabel: { color: Brand.textSecondary, marginBottom: 6 },
  fieldGap: { height: 10 },
  pickerButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    borderColor: Brand.borderSubtle,
    padding: 14,
    minHeight: 52,
    justifyContent: 'center',
  },
  pickerSelected: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 16, height: 16, borderRadius: Radius.full },
  twoColRow: { flexDirection: 'row', gap: 12 },
  twoColCell: { flex: 1 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Brand.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
  },
  cancelBtn: { flex: 0, width: 100, borderColor: Brand.borderSubtle, justifyContent: 'center', borderRadius: Radius.lg },
  saveBtn: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Brand.surfaceElevated,
    borderTopLeftRadius: Radius.item,
    borderTopRightRadius: Radius.item,
    paddingBottom: 32,
    maxHeight: '60%',
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
  },
  sheetTitle: {
    padding: 16,
    paddingBottom: 8,
    color: Brand.textPrimary,
    fontFamily: 'Montserrat_600SemiBold',
    fontSize: 15,
  },
});
