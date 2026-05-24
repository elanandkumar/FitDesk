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
import { useAppTheme } from '../../theme';
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

const HELP =
  'Mark Complete to record attendance and auto-create a payment record. Skip keeps the series active but marks this session as skipped. Notes are saved separately.';

type Route = RouteProp<RootStackParamList, 'ClassSessionDetail'>;
type Nav = StackNavigationProp<RootStackParamList>;

export default function ClassSessionDetailScreen() {
  const { theme } = useAppTheme();
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
        <IconButton icon="help-circle-outline" iconColor={theme.colors.primary} onPress={() => setHelpVisible(true)} />
      ),
    });
  }, [navigation, session, theme.colors.primary]);

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
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.onSurface }}>Session not found.</Text>
      </View>
    );
  }

  const isUpcoming = session.status === 'upcoming';
  const isManager = session.source_type === 'manager';

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.content}
    >
      {/* Title & badges */}
      <View style={[styles.titleRow, { borderLeftColor: session.class_type_color }]}>
        <Text variant="titleLarge" style={{ color: theme.colors.onBackground }}>
          {session.series_title}
        </Text>
        <View style={styles.badgeRow}>
          <Chip
            compact
            style={{ backgroundColor: session.class_type_color + '33' }}
            textStyle={{ color: session.class_type_color }}
          >
            {session.class_type_name}
          </Chip>
          <StatusBadge status={session.status} />
        </View>
      </View>

      <Divider />

      {/* Details */}
      <View style={styles.detailsBlock}>
        <DetailRow label="Date" value={formatDisplayDate(session.session_date)} theme={theme} />
        <DetailRow label="Time" value={formatDisplayTime(session.class_time)} theme={theme} />
        <DetailRow label="Duration" value={`${session.duration_minutes} min`} theme={theme} />
        <DetailRow
          label="Location"
          value={`${session.location_type === 'online' ? 'Online' : 'Offline'}${session.location ? ` · ${session.location}` : ''}`}
          theme={theme}
        />
        {isManager ? (
          <DetailRow
            label="Manager"
            value={
              session.manager_name
                ? `${session.manager_name} · ${formatCurrency(session.per_class_rate)}/class`
                : '—'
            }
            theme={theme}
          />
        ) : (
          <DetailRow label="Source" value="Personal Training" theme={theme} />
        )}
        {session.status === 'completed' && (
          <DetailRow
            label="Students"
            value={String(session.student_count)}
            theme={theme}
          />
        )}
      </View>

      <Divider />

      {/* Notes */}
      <View style={styles.section}>
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Notes
        </Text>
        {isUpcoming ? (
          <>
            <TextInput
              mode="outlined"
              value={notes}
              onChangeText={(t) => { setNotes(t); setNotesChanged(true); }}
              multiline
              numberOfLines={3}
              placeholder="Add notes..."
            />
            {notesChanged && (
              <Button
                mode="text"
                onPress={handleSaveNotes}
                loading={saving}
                disabled={saving}
                style={{ alignSelf: 'flex-end' }}
              >
                Save Notes
              </Button>
            )}
          </>
        ) : (
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            {session.notes || '—'}
          </Text>
        )}
      </View>

      {/* Action buttons */}
      {isUpcoming && (
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={openCompleteDialog}
            style={{ flex: 1 }}
            disabled={saving}
          >
            Mark Complete
          </Button>
          <Button
            mode="outlined"
            onPress={() => setShowSkipDialog(true)}
            style={{ flex: 1 }}
            disabled={saving}
          >
            Skip
          </Button>
        </View>
      )}

      {/* Complete dialog */}
      <Portal>
        <Modal
          visible={showCompleteDialog}
          onDismiss={() => setShowCompleteDialog(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface, marginBottom: 12 }}>
            Mark Session Complete
          </Text>

          {isManager ? (
            <>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
              >
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
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8 }}
              >
                Select attending trainees ({attendingIds.size} selected):
              </Text>
              <ScrollView style={{ maxHeight: 260 }}>
                {allTrainees.length === 0 ? (
                  <Text
                    variant="bodyMedium"
                    style={{ color: theme.colors.onSurfaceVariant, paddingVertical: 8 }}
                  >
                    No trainees added yet.
                  </Text>
                ) : (
                  allTrainees.map((t) => (
                    <Checkbox.Item
                      key={t.id}
                      label={t.name}
                      status={attendingIds.has(t.id) ? 'checked' : 'unchecked'}
                      onPress={() => toggleTrainee(t.id)}
                      labelStyle={{ color: theme.colors.onSurface }}
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

          <View style={[styles.dialogActions]}>
            <Button onPress={() => setShowCompleteDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleComplete}
              loading={saving}
              disabled={saving}
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

function DetailRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useAppTheme>['theme'];
}) {
  return (
    <View style={styles.detailRow}>
      <Text
        variant="labelMedium"
        style={{ color: theme.colors.onSurfaceVariant, width: 88 }}
      >
        {label}
      </Text>
      <Text
        variant="bodyMedium"
        style={{ color: theme.colors.onSurface, flex: 1 }}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  titleRow: { borderLeftWidth: 4, paddingLeft: 12, gap: 8 },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  detailsBlock: { gap: 10 },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start' },
  section: { gap: 8 },
  actions: { flexDirection: 'row', gap: 12 },
  modal: { margin: 20, padding: 20, borderRadius: 12 },
  dialogActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 16 },
});
