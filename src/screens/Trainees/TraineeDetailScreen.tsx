import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Divider, Text } from 'react-native-paper';
import SectionHeader from '../../components/common/SectionHeader';
import GradientFAB from '../../components/common/GradientFAB';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { AppThemeColors, BrandCore, Radius, Spacing, Typography } from '../../theme/brandColors';
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
import ConfirmDialog from '../../components/common/ConfirmDialog';
import AppButton from '../../components/common/AppButton';
import HelpSheet from '../../components/common/HelpSheet';
import AppIconButton from '../../components/common/AppIconButton';
import SessionCard from '../../components/common/SessionCard';
import InfoDialog from '../../components/common/InfoDialog';
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
  const { accentPalette, colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const [errorMessage, setErrorMessage] = useState('');
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
          <AppIconButton icon="question" iconColor={accentPalette.textAccent} onPress={() => setHelpVisible(true)} />
        ),
      });
    }
  }, [accentPalette.textAccent, trainee, navigation]);

  async function handleDelete() {
    try {
      await softDeleteTrainee(traineeId);
      navigation.goBack();
    } catch {
      setErrorMessage('Could not remove trainee. Please try again.');
    }
  }

  if (!trainee) return null;

  const pendingPackages = packages.filter((p) => p.status === 'pending');
  const totalPending = pendingPackages.reduce((s, p) => s + p.amount, 0);
  const totalPaid = packages.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Contact */}
        <SectionHeader label="Contact" />
        <View style={styles.card}>
          {trainee.phone ? <InfoRow label="Phone" value={trainee.phone} /> : null}
          {trainee.email ? <InfoRow label="Email" value={trainee.email} /> : null}
          {!trainee.phone && !trainee.email && (
            <Text variant="bodyMedium" style={{ color: colors.textMuted }}>No contact info</Text>
          )}
        </View>

        {/* Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'packages' && { backgroundColor: accentPalette.main + '33' },
            ]}
            onPress={() => setActiveTab('packages')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTab === 'packages' && { color: accentPalette.textAccent }]}>
              Packages {packages.length > 0 ? `(${packages.length})` : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'sessions' && { backgroundColor: accentPalette.main + '33' },
            ]}
            onPress={() => setActiveTab('sessions')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabLabel, activeTab === 'sessions' && { color: accentPalette.textAccent }]}>
              Sessions {sessions.length > 0 ? `(${sessions.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Packages Tab */}
        {activeTab === 'packages' && (
          <>
            {packages.length > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Paid</Text>
                  <Text style={[styles.summaryAmount, totalPaid > 0 ? styles.paidAmount : styles.zeroAmount]}>
                    {formatCurrency(totalPaid)}
                  </Text>
                </View>
                <View style={styles.summarySep} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Pending</Text>
                  <Text style={[styles.summaryAmount, totalPending > 0 ? styles.pendingAmount : styles.zeroAmount]}>
                    {formatCurrency(totalPending)}
                  </Text>
                </View>
              </View>
            )}
            <View style={styles.card}>
              {packages.length === 0 ? (
                <Text variant="bodyMedium" style={{ color: colors.textMuted }}>No packages yet</Text>
              ) : (
                packages.map((pkg, i) => (
                  <View key={pkg.id}>
                    {i > 0 && <Divider style={{ backgroundColor: colors.border, marginVertical: Spacing.xs }} />}
                    <View style={styles.packageRow}>
                      <View style={{ flex: 1 }}>
                        <Text variant="bodyMedium" style={{ color: colors.textPrimary }}>
                          {formatMonth(pkg.month)}
                        </Text>
                        <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
                          {pkg.used_sessions}/{pkg.total_sessions} sessions used
                        </Text>
                      </View>
                      <View style={styles.packageRight}>
                        <Text style={styles.packageStatusLabel}>
                          {pkg.status === 'pending' ? 'Pending' : 'Paid'}
                        </Text>
                        <Text style={[
                          styles.packageAmount,
                          pkg.status === 'pending' ? styles.pendingAmount : styles.paidAmount,
                        ]}>
                          {formatCurrency(pkg.amount)}
                        </Text>
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
          <>
            {sessions.length === 0 ? (
              <View style={styles.card}>
                <Text variant="bodyMedium" style={{ color: colors.textMuted }}>No sessions yet</Text>
              </View>
            ) : (
              <View style={styles.sessionList}>
                {sessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    showDate
                    showTraineeLabel={false}
                    sessionNumber={sessionNumbers.get(s.id)}
                    onPress={() => navigation.navigate('ClassSessionDetail', { sessionId: s.id })}
                  />
                ))}
              </View>
            )}
          </>
        )}

        {/* Notes */}
        {trainee.notes ? (
          <>
            <SectionHeader label="Notes" />
            <View style={styles.card}>
              <Text variant="bodyMedium" style={{ color: colors.textSecondary }}>
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

        <InfoDialog
          visible={errorMessage.length > 0}
          title="Error"
          message={errorMessage}
          onDismiss={() => setErrorMessage('')}
        />
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
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.infoRow}>
      <Text variant="bodySmall" style={{ color: colors.textSecondary }}>{label}</Text>
      <Text variant="bodyMedium" style={{ color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: Spacing.lg, gap: Spacing.xs, paddingBottom: 80 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
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
  tabLabel: {
    ...Typography.labelSm,
    color: colors.textMuted,
  },
  summaryCard: {
    alignItems: 'center',
    backgroundColor: colors.surfaceRaised,
    borderColor: colors.border,
    borderRadius: Radius.card,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { ...Typography.bodySm, fontWeight: '500', color: colors.textSecondary, marginBottom: Spacing.xs },
  summaryAmount: { ...Typography.h2 },
  summarySep: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: colors.shadow,
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
  packageRight: { alignItems: 'flex-end' },
  packageStatusLabel: {
    ...Typography.caption,
    color: colors.textSecondary,
  },
  packageAmount: {
    ...Typography.labelLg,
  },
  paidAmount: { color: BrandCore.pink },
  pendingAmount: { color: BrandCore.orange },
  zeroAmount: { color: colors.textMuted },
  sessionList: { gap: Spacing.sm },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
