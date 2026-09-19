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
import { AppThemeColors, Elevation, Layout, Radius, Spacing, Typography } from '../../theme/brandColors';
import { EnrichedSession, Trainee } from '../../types';
import {
  getEnrichedSessionById,
  updateSessionStatus,
  updateSessionNotes,
  updateSessionDateTime,
  updateSessionAgreedAmount,
  completeOrganizerSession,
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
import { RootStackParamList } from '../../navigation/types';
import StatusBadge from '../../components/common/StatusBadge';
import ColorDotLabel from '../../components/common/ColorDotLabel';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import HelpSheet from '../../components/common/HelpSheet';
import AppButton from '../../components/common/AppButton';
import AppModal from '../../components/common/AppModal';
import AppIconButton from '../../components/common/AppIconButton';
import InfoDialog from '../../components/common/InfoDialog';
import { schedulePendingPaymentNotification } from '../../notifications/scheduler';
import Constants from 'expo-constants';
import { HELP } from '../../constants/helpContent';
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
  const [completionAmount, setCompletionAmount] = useState('');
  const [completeNotes, setCompleteNotes] = useState('');

  const [showSkipDialog, setShowSkipDialog] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);
  const [isAdhoc, setIsAdhoc] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [infoDialog, setInfoDialog] = useState<{ title: string; message: string } | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editAgreedAmount, setEditAgreedAmount] = useState('');
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
                setEditAgreedAmount(String(session.agreed_amount ?? session.per_class_rate));
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
    setCompletionAmount(String(session.agreed_amount ?? session.per_class_rate));
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
    const finalizedAmount = Number(completionAmount);
    if (session.source_type === 'organizer' && (
      completionAmount.trim() === '' ||
      !Number.isFinite(finalizedAmount) ||
      finalizedAmount < 0
    )) {
      setInfoDialog({
        title: 'Invalid amount earned',
        message: 'Enter a valid non-negative amount.',
      });
      return;
    }
    setSaving(true);
    try {
      if (session.source_type === 'organizer' && session.organizer_id) {
        await completeOrganizerSession(
          session.id,
          session.organizer_id,
          finalizedAmount,
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
      if (session.source_type === 'organizer' && !isExpoGo) {
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
    const parsedAmount = Number(editAgreedAmount);
    if (session.source_type === 'organizer' && (
      editAgreedAmount.trim() === '' ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount < 0
    )) {
      setInfoDialog({
        title: 'Invalid agreed amount',
        message: 'Enter a valid non-negative amount.',
      });
      return;
    }
    setSaving(true);
    try {
      await updateSessionDateTime(session.id, editDate, editTime);
      if (session.source_type === 'organizer') {
        await updateSessionAgreedAmount(session.id, parsedAmount);
      }
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
  const isOrganizer = session.source_type === 'organizer';
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
      <View style={styles.heroStrip}>
        <View style={styles.badgeRow}>
          <ColorDotLabel color={session.class_type_color} label={session.class_type_name} />
          <StatusBadge status={session.status} />
        </View>
        <Text style={styles.heroTitle}>{session.series_title}</Text>
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
        {isOrganizer ? (
          <>
            <DetailRow
              label="Organizer"
              value={session.organizer_name ?? '—'}
            />
            <Divider style={styles.rowDivider} />
            <DetailRow
              label="Agreed amount"
              value={formatCurrency(
                session.finalized_payment_amount ??
                session.agreed_amount ??
                session.per_class_rate
              )}
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
        {isOrganizer ? (
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
            <TextInput
              mode="outlined"
              label="Amount earned"
              value={completionAmount}
              onChangeText={(value) => setCompletionAmount(value.replace(/[^0-9.]/g, ''))}
              keyboardType="decimal-pad"
              left={<TextInput.Affix text="₹" />}
              style={{ marginTop: Spacing.md }}
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
        title="Edit Session"
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
        {isOrganizer && (
          <TextInput
            mode="outlined"
            label="Agreed amount *"
            value={editAgreedAmount}
            onChangeText={(value) => setEditAgreedAmount(value.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            left={<TextInput.Affix text="₹" />}
            style={{ marginTop: Spacing.md }}
            dense
          />
        )}
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
    padding: Spacing.md,
    borderRadius: Radius.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroTitle: {
    ...Typography.h2,
    color: colors.textPrimary,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  detailCard: {
    ...Elevation.flat,
    backgroundColor: colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
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
