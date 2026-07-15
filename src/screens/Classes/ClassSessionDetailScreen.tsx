import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Divider,
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
import { useAppTheme } from '../../theme';
import { AppThemeColors, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { EnrichedSession, Trainee } from '../../types';
import {
  getEnrichedSessionById,
  updateSessionStatus,
  updateSessionNotes,
  updateSessionDateTime,
  completeManagerSession,
  completePersonalSession,
  getSessionNumberForTrainee,
  deleteAdHocSession,
} from '../../database/repositories/classSessionRepository';
import ThemedDatePickerModal from '../../components/common/ThemedDatePickerModal';
import ThemedTimePickerModal from '../../components/common/ThemedTimePickerModal';
import { getTraineesForSeries, getClassSeriesById } from '../../database/repositories/classSeriesRepository';
import { getTraineesForSession } from '../../database/repositories/sessionTraineeRepository';
import { formatDisplayDate, formatDisplayTime, isSessionInFuture } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import { withAlpha } from '../../utils/colorUtils';
import { RootStackParamList } from '../../navigation/types';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import HelpSheet from '../../components/common/HelpSheet';
import AppButton from '../../components/common/AppButton';
import AppModal from '../../components/common/AppModal';
import AppIconButton from '../../components/common/AppIconButton';
import InfoDialog from '../../components/common/InfoDialog';
import { schedulePendingPaymentNotification } from '../../notifications/scheduler';
import Constants from 'expo-constants';
import { HELP } from '../../constants/helpContent';
import AppBadge from '../../components/common/AppBadge';
import SectionHeader from '../../components/common/SectionHeader';

const isExpoGo = Constants.appOwnership === 'expo';

type Route = RouteProp<RootStackParamList, 'ClassSessionDetail'>;
type Nav = StackNavigationProp<RootStackParamList>;

export default function ClassSessionDetailScreen() {
  const { accentPalette, colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { sessionId } = route.params;

  const [session, setSession] = useState<EnrichedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notes, setNotes] = useState('');
  const [notesChanged, setNotesChanged] = useState(false);

  const [linkedTrainees, setLinkedTrainees] = useState<Trainee[]>([]);
  const [sessionNums, setSessionNums] = useState<Record<number, { session_number: number; total_sessions: number }>>({});

  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [studentCount, setStudentCount] = useState('0');
  const [completeNotes, setCompleteNotes] = useState('');

  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [isAdhoc, setIsAdhoc] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [infoDialog, setInfoDialog] = useState<{ title: string; message: string } | null>(null);
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

      if (s?.source_type === 'personal') {
        if (s.status === 'completed') {
          const attendees = await getTraineesForSession(sessionId);
          setLinkedTrainees(attendees);
          const nums: Record<number, { session_number: number; total_sessions: number }> = {};
          for (const t of attendees) {
            const n = await getSessionNumberForTrainee(sessionId, t.id);
            if (n) nums[t.id] = n;
          }
          setSessionNums(nums);
        } else {
          const st = await getTraineesForSeries(s.series_id);
          setLinkedTrainees(st);
          setSessionNums({});
        }
      }

      if (s) {
        const ser = await getClassSeriesById(s.series_id);
        setIsAdhoc(!!ser && ser.is_active === 0 && ser.start_date === ser.end_date);
      }
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
            <AppIconButton
              icon="pencil"
              iconColor={accentPalette.textAccent}
              onPress={() => {
                setEditDate(session.session_date);
                setEditTime(session.class_time);
                setShowEditModal(true);
              }}
            />
          )}
          <AppIconButton icon="question" iconColor={accentPalette.textAccent} onPress={() => setHelpVisible(true)} />
        </View>
      ),
    });
  }, [accentPalette.textAccent, navigation, session]);

  function openCompleteDialog() {
    if (!session) return;
    if (isSessionInFuture(session.session_date, session.class_time)) {
      setInfoDialog({
        title: 'Cannot complete future session',
        message: `This session is scheduled for ${formatDisplayDate(session.session_date)} at ${formatDisplayTime(session.class_time)}. You can mark it complete after the class time.`,
      });
      return;
    }
    setCompleteNotes(notes);
    setStudentCount('0');
    setShowCompleteDialog(true);
  }

  async function handleComplete() {
    if (!session) return;
    if (isSessionInFuture(session.session_date, session.class_time)) {
      setInfoDialog({
        title: 'Cannot complete future session',
        message: `This session is scheduled for ${formatDisplayDate(session.session_date)} at ${formatDisplayTime(session.class_time)}. You can mark it complete after the class time.`,
      });
      return;
    }
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
          linkedTrainees.map((t) => t.id),
          session.session_date.slice(0, 7),
          completeNotes || undefined
        );
      }
      setShowCompleteDialog(false);
      await load();
      if (session.source_type === 'manager' && !isExpoGo) {
        schedulePendingPaymentNotification().catch(() => {});
      }
    } catch (err) {
      setInfoDialog({
        title: 'Could not complete session',
        message: err instanceof Error ? err.message : 'Please try again.',
      });
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

  async function handleDeleteSession() {
    if (!session) return;
    try {
      await deleteAdHocSession(session.id, session.series_id);
      navigation.goBack();
    } catch {
      // handled by ConfirmDialog staying open
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={accentPalette.main} />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textPrimary }}>Session not found.</Text>
      </View>
    );
  }

  const isUpcoming = session.status === 'upcoming';
  const isManager = session.source_type === 'manager';
  const sessionInFuture = isSessionInFuture(session.session_date, session.class_time);
  const futureCompletionMessage = `Available after ${formatDisplayDate(session.session_date)} at ${formatDisplayTime(session.class_time)}.`;

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
      <View style={[styles.heroStrip, { borderLeftColor: withAlpha(session.class_type_color, 0.7) }]}>
        <Text style={styles.heroTitle}>{session.series_title}</Text>
        <View style={styles.badgeRow}>
          <AppBadge label={session.class_type_name} accentColor={session.class_type_color} />
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
          <>
            <DetailRow
              label="Manager"
              value={
                session.manager_name
                  ? `${session.manager_name} | ${formatCurrency(session.per_class_rate)}/class`
                  : '—'
              }
            />
            {session.status === 'completed' && (
              <>
                <Divider style={styles.rowDivider} />
                <DetailRow label="Students" value={String(session.student_count)} />
              </>
            )}
          </>
        ) : (
          <>
            <DetailRow label="Source" value="Personal Training" />
            {session.guest_name ? (
              <>
                <Divider style={styles.rowDivider} />
                <DetailRow label="Guest" value={session.guest_name} />
              </>
            ) : linkedTrainees.length > 0 ? (
              <>
                <Divider style={styles.rowDivider} />
                <View style={styles.detailRow}>
                  <Text variant="labelMedium" style={styles.detailLabel}>Trainees</Text>
                  <View style={{ flex: 1, gap: Spacing.xs }}>
                    {linkedTrainees.map((t) => {
                      const num = sessionNums[t.id];
                      return (
                        <View key={t.id} style={styles.traineeRow}>
                          <Text variant="bodyMedium" style={{ color: colors.textPrimary }}>{t.name}</Text>
                          {num && (
                            <Text variant="labelSmall" style={{ color: accentPalette.textAccent }}>
                              Session {num.session_number} / {num.total_sessions}
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </View>
              </>
            ) : null}
          </>
        )}
      </View>

      {/* Notes card */}
      {(isUpcoming || session.notes) && (
        <>
          <SectionHeader label="Notes" />
          <View style={styles.detailCard}>
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
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
                {session.notes}
              </Text>
            )}
          </View>
        </>
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
            <Text variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: Spacing.sm }}>
              How many students attended?
            </Text>
            <TextInput
              mode="outlined"
              label="Student Count"
              value={studentCount}
              onChangeText={setStudentCount}
              keyboardType="number-pad"
              dense
            />
          </>
        ) : (
          <>
            {session.guest_name ? (
              <Text variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: Spacing.sm }}>
                Completing for guest: {session.guest_name}
              </Text>
            ) : linkedTrainees.length > 0 ? (
              <View style={{ marginBottom: Spacing.sm }}>
                <Text variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: Spacing.xs }}>
                  Completing for:
                </Text>
                {linkedTrainees.map((t) => (
                  <Text key={t.id} variant="bodyMedium" style={{ color: colors.textPrimary }}>
                    • {t.name}
                  </Text>
                ))}
              </View>
            ) : (
              <Text variant="bodySmall" style={{ color: colors.textSecondary, marginBottom: Spacing.sm }}>
                No trainees linked. Session will be marked complete.
              </Text>
            )}
          </>
        )}
        <TextInput
          mode="outlined"
          label="Notes (optional)"
          value={completeNotes}
          onChangeText={setCompleteNotes}
          style={{ marginTop: Spacing.md }}
          dense
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

      <ConfirmDialog
        visible={showDeleteDialog}
        title="Delete Session"
        message="Delete this session permanently? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDeleteSession}
        onDismiss={() => setShowDeleteDialog(false)}
      />

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP.classSessionDetail} />

      <InfoDialog
        visible={infoDialog !== null}
        title={infoDialog?.title ?? ''}
        message={infoDialog?.message ?? ''}
        onDismiss={() => setInfoDialog(null)}
      />

      {/* Edit date/time modal */}
      <AppModal
        visible={showEditModal}
        onDismiss={() => setShowEditModal(false)}
        title="Edit Date & Time"
        confirmLabel="Save"
        onConfirm={handleSaveDateTime}
        loading={saving}
      >
        <View style={styles.editTwoCol}>
          <View style={styles.editColCell}>
            <Text variant="labelMedium" style={styles.editFieldLabel}>Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.editPickerButton}>
              <Text style={{ color: colors.textPrimary }}>{formatDisplayDate(editDate)}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.editColCell}>
            <Text variant="labelMedium" style={styles.editFieldLabel}>Time</Text>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.editPickerButton}>
              <Text style={{ color: colors.textPrimary }}>{formatDisplayTime(editTime)}</Text>
            </TouchableOpacity>
          </View>
        </View>
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
        {sessionInFuture && (
          <Text style={styles.footerHint}>{futureCompletionMessage}</Text>
        )}
        {isAdhoc ? (
          <>
            <AppButton
              label="Delete"
              onPress={() => setShowDeleteDialog(true)}
              variant="danger"
              disabled={saving}
              style={styles.skipBtn}
            />
            <AppButton
              label="Mark Complete"
              onPress={openCompleteDialog}
              variant="primary"
              loading={saving}
              disabled={saving || sessionInFuture}
              style={{ flex: 1 }}
            />
          </>
        ) : (
          <>
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
              disabled={saving || sessionInFuture}
              style={{ flex: 1 }}
            />
          </>
        )}
      </View>
    )}
    </KeyboardAvoidingView>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.detailRow}>
      <Text variant="labelMedium" style={styles.detailLabel}>{label}</Text>
      <Text variant="bodyMedium" style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { padding: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.lg },
  contentWithFooter: { paddingBottom: Spacing.xxl },
  heroStrip: {
    borderLeftWidth: 4,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.card,
    gap: Spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTitle: {
    ...Typography.h2,
    color: colors.textPrimary,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardLabel: {
    color: colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  rowDivider: { backgroundColor: colors.border, marginVertical: 0 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailLabel: { color: colors.textSecondary, width: 88 },
  detailValue: { color: colors.textPrimary, flex: 1 },
  traineeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerHint: {
    ...Typography.caption,
    color: colors.textMuted,
    width: '100%',
  },
  skipBtn: { borderRadius: Radius.lg },
  editTwoCol: { flexDirection: 'row', gap: Spacing.md },
  editColCell: { flex: 1 },
  editFieldLabel: { color: colors.textSecondary, marginBottom: Spacing.xs },
  editPickerButton: {
    borderWidth: 1,
    borderRadius: Radius.md,
    borderColor: colors.border,
    paddingHorizontal: Spacing.lg,
    minHeight: Layout.INPUT_HEIGHT,
    justifyContent: 'center',
  },
});
