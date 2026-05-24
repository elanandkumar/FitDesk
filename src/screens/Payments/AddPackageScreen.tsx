import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, IconButton, List, Surface, Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme';
import { Brand } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import { Trainee } from '../../types';
import { getAllTrainees } from '../../database/repositories/traineeRepository';
import { createTraineePackage } from '../../database/repositories/paymentRepository';
import GradientButton from '../../components/common/GradientButton';

type Nav = StackNavigationProp<RootStackParamList, 'AddPackage'>;
type Route = RouteProp<RootStackParamList, 'AddPackage'>;

function currentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function formatMonth(ym: string): string {
  const [y, m] = ym.split('-');
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

function FormSection({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

export default function AddPackageScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [traineePickerVisible, setTraineePickerVisible] = useState(false);
  const [traineeId, setTraineeId] = useState<number | null>(route.params?.traineeId ?? null);
  const [month, setMonth] = useState(currentYearMonth());
  const [totalSessions, setTotalSessions] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedTrainee = trainees.find((t) => t.id === traineeId);

  const load = useCallback(async () => {
    const ts = await getAllTrainees();
    setTrainees(ts);
  }, []);

  useEffect(() => {
    navigation.setOptions({ title: 'Add Package' });
    load();
  }, [navigation, load]);

  const adjustMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  };

  const isValid =
    traineeId !== null &&
    month.length === 7 &&
    parseInt(totalSessions, 10) > 0 &&
    parseFloat(amount) > 0;

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await createTraineePackage(
        traineeId!,
        month,
        parseInt(totalSessions, 10),
        parseFloat(amount),
        notes.trim() || undefined
      );
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormSection label="Trainee" />
        <View style={styles.card}>
          <TouchableOpacity
            onPress={() => setTraineePickerVisible(true)}
            style={styles.pickerRow}
          >
            <MaterialCommunityIcons name="account" size={20} color={Brand.purple} />
            <Text style={[styles.pickerText, !selectedTrainee && styles.pickerPlaceholder]}>
              {selectedTrainee
                ? selectedTrainee.name
                : trainees.length === 0
                  ? 'No trainees added yet'
                  : 'Select trainee...'}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={20} color={Brand.textMuted} />
          </TouchableOpacity>
        </View>

        <FormSection label="Month" />
        <View style={[styles.card, styles.monthCard]}>
          <IconButton icon="chevron-left" size={24} onPress={() => adjustMonth(-1)} iconColor={Brand.textPrimary} />
          <Text style={styles.monthText}>{formatMonth(month)}</Text>
          <IconButton icon="chevron-right" size={24} onPress={() => adjustMonth(1)} iconColor={Brand.textPrimary} />
        </View>

        <FormSection label="Package Details" />
        <View style={styles.card}>
          <TextInput
            label="Total Sessions *"
            value={totalSessions}
            onChangeText={(v) => setTotalSessions(v.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            mode="outlined"
          />
          <View style={styles.fieldGap} />
          <TextInput
            label="Amount (₹) *"
            value={amount}
            onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
            keyboardType="decimal-pad"
            mode="outlined"
          />
          <View style={styles.fieldGap} />
          <TextInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.cancelBtn}
          textColor={Brand.textSecondary}
        >
          Cancel
        </Button>
        <GradientButton
          label={saving ? 'Saving...' : 'Save'}
          onPress={handleSave}
          loading={saving}
          disabled={!isValid}
          style={styles.saveBtn}
        />
      </View>

      <RNModal
        visible={traineePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTraineePickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          onPress={() => setTraineePickerVisible(false)}
          activeOpacity={1}
        >
          <Surface style={[styles.sheet, { backgroundColor: Brand.surfaceElevated }]}>
            <Text style={styles.sheetTitle}>Select Trainee</Text>
            {trainees.map((t) => (
              <List.Item
                key={t.id}
                title={t.name}
                titleStyle={{ color: Brand.textPrimary }}
                onPress={() => {
                  setTraineeId(t.id);
                  setTraineePickerVisible(false);
                }}
              />
            ))}
          </Surface>
        </TouchableOpacity>
      </RNModal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 20,
  },
  sectionAccent: { width: 3, height: 14, borderRadius: 2, backgroundColor: Brand.orange },
  sectionLabel: {
    color: Brand.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Montserrat_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Brand.surfaceDark,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    padding: 14,
  },
  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
  },
  monthText: { color: Brand.textPrimary, fontSize: 16, fontWeight: '600', flex: 1, textAlign: 'center' },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
  },
  pickerText: { flex: 1, color: Brand.textPrimary, fontSize: 15 },
  pickerPlaceholder: { color: Brand.textMuted },
  fieldGap: { height: 10 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: Brand.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
  },
  cancelBtn: {
    flex: 0,
    justifyContent: 'center',
    width: 100,
    borderColor: Brand.borderSubtle,
  },
  saveBtn: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  sheetTitle: {
    color: Brand.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 8,
  },
});
