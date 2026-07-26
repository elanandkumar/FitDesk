import React, { useCallback, useEffect, useState } from 'react';
import { Modal as RNModal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import ThemedDatePickerModal from './ThemedDatePickerModal';
import ThemedTimePickerModal from './ThemedTimePickerModal';
import { List, Modal, Portal, Surface, Text, TextInput } from 'react-native-paper';
import ThemedSegmentedButtons from './ThemedSegmentedButtons';
import AppButton from './AppButton';
import { useAppTheme } from '../../theme';
import { Radius, Spacing } from '../../theme/brandColors';
import { ClassType, LocationType, Organizer, SourceType } from '../../types';
import { getAllClassTypes } from '../../database/repositories/classTypeRepository';
import { getAllOrganizers } from '../../database/repositories/organizerRepository';
import {
  AdHocSessionInput,
  createAdHocSession,
} from '../../database/repositories/classSessionRepository';
import { todayISO } from '../../utils/dateUtils';
import { DEFAULT_DURATION_MINUTES } from '../../constants';
import { scheduleUpcomingNotifications } from '../../notifications/scheduler';

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
  sourceType: 'organizer' as SourceType,
  organizerId: null as number | null,
  agreedAmount: '',
  sessionDate: todayISO(),
  classTime: '09:00',
  duration: String(DEFAULT_DURATION_MINUTES),
  locationType: 'offline' as LocationType,
  location: '',
  notes: '',
};

export default function QuickAddSessionModal({ visible, initialDate, onDismiss, onCreated }: Props) {
  const { colors, theme } = useAppTheme();
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [organizers, setOrganizers] = useState<Organizer[]>([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [classTypePickerVisible, setClassTypePickerVisible] = useState(false);
  const [organizerPickerVisible, setOrganizerPickerVisible] = useState(false);

  const load = useCallback(async () => {
    const [types, mgrs] = await Promise.all([getAllClassTypes(), getAllOrganizers()]);
    setClassTypes(types);
    setOrganizers(mgrs);
  }, []);

  useEffect(() => {
    if (visible) {
      setForm({ ...EMPTY_FORM, sessionDate: initialDate ?? todayISO() });
      load();
    }
  }, [visible, initialDate, load]);

  const selectedClassType = classTypes.find((ct) => ct.id === form.classTypeId);
  const selectedOrganizer = organizers.find((m) => m.id === form.organizerId);

  const isValid =
    form.classTypeId !== null &&
    form.sessionDate.length === 10 &&
    form.classTime.length === 5 &&
    (form.sourceType === 'personal' || (
      form.organizerId !== null &&
      form.agreedAmount.trim() !== '' &&
      Number.isFinite(Number(form.agreedAmount)) &&
      Number(form.agreedAmount) >= 0
    ));

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      const input: AdHocSessionInput = {
        title: form.title.trim() || `${selectedClassType?.name ?? 'Class'} (Ad-hoc)`,
        classTypeId: form.classTypeId!,
        sourceType: form.sourceType,
        organizerId: form.sourceType === 'organizer' ? (form.organizerId ?? undefined) : undefined,
        agreedAmount: form.sourceType === 'organizer' ? Number(form.agreedAmount) : undefined,
        sessionDate: form.sessionDate,
        classTime: form.classTime,
        durationMinutes: parseInt(form.duration, 10) || DEFAULT_DURATION_MINUTES,
        locationType: form.locationType,
        location: form.location.trim() || undefined,
        notes: form.notes.trim() || undefined,
      };
      const sessionId = await createAdHocSession(input);
      await scheduleUpcomingNotifications();
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
          <ThemedSegmentedButtons
            value={form.sourceType}
            onValueChange={(v: string) =>
              setForm((f) => ({
                ...f,
                sourceType: v as SourceType,
                organizerId: null,
                agreedAmount: '',
              }))
            }
            buttons={[
              { value: 'organizer', label: 'Organizer', style: { borderRadius: Radius.sm } },
              { value: 'personal', label: 'Personal', style: { borderRadius: Radius.sm } },
            ]}
            style={{ marginBottom: 8, borderRadius: Radius.sm }}
          />

          {/* Organizer picker */}
          {form.sourceType === 'organizer' && (
            <>
              <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                Organizer *
              </Text>
              <TouchableOpacity
                onPress={() => setOrganizerPickerVisible(true)}
                style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
              >
                {selectedOrganizer ? (
                  <Text style={{ color: theme.colors.onSurface }}>{selectedOrganizer.name}</Text>
                ) : organizers.length === 0 ? (
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>No organizers added yet</Text>
                ) : (
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>Select organizer...</Text>
                )}
              </TouchableOpacity>
              <TextInput
                label="Agreed amount *"
                value={form.agreedAmount}
                onChangeText={(value) => setForm((current) => ({
                  ...current,
                  agreedAmount: value.replace(/[^0-9.]/g, ''),
                }))}
                keyboardType="decimal-pad"
                mode="outlined"
                left={<TextInput.Affix text="₹" />}
                style={styles.input}
              />
              {selectedOrganizer !== undefined && selectedOrganizer.per_class_rate > 0 && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Default rate: ₹{selectedOrganizer.per_class_rate}
                </Text>
              )}
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

          {/* Location */}
          <TextInput
            label="Address (optional)"
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
            <AppButton
              label="Cancel"
              onPress={onDismiss}
              variant="ghost"
              fullWidth={false}
            />
            <AppButton
              label="Add Session"
              onPress={handleSave}
              variant="primary"
              loading={saving}
              disabled={!isValid || saving}
              style={{ flex: 1 }}
            />
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
          style={[styles.modalBackdrop, { backgroundColor: colors.scrim }]}
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

      {/* Organizer Picker */}
      <RNModal
        visible={organizerPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setOrganizerPickerVisible(false)}
      >
        <TouchableOpacity
          style={[styles.modalBackdrop, { backgroundColor: colors.scrim }]}
          onPress={() => setOrganizerPickerVisible(false)}
          activeOpacity={1}
        >
          <Surface style={[styles.modalSheet, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={[styles.modalTitle, { color: theme.colors.onSurface }]}>
              Select Organizer
            </Text>
            {organizers.map((m) => (
              <List.Item
                key={m.id}
                title={m.name}
                description={m.contact_type === 'one_time'
                  ? 'One-time'
                  : m.per_class_rate > 0
                    ? `Regular · Default ₹${m.per_class_rate}`
                    : 'Regular'}
                titleStyle={{ color: theme.colors.onSurface }}
                onPress={() => {
                  setForm((f) => ({
                    ...f,
                    organizerId: m.id,
                    agreedAmount: m.per_class_rate > 0 ? String(m.per_class_rate) : '',
                  }));
                  setOrganizerPickerVisible(false);
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
  modal: { margin: Spacing.lg, borderRadius: Radius.lg, padding: Spacing.xxl, maxHeight: '90%' },
  label: { marginBottom: Spacing.xs, marginTop: Spacing.xs },
  input: { marginBottom: Spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.sm },
  pickerButton: {
    borderWidth: 1,
    borderRadius: Radius.sm,
    padding: 14, // between md(12) and lg(16) — tuned for touch target feel
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  pickerSelected: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorDot: { width: 16, height: 16, borderRadius: Radius.full },
  dateTimeRow: { flexDirection: 'row', gap: 8 },
  dateTimeCell: { flex: 1 },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: Radius.card,
    borderTopRightRadius: Radius.card,
    paddingBottom: Spacing.section,
    maxHeight: '60%',
  },
  modalTitle: { padding: Spacing.lg, paddingBottom: Spacing.sm },
});
