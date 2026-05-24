import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, IconButton, Text } from 'react-native-paper';
import GradientFAB from '../../components/common/GradientFAB';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Brand, Radius, Spacing } from '../../theme/brandColors';
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
  const insets = useSafeAreaInsets();
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
          <IconButton icon="help-circle-outline" iconColor={Brand.purple} onPress={() => setHelpVisible(true)} />
        ),
      });
    }
  }, [trainee, traineeId, navigation]);

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
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Contact */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>Contact</Text>
        </View>
        <View style={styles.card}>
          {trainee.phone ? <InfoRow label="Phone" value={trainee.phone} /> : null}
          {trainee.email ? <InfoRow label="Email" value={trainee.email} /> : null}
          {!trainee.phone && !trainee.email && (
            <Text variant="bodyMedium" style={{ color: Brand.textMuted }}>No contact info</Text>
          )}
        </View>

        {/* Packages */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionAccent} />
          <Text style={styles.sectionLabel}>Packages</Text>
          {totalPending > 0 && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{formatCurrency(totalPending)} due</Text>
            </View>
          )}
        </View>
        <View style={styles.card}>
          {packages.length === 0 ? (
            <Text variant="bodyMedium" style={{ color: Brand.textMuted }}>No packages yet</Text>
          ) : (
            packages.map((pkg, i) => (
              <View key={pkg.id}>
                {i > 0 && <Divider style={{ backgroundColor: Brand.borderSubtle, marginVertical: 6 }} />}
                <View style={styles.packageRow}>
                  <View style={{ flex: 1 }}>
                    <Text variant="bodyMedium" style={{ color: Brand.textPrimary }}>
                      {formatMonth(pkg.month)}
                    </Text>
                    <Text variant="bodySmall" style={{ color: Brand.textSecondary }}>
                      {pkg.used_sessions}/{pkg.total_sessions} sessions used
                    </Text>
                  </View>
                  <View style={styles.packageRight}>
                    <Text style={styles.packageAmount}>{formatCurrency(pkg.amount)}</Text>
                    <View style={[
                      styles.statusPill,
                      {
                        backgroundColor: pkg.status === 'pending'
                          ? Brand.pink + '22'
                          : Brand.purple + '33',
                      },
                    ]}>
                      <Text style={{
                        fontSize: 10,
                        fontWeight: '600',
                        color: pkg.status === 'pending' ? Brand.pink : Brand.purple,
                      }}>
                        {pkg.status === 'pending' ? 'Pending' : 'Paid'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Session History */}
        {sessions.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionLabel}>Session History ({sessions.length})</Text>
            </View>
            <View style={styles.card}>
              {sessions.slice(0, 10).map((s, i) => (
                <View key={s.id}>
                  {i > 0 && <Divider style={{ backgroundColor: Brand.borderSubtle, marginVertical: 6 }} />}
                  <View style={styles.sessionRow}>
                    <View style={[styles.colorBar, { backgroundColor: s.class_type_color }]} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="bodyMedium" style={{ color: Brand.textPrimary }}>
                        {s.series_title}
                      </Text>
                      <Text variant="bodySmall" style={{ color: Brand.textSecondary }}>
                        {formatDisplayDate(s.session_date)} · {formatDisplayTime(s.class_time)}
                      </Text>
                    </View>
                    <StatusBadge status={s.status} />
                  </View>
                </View>
              ))}
              {sessions.length > 10 && (
                <Text variant="bodySmall" style={{ color: Brand.textMuted, marginTop: Spacing.sm, textAlign: 'center' }}>
                  + {sessions.length - 10} more sessions
                </Text>
              )}
            </View>
          </>
        )}

        {/* Notes */}
        {trainee.notes ? (
          <>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionAccent} />
              <Text style={styles.sectionLabel}>Notes</Text>
            </View>
            <View style={styles.card}>
              <Text variant="bodyMedium" style={{ color: Brand.textSecondary }}>
                {trainee.notes}
              </Text>
            </View>
          </>
        ) : null}

        <Button
          mode="outlined"
          onPress={() => setDeleteVisible(true)}
          textColor={Brand.pink}
          style={{ borderColor: Brand.pink, marginTop: Spacing.sm }}
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

      <GradientFAB
        icon="pencil"
        style={[styles.fab, { bottom: Spacing.lg + insets.bottom }]}
        onPress={() => navigation.navigate('AddEditTrainee', { traineeId })}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text variant="bodySmall" style={{ color: Brand.textSecondary }}>{label}</Text>
      <Text variant="bodyMedium" style={{ color: Brand.textPrimary }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  content: { padding: Spacing.lg, gap: Spacing.xs, paddingBottom: 80 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  sectionAccent: { width: 3, height: 14, borderRadius: Radius.xs, backgroundColor: Brand.orange },
  sectionLabel: {
    color: Brand.textSecondary,
    fontSize: 11,
    fontFamily: 'Montserrat_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pendingBadge: {
    backgroundColor: Brand.pink + '22',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginLeft: Spacing.xs,
  },
  pendingBadgeText: { color: Brand.pink, fontSize: 11, fontWeight: '600' },
  card: {
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    elevation: 4,
    shadowColor: Brand.purple,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    padding: 14,
  },
  infoRow: { gap: 2, marginBottom: 6 },
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  packageRight: { alignItems: 'flex-end', gap: 4 },
  packageAmount: {
    color: Brand.orange,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
  },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  colorBar: { width: 3, alignSelf: 'stretch', borderRadius: Radius.xs },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
