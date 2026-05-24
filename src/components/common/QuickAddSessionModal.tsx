import React, { useCallback, useEffect, useState } from 'react';
import { Modal as RNModal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import ThemedDatePickerModal from './ThemedDatePickerModal';
import ThemedTimePickerModal from './ThemedTimePickerModal';
import { Button, List, Modal, Portal, SegmentedButtons, Surface, Text, TextInput } from 'react-native-paper';
import { useAppTheme } from '../../theme';
import { ClassType, LocationType, Manager, SourceType } from '../../types';
import { getAllClassTypes } from '../../database/repositories/classTypeRepository';
import { getAllManagers } from '../../database/repositories/managerRepository';
import {
  AdHocSessionInput,
  createAdHocSession,
} from '../../database/repositories/classSessionRepository';
import { todayISO } from '../../utils/dateUtils';
import { DEFAULT_DURATION_MINUTES } from '../../constants';

interface Props {
  visible: boolean;
  initialDate?: string;
  onDismiss: () => void;
  onCreated: (sessionId: number) => void;
}

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

const EMPTY_FORM = {
  title: '',
  classTypeId: null as number | null,
  sourceType: 'manager' as SourceType,
  managerId: null as number | null,
  sessionDate: todayISO(),
  classTime: '09:00',
  duration: String(DEFAULT_DURATION_MINUTES),
  locationType: 'offline' as LocationType,
  location: '',
  notes: '',
};

export default function QuickAddSessionModal({ visible, initialDate, onDismiss, onCreated }: Props) {
  const { theme } = useAppTheme();
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [classTypePickerVisible, setClassTypePickerVisible] = useState(false);
  const [managerPickerVisible, setManagerPickerVisible] = useState(false);

  const load = useCallback(async () => {
    const [types, mgrs] = await Promise.all([getAllClassTypes(), getAllManagers()]);
    setClassTypes(types);
    setManagers(mgrs);
  }, []);

  useEffect(() => {
    if (visible) {
      setForm({ ...EMPTY_FORM, sessionDate: initialDate ?? todayISO() });
      load();
    }
  }, [visible, initialDate, load]);

  const selectedClassType = classTypes.find((ct) => ct.id === form.classTypeId);
  const selectedManager = managers.find((m) => m.id === form.managerId);

  const isValid =
    form.classTypeId !== null &&
    form.sessionDate.length === 10 &&
    form.classTime.length === 5 &&
    (form.sourceType === 'personal' || form.managerId !== null);

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const input: AdHocSessionInput = {
        title: form.title.trim() || `${selectedClassType?.name ?? 'Class'} (Ad-hoc)`,
        classTypeId: form.classTypeId!,
        sourceType: form.sourceType,
        managerId: form.sourceType === 'manager' ? (form.managerId ?? undefined) : undefined,
        sessionDate: form.sessionDate,
        classTime: form.classTime,
        durationMinutes: parseInt(form.duration, 10) || DEFAULT_DURATION_MINUTES,
        locationType: form.locationType,
        location: form.location.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      const sessionId = await createAdHocSession(input);
      onCreated(sessionId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
      >
        <Text variant="titleLarge" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
          Quick Add Session
        </Text>

        <View style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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
            value={form.title}
            onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
            mode="outlined"
            style={styles.input}
          />

          {/* Source */}
          <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Source *
          </Text>
          <SegmentedButtons
            value={form.sourceType}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, sourceType: v as SourceType, managerId: null }))
            }
            buttons={[
              { value: 'manager', label: 'Manager', style: { borderRadius: 4 } },
              { value: 'personal', label: 'Personal', style: { borderRadius: 4 } },
            ]}
            style={{ marginBottom: 8, borderRadius: 4 }}
          />

          {/* Manager picker */}
          {form.sourceType === 'manager' && (
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

          {/* Date & Time row */}
          <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Date & Time *
          </Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={[styles.pickerButton, styles.dateTimeCell, { borderColor: theme.colors.outline }]}
            >
              <Text style={{ color: theme.colors.onSurface }}>{displayDate(form.sessionDate)}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowTimePicker(true)}
              style={[styles.pickerButton, styles.dateTimeCell, { borderColor: theme.colors.outline }]}
            >
              <Text style={{ color: theme.colors.onSurface }}>{timeToDisplay(form.classTime)}</Text>
            </TouchableOpacity>
          </View>

          {/* Duration */}
          <TextInput
            label="Duration (min) (optional)"
            value={form.duration}
            onChangeText={(v) => setForm((f) => ({ ...f, duration: v.replace(/[^0-9]/g, '') }))}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />

          {/* Location type */}
          <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
            Location
          </Text>
          <SegmentedButtons
            value={form.locationType}
            onValueChange={(v) => setForm((f) => ({ ...f, locationType: v as LocationType }))}
            buttons={[
              { value: 'offline', label: 'In-person', style: { borderRadius: 4 } },
              { value: 'online', label: 'Online', style: { borderRadius: 4 } },
            ]}
            style={{ marginBottom: 8, borderRadius: 4 }}
          />
          <TextInput
            label="Location / Link (optional)"
            value={form.location}
            onChangeText={(v) => setForm((f) => ({ ...f, location: v }))}
            mode="outlined"
            style={styles.input}
          />

          {/* Notes */}
          <TextInput
            label="Notes (optional)"
            value={form.notes}
            onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={2}
          />

          <View style={styles.actions}>
            <Button onPress={onDismiss}>Cancel</Button>
            <Button
              mode="contained"
              onPress={handleSave}
              loading={saving}
              disabled={!isValid || saving}
            >
              Add Session
            </Button>
          </View>
        </ScrollView>
        </View>

      </Modal>

      <ThemedTimePickerModal
        visible={showTimePicker}
        value={form.classTime || '09:00'}
        onConfirm={(time) => {
          setShowTimePicker(false);
          setForm((f) => ({ ...f, classTime: time }));
        }}
        onDismiss={() => setShowTimePicker(false)}
      />

      <ThemedDatePickerModal
        visible={showDatePicker}
        value={form.sessionDate}
        onConfirm={(date) => {
          setShowDatePicker(false);
          setForm((f) => ({ ...f, sessionDate: date }));
        }}
        onDismiss={() => setShowDatePicker(false)}
      />

      {/* Class Type Picker */}
      <RNModal
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
          <Surface style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
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
                  setForm((f) => ({ ...f, classTypeId: ct.id }));
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
          style={styles.modalBackdrop}
          onPress={() => setManagerPickerVisible(false)}
          activeOpacity={1}
        >
          <Surface style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Select Manager
            </Text>
            {managers.map((m) => (
              <List.Item
                key={m.id}
                title={m.name}
                titleStyle={{ color: theme.colors.onSurface }}
                onPress={() => {
                  setForm((f) => ({ ...f, managerId: m.id }));
                  setManagerPickerVisible(false);
                }}
              />
            ))}
          </Surface>
        </TouchableOpacity>
      </RNModal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: { margin: 16, borderRadius: 12, padding: 20, maxHeight: '90%' },
  label: { marginBottom: 6, marginTop: 4 },
  input: { marginBottom: 8 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  modalTitle: { padding: 16, paddingBottom: 8 },
});
