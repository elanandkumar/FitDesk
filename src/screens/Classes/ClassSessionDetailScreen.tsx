import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Checkbox,
  Divider,
  IconButton,
  Text,
  TextInput,
} from 'react-native-paper';
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
import { EnrichedSession, Trainee } from '../../types';
import {
  getEnrichedSessionById,
  updateSessionStatus,
  updateSessionNotes,
  updateSessionDateTime,
  completeManagerSession,
  completePersonalSession,
} from '../../database/repositories/classSessionRepository';
import ThemedDatePickerModal from '../../components/common/ThemedDatePickerModal';
import ThemedTimePickerModal from '../../components/common/ThemedTimePickerModal';
import { getAllTrainees } from '../../database/repositories/traineeRepository';
import { getTraineesForSession } from '../../database/repositories/sessionTraineeRepository';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import { RootStackParamList } from '../../navigation/types';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import HelpSheet from '../../components/common/HelpSheet';
import AppButton from '../../components/common/AppButton';
import AppModal from '../../components/common/AppModal';
import { schedulePendingPaymentNotification } from '../../notifications/scheduler';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

const HELP =
  'Mark Complete to record attendance and auto-create a payment record. Skip keeps the series active but marks this session as skipped. Notes are saved separately.';

type Route = RouteProp<RootStackParamList, 'ClassSessionDetail'>;
type Nav = StackNavigationProp<RootStackParamList>;

export default function ClassSessionDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { sessionId } = route.params;

  const [session, setSession] = useState<EnrichedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notes, setNotes] = useState('');
  const [notesChanged, setNotesChanged] = useState(false);

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [studentCount, setStudentCount] = useState('0');
  const [allTrainees, setAllTrainees] = useState<Trainee[]>([]);
  const [attendingIds, setAttendingIds] = useState<Set<number>>(new Set());
  const [completeNotes, setCompleteNotes] = useState('');

  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const insets = useSafeAreaInsets();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getEnrichedSessionById(sessionId);
      setSession(s);
      setNotes(s?.notes ?? '');
      setNotesChanged(false);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useLayoutEffect(() => {
    navigation.setOptions({
      title: session?.series_title ?? 'Session Detail',
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          {session?.status === 'upcoming' && (
            <IconButton
              icon="pencil-outline"
              iconColor={Brand.purple}
              onPress={() => {
                setEditDate(session.session_date);
                setEditTime(session.class_time);
                setShowEditModal(true);
              }}
            />
          )}
          <IconButton icon="help-circle-outline" iconColor={Brand.purple} onPress={() => setHelpVisible(true)} />
        </View>
      ),
    });
  }, [navigation, session]);

  async function openCompleteDialog() {
    if (!session) return;
    setCompleteNotes(notes);
    setStudentCount('0');
    try {
      if (session.source_type === 'personal') {
        const [trainees, existing] = await Promise.all([
          getAllTrainees(),
          getTraineesForSession(sessionId),
        ]);
        setAllTrainees(trainees);
        setAttendingIds(new Set(existing.map((t) => t.id)));
      }
      setShowCompleteDialog(true);
    } catch {
      Alert.alert('Error', 'Could not load trainee data. Please try again.');
    }
  }

  async function handleComplete() {
    if (!session) return;
    setSaving(true);
    try {
      if (session.source_type === 'manager' && session.manager_id) {
        await completeManagerSession(
          session.id,
          session.manager_id,
          session.per_class_rate,
          parseInt(studentCount) || 0,
          completeNotes || undefined
        );
      } else if (session.source_type === 'personal') {
        await completePersonalSession(
          session.id,
          Array.from(attendingIds),
          session.session_date.slice(0, 7),
          completeNotes || undefined
        );
      }
      setShowCompleteDialog(false);
      await load();
      if (session.source_type === 'manager' && !isExpoGo) {
        schedulePendingPaymentNotification().catch(() => {});
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleSkip() {
    if (!session) return;
    setSaving(true);
    try {
      await updateSessionStatus(session.id, 'skipped', 0, notes || undefined);
      setShowSkipDialog(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveDateTime() {
    if (!session) return;
    setSaving(true);
    try {
      await updateSessionDateTime(session.id, editDate, editTime);
      setShowEditModal(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNotes() {
    if (!session) return;
    setSaving(true);
    try {
      await updateSessionNotes(session.id, notes);
      setNotesChanged(false);
    } finally {
      setSaving(false);
    }
  }

  function toggleTrainee(id: number) {
    setAttendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Brand.purple} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={{ color: Brand.textPrimary }}>Session not found.</Text>
      </View>
    );
  }

  const isUpcoming = session.status === 'upcoming';
  const isManager = session.source_type === 'manager';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.content, isUpcoming && styles.contentWithFooter]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Hero strip */}
      <View style={[styles.heroStrip, { borderLeftColor: session.class_type_color }]}>
        <Text style={styles.heroTitle}>{session.series_title}</Text>
        <View style={styles.badgeRow}>
          <View style={{ backgroundColor: session.class_type_color + '33', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: Spacing.xs }}>
            <Text style={{ ...Typography.labelSm, color: session.class_type_color }}>{session.class_type_name}</Text>
          </View>
          <StatusBadge status={session.status} />
        </View>
      </View>

      {/* Details card */}
      <View style={styles.detailCard}>
        <DetailRow label="Date" value={formatDisplayDate(session.session_date)} />
        <Divider style={styles.rowDivider} />
        <DetailRow label="Time" value={formatDisplayTime(session.class_time)} />
        <Divider style={styles.rowDivider} />
        <DetailRow label="Duration" value={`${session.duration_minutes} min`} />
        <Divider style={styles.rowDivider} />
        <DetailRow
          label="Location"
          value={session.location ? session.location : 'Offline'}
        />
        <Divider style={styles.rowDivider} />
        {isManager ? (
          <DetailRow
            label="Manager"
            value={
              session.manager_name
                ? `${session.manager_name} | ${formatCurrency(session.per_class_rate)}/class`
                : '—'
            }
          />
        ) : (
          <DetailRow label="Source" value="Personal Training" />
        )}
        {session.status === 'completed' && (
          <>
            <Divider style={styles.rowDivider} />
            <DetailRow label="Students" value={String(session.student_count)} />
          </>
        )}
      </View>

      {/* Notes card — always show when upcoming, hide when completed/skipped and no notes */}
      {(isUpcoming || session.notes) && (
        <View style={styles.detailCard}>
          <Text variant="labelLarge" style={styles.cardLabel}>Notes</Text>
          {isUpcoming ? (
            <>
              <TextInput
                mode="outlined"
                value={notes}
                onChangeText={(t) => { setNotes(t); setNotesChanged(true); }}
                multiline
                numberOfLines={3}
                placeholder="Add notes..."
                contentStyle={{ textAlignVertical: 'top', paddingTop: 8 }}
              />
              {notesChanged && (
                <AppButton
                  label="Save Notes"
                  onPress={handleSaveNotes}
                  variant="ghost"
                  loading={saving}
                  disabled={saving}
                  style={{ alignSelf: 'flex-end' }}
                  fullWidth={false}
                />
              )}
            </>
          ) : (
            <Text variant="bodyMedium" style={{ color: Brand.textSecondary }}>
              {session.notes}
            </Text>
          )}
        </View>
      )}

      {/* Complete dialog */}
      <AppModal
        visible={showCompleteDialog}
        onDismiss={() => setShowCompleteDialog(false)}
        title="Mark Session Complete"
        confirmLabel="Confirm"
        onConfirm={handleComplete}
        loading={saving}
      >
        {isManager ? (
          <>
            <Text variant="bodySmall" style={{ color: Brand.textSecondary, marginBottom: 8 }}>
              How many students attended?
            </Text>
            <TextInput
              mode="outlined"
              label="Student Count"
              value={studentCount}
              onChangeText={setStudentCount}
              keyboardType="number-pad"
            />
          </>
        ) : (
          <>
            <Text variant="bodySmall" style={{ color: Brand.textSecondary, marginBottom: 8 }}>
              Select attending trainees ({attendingIds.size} selected):
            </Text>
            <ScrollView style={{ maxHeight: 260 }}>
              {allTrainees.length === 0 ? (
                <Text variant="bodyMedium" style={{ color: Brand.textMuted, paddingVertical: 8 }}>
                  No trainees added yet.
                </Text>
              ) : (
                allTrainees.map((t) => (
                  <Checkbox.Item
                    key={t.id}
                    label={t.name}
                    status={attendingIds.has(t.id) ? 'checked' : 'unchecked'}
                    onPress={() => toggleTrainee(t.id)}
                    labelStyle={{ color: Brand.textPrimary }}
                  />
                ))
              )}
            </ScrollView>
          </>
        )}
        <TextInput
          mode="outlined"
          label="Notes (optional)"
          value={completeNotes}
          onChangeText={setCompleteNotes}
          style={{ marginTop: Spacing.md }}
        />
      </AppModal>

      {/* Skip dialog */}
      <ConfirmDialog
        visible={showSkipDialog}
        title="Skip Session"
        message="Mark this session as skipped? The series will continue as normal."
        confirmLabel="Skip"
        destructive={false}
        onConfirm={handleSkip}
        onDismiss={() => setShowSkipDialog(false)}
      />

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP} />

      {/* Edit date/time modal */}
      <AppModal
        visible={showEditModal}
        onDismiss={() => setShowEditModal(false)}
        title="Edit Date & Time"
        confirmLabel="Save"
        onConfirm={handleSaveDateTime}
        loading={saving}
      >
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.editRow}>
          <Text variant="labelMedium" style={{ color: Brand.textSecondary, width: 64 }}>Date</Text>
          <Text variant="bodyMedium" style={{ color: Brand.purple, flex: 1 }}>{formatDisplayDate(editDate)}</Text>
          <IconButton icon="calendar" size={18} iconColor={Brand.purple} style={{ margin: 0 }} onPress={() => setShowDatePicker(true)} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.editRow}>
          <Text variant="labelMedium" style={{ color: Brand.textSecondary, width: 64 }}>Time</Text>
          <Text variant="bodyMedium" style={{ color: Brand.purple, flex: 1 }}>{formatDisplayTime(editTime)}</Text>
          <IconButton icon="clock-outline" size={18} iconColor={Brand.purple} style={{ margin: 0 }} onPress={() => setShowTimePicker(true)} />
        </TouchableOpacity>
      </AppModal>

      <ThemedDatePickerModal
        visible={showDatePicker}
        value={editDate}
        onConfirm={(d) => { setEditDate(d); setShowDatePicker(false); }}
        onDismiss={() => setShowDatePicker(false)}
      />
      <ThemedTimePickerModal
        visible={showTimePicker}
        value={editTime}
        onConfirm={(t) => { setEditTime(t); setShowTimePicker(false); }}
        onDismiss={() => setShowTimePicker(false)}
      />
    </ScrollView>

    {isUpcoming && (
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <AppButton
          label="Skip"
          onPress={() => setShowSkipDialog(true)}
          variant="secondary"
          disabled={saving}
          style={styles.skipBtn}
        />
        <AppButton
          label="Mark Complete"
          onPress={openCompleteDialog}
          variant="primary"
          loading={saving}
          disabled={saving}
          style={{ flex: 1, margin: 1 }}
        />
      </View>
    )}
    </KeyboardAvoidingView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="labelMedium" style={styles.detailLabel}>{label}</Text>
      <Text variant="bodyMedium" style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  scrollView: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.backgroundDark },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.lg },
  contentWithFooter: { paddingBottom: Spacing.xxl },
  heroStrip: {
    borderLeftWidth: 4,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.card,
    gap: 10,
    backgroundColor: Brand.surfaceDark,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
  },
  heroTitle: {
    color: Brand.textPrimary,
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  detailCard: {
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    padding: 14,
    gap: Spacing.sm,
    elevation: 4,
    shadowColor: Brand.purple,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardLabel: {
    color: Brand.textSecondary,
    marginBottom: Spacing.xs,
  },
  rowDivider: { backgroundColor: Brand.borderSubtle, marginVertical: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailLabel: { color: Brand.textSecondary, width: 88 },
  detailValue: { color: Brand.textPrimary, flex: 1 },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Brand.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
  },
  skipBtn: { borderRadius: Radius.lg },
  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Brand.borderSubtle,
  },
});
