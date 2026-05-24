import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Chip, Divider, FAB, IconButton, Text } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import { Trainee, TraineePackage, EnrichedSession } from '../../types';
import { getTraineeById, deleteTrainee } from '../../database/repositories/traineeRepository';
import { getPackagesByTrainee } from '../../database/repositories/paymentRepository';
import { getEnrichedSessionsForTrainee } from '../../database/repositories/classSessionRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import StatusBadge from '../../components/common/StatusBadge';
import HelpSheet from '../../components/common/HelpSheet';

const HELP =
  'View packages and attended sessions. Packages track monthly session counts and payment status.';


type Nav = StackNavigationProp<RootStackParamList, 'TraineeDetail'>;
type Route = RouteProp<RootStackParamList, 'TraineeDetail'>;

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

export default function TraineeDetailScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { traineeId } = route.params;

  const [trainee, setTrainee] = useState<Trainee | null>(null);
  const [packages, setPackages] = useState<TraineePackage[]>([]);
  const [sessions, setSessions] = useState<EnrichedSession[]>([]);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, pkgs, sess] = await Promise.all([
        getTraineeById(traineeId),
        getPackagesByTrainee(traineeId),
        getEnrichedSessionsForTrainee(traineeId),
      ]);
      setTrainee(t);
      setPackages(pkgs);
      setSessions(sess);
    } catch {
      // screen shows nothing on DB error
    }
  }, [traineeId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  useEffect(() => {
    if (trainee) {
      navigation.setOptions({
        title: trainee.name,
        headerRight: () => (
          <IconButton icon="help-circle-outline" iconColor={theme.colors.primary} onPress={() => setHelpVisible(true)} />
        ),
      });
    }
  }, [trainee, traineeId, navigation, theme.colors.primary]);

  async function handleDelete() {
    try {
      await deleteTrainee(traineeId);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not delete trainee. Please try again.');
    }
  }

  if (!trainee) return null;

  const pendingPackages = packages.filter((p) => p.status === 'pending');
  const totalPending = pendingPackages.reduce((s, p) => s + p.amount, 0);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <ScrollView
      contentContainerStyle={styles.content}
    >
      {/* Contact */}
      <Card style={{ backgroundColor: theme.colors.surface }}>
        <Card.Content style={styles.cardContent}>
          <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Contact</Text>
          <Divider style={{ marginVertical: 8 }} />
          {trainee.phone ? <InfoRow label="Phone" value={trainee.phone} theme={theme} /> : null}
          {trainee.email ? <InfoRow label="Email" value={trainee.email} theme={theme} /> : null}
          {!trainee.phone && !trainee.email && (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>No contact info</Text>
          )}
        </Card.Content>
      </Card>

      {/* Packages */}
      <Card style={{ backgroundColor: theme.colors.surface }}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.sectionHeader}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Packages</Text>
            {totalPending > 0 && (
              <Chip
                compact
                style={{ backgroundColor: theme.colors.errorContainer }}
                textStyle={{ color: theme.colors.onErrorContainer, fontSize: 12 }}
              >
                {formatCurrency(totalPending)} due
              </Chip>
            )}
          </View>
          <Divider style={{ marginVertical: 8 }} />
          {packages.length === 0 ? (
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              No packages yet
            </Text>
          ) : (
            packages.map((pkg, i) => (
              <View key={pkg.id}>
                {i > 0 && <Divider style={{ marginVertical: 6 }} />}
                <View style={styles.packageRow}>
                  <View>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                      {formatMonth(pkg.month)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {pkg.used_sessions}/{pkg.total_sessions} sessions used
                    </Text>
                  </View>
                  <View style={styles.packageRight}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                      {formatCurrency(pkg.amount)}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      {
                        backgroundColor: pkg.status === 'pending'
                          ? theme.colors.errorContainer
                          : theme.colors.secondaryContainer,
                      },
                    ]}>
                      <Text style={{
                        fontSize: 11,
                        fontWeight: '600',
                        color: pkg.status === 'pending'
                          ? theme.colors.onErrorContainer
                          : theme.colors.onSecondaryContainer,
                      }}>
                        {pkg.status === 'pending' ? 'Pending' : 'Paid'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </Card.Content>
      </Card>

      {/* Session History */}
      {sessions.length > 0 && (
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>
              Session History ({sessions.length})
            </Text>
            <Divider style={{ marginVertical: 8 }} />
            {sessions.slice(0, 10).map((s, i) => (
              <View key={s.id}>
                {i > 0 && <Divider style={{ marginVertical: 6 }} />}
                <View style={styles.sessionRow}>
                  <View style={[styles.colorBar, { backgroundColor: s.class_type_color }]} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
                      {s.series_title}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {formatDisplayDate(s.session_date)} · {formatDisplayTime(s.class_time)}
                    </Text>
                  </View>
                  <StatusBadge status={s.status} />
                </View>
              </View>
            ))}
            {sessions.length > 10 && (
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 8, textAlign: 'center' }}
              >
                + {sessions.length - 10} more sessions
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Notes */}
      {trainee.notes ? (
        <Card style={{ backgroundColor: theme.colors.surface }}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.onSurface }}>Notes</Text>
            <Divider style={{ marginVertical: 8 }} />
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {trainee.notes}
            </Text>
          </Card.Content>
        </Card>
      ) : null}

      <Button
        mode="outlined"
        onPress={() => setDeleteVisible(true)}
        textColor={theme.colors.error}
        style={{ borderColor: theme.colors.error, marginTop: 8 }}
      >
        Delete Trainee
      </Button>

      <ConfirmDialog
        visible={deleteVisible}
        title="Delete Trainee"
        message={`Delete "${trainee.name}"? Their session history will also be removed.`}
        onConfirm={handleDelete}
        onDismiss={() => setDeleteVisible(false)}
      />

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP} />

    </ScrollView>
      <FAB
        icon="pencil"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={() => navigation.navigate('AddEditTrainee', { traineeId })}
      />
    </View>
  );
}

function InfoRow({
  label,
  value,
  theme,
}: {
  label: string;
  value: string;
  theme: ReturnType<typeof useAppTheme>['theme'];
}) {
  return (
    <View style={styles.infoRow}>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>{label}</Text>
      <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  cardContent: { gap: 4 },
  infoRow: { gap: 2, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  packageRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  packageRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  colorBar: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  fab: { position: 'absolute', bottom: 16, right: 16, borderRadius: 4 },
});
