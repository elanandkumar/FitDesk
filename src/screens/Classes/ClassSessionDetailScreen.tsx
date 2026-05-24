import React, { useCallback, useLayoutEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Chip,
  Checkbox,
  Divider,
  IconButton,
  Portal,
  Modal,
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
import { Brand } from '../../theme/brandColors';
import { EnrichedSession, Trainee } from '../../types';
import {
  getEnrichedSessionById,
  updateSessionStatus,
  updateSessionNotes,
  completeManagerSession,
  completePersonalSession,
} from '../../database/repositories/classSessionRepository';
import { getAllTrainees } from '../../database/repositories/traineeRepository';
import { getTraineesForSession } from '../../database/repositories/sessionTraineeRepository';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import { RootStackParamList } from '../../navigation/types';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import HelpSheet from '../../components/common/HelpSheet';
import GradientButton from '../../components/common/GradientButton';

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
        <IconButton icon="help-circle-outline" iconColor={Brand.purple} onPress={() => setHelpVisible(true)} />
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {/* Hero strip */}
      <View style={[styles.heroStrip, {
        borderLeftColor: session.class_type_color,
        backgroundColor: session.class_type_color + '18',
      }]}>
        <Text style={styles.heroTitle}>{session.series_title}</Text>
        <View style={styles.badgeRow}>
          <Chip
            compact
            style={{ backgroundColor: session.class_type_color + '33' }}
            textStyle={{ color: session.class_type_color, fontSize: 11 }}
          >
            {session.class_type_name}
          </Chip>
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
          value={`${session.location_type === 'online' ? 'Online' : 'Offline'}${session.location ? ` · ${session.location}` : ''}`}
        />
        <Divider style={styles.rowDivider} />
        {isManager ? (
          <DetailRow
            label="Manager"
            value={
              session.manager_name
                ? `${session.manager_name} · ${formatCurrency(session.per_class_rate)}/class`
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

      {/* Notes card */}
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
              <Button
                mode="text"
                onPress={handleSaveNotes}
                loading={saving}
                disabled={saving}
                textColor={Brand.purple}
                style={{ alignSelf: 'flex-end' }}
              >
                Save Notes
              </Button>
            )}
          </>
        ) : (
          <Text variant="bodyMedium" style={{ color: Brand.textSecondary }}>
            {session.notes || '—'}
          </Text>
        )}
      </View>

      {/* Action buttons */}
      {isUpcoming && (
        <View style={styles.actions}>
          <Button
            mode="outlined"
            onPress={() => setShowSkipDialog(true)}
            style={styles.skipBtn}
            contentStyle={styles.skipBtnContent}
            textColor={Brand.textSecondary}
            disabled={saving}
          >
            Skip
          </Button>
          <GradientButton
            label="Mark Complete"
            onPress={openCompleteDialog}
            loading={saving}
            disabled={saving}
            style={{ flex: 1, margin: 1 }}
          />
        </View>
      )}

      {/* Complete dialog */}
      <Portal>
        <Modal
          visible={showCompleteDialog}
          onDismiss={() => setShowCompleteDialog(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleMedium" style={{ color: Brand.textPrimary, marginBottom: 12, fontFamily: 'Montserrat_600SemiBold' }}>
            Mark Session Complete
          </Text>

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
            style={{ marginTop: 12 }}
          />

          <View style={styles.dialogActions}>
            <Button textColor={Brand.textSecondary} onPress={() => setShowCompleteDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleComplete}
              loading={saving}
              disabled={saving}
              buttonColor={Brand.purple}
            >
              Confirm
            </Button>
          </View>
        </Modal>
      </Portal>

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
    </ScrollView>
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Brand.backgroundDark },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  heroStrip: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
  },
  heroTitle: {
    color: Brand.textPrimary,
    fontFamily: 'Poppins_700Bold',
    fontSize: 18,
  },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  detailCard: {
    backgroundColor: Brand.surfaceDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    padding: 14,
    gap: 8,
    elevation: 4,
    shadowColor: Brand.purple,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardLabel: {
    color: Brand.textSecondary,
    fontFamily: 'Montserrat_600SemiBold',
    marginBottom: 4,
  },
  rowDivider: { backgroundColor: Brand.borderSubtle, marginVertical: 2 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  detailLabel: { color: Brand.textSecondary, width: 88 },
  detailValue: { color: Brand.textPrimary, flex: 1 },
  actions: { flexDirection: 'row', gap: 12 },
  skipBtn: { borderColor: Brand.borderSubtle },
  skipBtnContent: { height: 52, alignItems: 'center', justifyContent: 'center' } as any,
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    backgroundColor: Brand.surfaceElevated,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
  },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
