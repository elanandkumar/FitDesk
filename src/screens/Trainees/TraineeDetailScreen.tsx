import React, { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Divider, IconButton, Text } from 'react-native-paper';
import SectionHeader from '../../components/common/SectionHeader';
import GradientFAB from '../../components/common/GradientFAB';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { Trainee, TraineePackage, EnrichedSession } from '../../types';
import {
  getTraineeById,
  getUpcomingSessionCountForTrainee,
  softDeleteTrainee,
} from '../../database/repositories/traineeRepository';
import { getPackagesByTrainee } from '../../database/repositories/paymentRepository';
import { getEnrichedSessionsForTrainee, getSessionNumberForTrainee } from '../../database/repositories/classSessionRepository';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDisplayDate, formatDisplayTime } from '../../utils/dateUtils';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppButton from '../../components/common/AppButton';
import StatusBadge, { getDisplayStatus } from '../../components/common/StatusBadge';
import HelpSheet from '../../components/common/HelpSheet';
import { HELP } from '../../constants/helpContent';

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
  const [sessionNumbers, setSessionNumbers] = useState<Map<number, { session_number: number; total_sessions: number }>>(new Map());
  const [activeTab, setActiveTab] = useState<'packages' | 'sessions'>('packages');
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [helpVisible, setHelpVisible] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, pkgs, sess, cnt] = await Promise.all([
        getTraineeById(traineeId),
        getPackagesByTrainee(traineeId),
        getEnrichedSessionsForTrainee(traineeId),
        getUpcomingSessionCountForTrainee(traineeId),
      ]);
      setTrainee(t);
      setPackages(pkgs);
      setSessions(sess);
      setUpcomingCount(cnt);

      const completed = sess.filter((s) => s.status === 'completed');
      const numResults = await Promise.all(
        completed.map((s) => getSessionNumberForTrainee(s.id, traineeId))
      );
      const map = new Map<number, { session_number: number; total_sessions: number }>();
      completed.forEach((s, i) => {
        const r = numResults[i];
        if (r) map.set(s.id, r);
      });
      setSessionNumbers(map);
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
          <IconButton icon="help-circle-outline" iconColor={Brand.textAccent} onPress={() => setHelpVisible(true)} />
        ),
      });
    }
  }, [trainee, traineeId, navigation]);

  async function handleDelete() {
    try {
      await softDeleteTrainee(traineeId);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not remove trainee. Please try again.');
    }
  }

  if (!trainee) return null;

  const pendingPackages = packages.filter((p) => p.status === 'pending');
  const totalPending = pendingPackages.reduce((s, p) => s + p.amount, 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Contact */}
        <SectionHeader label="Contact" />
        <View style={styles.card}>
          {trainee.phone ? <InfoRow label="Phone" value={trainee.phone} /> : null}
          {trainee.email ? <InfoRow label="Email" value={trainee.email} /> : null}
          {!trainee.phone && !trainee.email && (
            <Text variant="bodyMedium" style={{ color: Brand.textMuted }}>No contact info</Text>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'packages' && styles.tabButtonActive]}
            onPress={() => setActiveTab('packages')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTab === 'packages' && styles.tabLabelActive]}>
              Packages {packages.length > 0 ? `(${packages.length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'sessions' && styles.tabButtonActive]}
            onPress={() => setActiveTab('sessions')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTab === 'sessions' && styles.tabLabelActive]}>
              Sessions {sessions.length > 0 ? `(${sessions.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <>
            {totalPending > 0 && (
              <View style={styles.pendingBanner}>
                <Text style={styles.pendingBannerText}>{formatCurrency(totalPending)} pending payment</Text>
              </View>
            )}
            <View style={styles.card}>
              {packages.length === 0 ? (
                <Text variant="bodyMedium" style={{ color: Brand.textMuted }}>No packages yet</Text>
              ) : (
                packages.map((pkg, i) => (
                  <View key={pkg.id}>
                    {i > 0 && <Divider style={{ backgroundColor: Brand.borderSubtle, marginVertical: Spacing.xs }} />}
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
                            ...Typography.microLabel,
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
          </>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <View style={styles.card}>
            {sessions.length === 0 ? (
              <Text variant="bodyMedium" style={{ color: Brand.textMuted }}>No sessions yet</Text>
            ) : (
              sessions.map((s, i) => {
                const numInfo = sessionNumbers.get(s.id);
                const displayStatus = getDisplayStatus(s.status, s.session_date, s.class_time);
                return (
                  <View key={s.id}>
                    {i > 0 && <Divider style={{ backgroundColor: Brand.borderSubtle, marginVertical: Spacing.xs }} />}
                    <View style={styles.sessionRow}>
                      <View style={[styles.colorBar, { backgroundColor: s.class_type_color }]} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text variant="bodyMedium" style={{ color: Brand.textPrimary }}>
                          {s.series_title}
                        </Text>
                        <Text variant="bodySmall" style={{ color: Brand.textSecondary }}>
                          {formatDisplayDate(s.session_date)} · {formatDisplayTime(s.class_time)}
                        </Text>
                        {numInfo && (
                          <Text variant="bodySmall" style={{ color: Brand.orange }}>
                            Session {numInfo.session_number} / {numInfo.total_sessions}
                          </Text>
                        )}
                      </View>
                      <StatusBadge status={displayStatus} />
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Notes */}
        {trainee.notes ? (
          <>
            <SectionHeader label="Notes" />
            <View style={styles.card}>
              <Text variant="bodyMedium" style={{ color: Brand.textSecondary }}>
                {trainee.notes}
              </Text>
            </View>
          </>
        ) : null}

        <AppButton
          variant="danger"
          label="Remove Trainee"
          onPress={() => setDeleteVisible(true)}
          style={{ marginTop: Spacing.sm }}
          fullWidth={false}
        />

        <ConfirmDialog
          visible={deleteVisible}
          title="Remove Trainee"
          message={
            upcomingCount > 0
              ? `"${trainee.name}" has ${upcomingCount} upcoming session${upcomingCount > 1 ? 's' : ''}. They will be archived but their history and packages will remain.`
              : `Archive "${trainee.name}"? Their session history and packages will remain.`
          }
          confirmLabel="Remove"
          onConfirm={handleDelete}
          onDismiss={() => setDeleteVisible(false)}
        />

        <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP.traineeDetail} />
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
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    padding: Spacing.xs,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: Radius.sm,
  },
  tabButtonActive: {
    backgroundColor: Brand.purple + '33',
  },
  tabLabel: {
    ...Typography.labelSm,
    color: Brand.textMuted,
  },
  tabLabelActive: {
    color: Brand.purple,
  },
  pendingBanner: {
    backgroundColor: Brand.pink + '22',
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  pendingBannerText: { ...Typography.labelSm, color: Brand.pink },
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
    padding: Spacing.lg,
  },
  infoRow: { gap: 0, marginBottom: Spacing.xs },
  packageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  packageRight: { alignItems: 'flex-end', gap: Spacing.xs },
  packageAmount: {
    ...Typography.labelLg,
    color: Brand.orange,
  },
  statusPill: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  sessionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xs },
  colorBar: { width: 3, alignSelf: 'stretch', borderRadius: Radius.xs },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
