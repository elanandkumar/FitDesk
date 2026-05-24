import React, { useCallback, useEffect, useState } from 'react';
import { Modal as RNModal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import ThemedDatePickerModal from '../../components/common/ThemedDatePickerModal';
import ThemedTimePickerModal from '../../components/common/ThemedTimePickerModal';
import { List, SegmentedButtons, Surface, Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
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

export default function AddSessionScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

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
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Class Type */}
      <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
        Class Type *
      </Text>
      <TouchableOpacity
        onPress={() => setClassTypePickerVisible(true)}
        style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
      >
        {selectedClassType ? (
          <View style={styles.pickerSelected}>
            <View style={[styles.colorDot, { backgroundColor: selectedClassType.color }]} />
            <Text style={{ color: theme.colors.onSurface }}>{selectedClassType.name}</Text>
          </View>
        ) : (
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Select class type...</Text>
        )}
      </TouchableOpacity>

      {/* Title */}
      <TextInput
        label={`Title (default: ${selectedClassType?.name ?? 'Class'} (Ad-hoc))`}
        value={title}
        onChangeText={setTitle}
        mode="outlined"
        style={styles.input}
      />

      {/* Source */}
      <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
        Source *
      </Text>
      <SegmentedButtons
        value={sourceType}
        onValueChange={(v) => {
          setSourceType(v as SourceType);
          setManagerId(null);
        }}
        buttons={[
          { value: 'manager', label: 'Manager', style: { borderRadius: 4 } },
          { value: 'personal', label: 'Personal', style: { borderRadius: 4 } },
        ]}
        style={{ marginBottom: 8, borderRadius: 4 }}
      />

      {/* Manager */}
      {sourceType === 'manager' && (
        <>
          <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Manager *
          </Text>
          <TouchableOpacity
            onPress={() => setManagerPickerVisible(true)}
            style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
          >
            {selectedManager ? (
              <Text style={{ color: theme.colors.onSurface }}>{selectedManager.name}</Text>
            ) : managers.length === 0 ? (
              <Text style={{ color: theme.colors.onSurfaceVariant }}>No managers added yet</Text>
            ) : (
              <Text style={{ color: theme.colors.onSurfaceVariant }}>Select manager...</Text>
            )}
          </TouchableOpacity>
        </>
      )}

      {/* Date & Time */}
      <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
        Date & Time *
      </Text>
      <View style={styles.dateTimeRow}>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={[styles.pickerButton, styles.dateTimeCell, { borderColor: theme.colors.outline }]}
        >
          <Text style={{ color: theme.colors.onSurface }}>{displayDate(sessionDate)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowTimePicker(true)}
          style={[styles.pickerButton, styles.dateTimeCell, { borderColor: theme.colors.outline }]}
        >
          <Text style={{ color: theme.colors.onSurface }}>{timeToDisplay(classTime)}</Text>
        </TouchableOpacity>
      </View>

      {/* Duration */}
      <TextInput
        label="Duration (min) (optional)"
        value={duration}
        onChangeText={(v) => setDuration(v.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
      />

      {/* Location */}
      <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
        Location
      </Text>
      <SegmentedButtons
        value={locationType}
        onValueChange={(v) => setLocationType(v as LocationType)}
        buttons={[
          { value: 'offline', label: 'In-person', style: { borderRadius: 4 } },
          { value: 'online', label: 'Online', style: { borderRadius: 4 } },
        ]}
        style={{ marginBottom: 8, borderRadius: 4 }}
      />
      <TextInput
        label="Location / Link (optional)"
        value={location}
        onChangeText={setLocation}
        mode="outlined"
        style={styles.input}
      />

      {/* Notes */}
      <TextInput
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={2}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.cancelBtn, { borderColor: theme.colors.outline }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: theme.colors.onSurface }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.saveBtn,
            { backgroundColor: isValid && !saving ? theme.colors.primary : theme.colors.surfaceDisabled },
          ]}
          onPress={handleSave}
          disabled={!isValid || saving}
        >
          <Text style={{ color: isValid && !saving ? theme.colors.onPrimary : theme.colors.onSurfaceDisabled }}>
            {saving ? 'Saving...' : 'Add Session'}
          </Text>
        </TouchableOpacity>
      </View>

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
          <Surface style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={[styles.sheetTitle, { color: theme.colors.onSurface }]}>
              Select Class Type
            </Text>
            {classTypes.map((ct) => (
              <List.Item
                key={ct.id}
                title={ct.name}
                titleStyle={{ color: theme.colors.onSurface }}
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
          <Surface style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={[styles.sheetTitle, { color: theme.colors.onSurface }]}>
              Select Manager
            </Text>
            {managers.map((m) => (
              <List.Item
                key={m.id}
                title={m.name}
                titleStyle={{ color: theme.colors.onSurface }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 4 },
  label: { marginBottom: 6, marginTop: 8 },
  input: { marginBottom: 4 },
  pickerButton: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 14,
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: 8,
  },
  pickerSelected: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
  dateTimeRow: { flexDirection: 'row', gap: 8 },
  dateTimeCell: { flex: 1 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16, marginBottom: 8 },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: { borderWidth: 1 },
  saveBtn: {},
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  sheetTitle: { padding: 16, paddingBottom: 8 },
});
