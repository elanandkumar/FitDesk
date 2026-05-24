import React, { useCallback, useEffect, useState } from 'react';
import { Modal as RNModal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, List, Surface, Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import { Trainee } from '../../types';
import { getAllTrainees } from '../../database/repositories/traineeRepository';
import { createTraineePackage } from '../../database/repositories/paymentRepository';

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

export default function AddPackageScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();

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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Trainee picker */}
      <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
        Trainee *
      </Text>
      <TouchableOpacity
        onPress={() => setTraineePickerVisible(true)}
        style={[styles.pickerButton, { borderColor: theme.colors.outline }]}
      >
        {selectedTrainee ? (
          <Text style={{ color: theme.colors.onSurface }}>{selectedTrainee.name}</Text>
        ) : trainees.length === 0 ? (
          <Text style={{ color: theme.colors.onSurfaceVariant }}>No trainees added yet</Text>
        ) : (
          <Text style={{ color: theme.colors.onSurfaceVariant }}>Select trainee...</Text>
        )}
      </TouchableOpacity>

      {/* Month */}
      <Text variant="labelMedium" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
        Month *
      </Text>
      <View style={styles.monthRow}>
        <IconButton
          icon="chevron-left"
          size={24}
          onPress={() => adjustMonth(-1)}
          iconColor={theme.colors.onSurface}
        />
        <Text variant="bodyLarge" style={[styles.monthText, { color: theme.colors.onSurface }]}>
          {formatMonth(month)}
        </Text>
        <IconButton
          icon="chevron-right"
          size={24}
          onPress={() => adjustMonth(1)}
          iconColor={theme.colors.onSurface}
        />
      </View>

      <TextInput
        label="Total Sessions *"
        value={totalSessions}
        onChangeText={(v) => setTotalSessions(v.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Amount (₹) *"
        value={amount}
        onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ''))}
        keyboardType="decimal-pad"
        mode="outlined"
        style={styles.input}
      />
      <TextInput
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        style={styles.input}
        multiline
        numberOfLines={3}
      />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.cancelBtn, { borderColor: theme.colors.outline }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: theme.colors.onSurface }}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            styles.saveBtn,
            { backgroundColor: isValid && !saving ? theme.colors.primary : theme.colors.surfaceDisabled },
          ]}
          onPress={handleSave}
          disabled={!isValid || saving}
        >
          <Text style={{ color: isValid && !saving ? theme.colors.onPrimary : theme.colors.onSurfaceDisabled }}>
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Trainee picker sheet */}
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
          <Surface style={[styles.sheet, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={[styles.sheetTitle, { color: theme.colors.onSurface }]}>
              Select Trainee
            </Text>
            {trainees.map((t) => (
              <List.Item
                key={t.id}
                title={t.name}
                titleStyle={{ color: theme.colors.onSurface }}
                onPress={() => {
                  setTraineeId(t.id);
                  setTraineePickerVisible(false);
                }}
              />
            ))}
          </Surface>
        </TouchableOpacity>
      </RNModal>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 4 },
  label: { marginBottom: 6, marginTop: 8 },
  input: { marginBottom: 4 },
  pickerButton: {
    borderWidth: 1,
    borderRadius: 4,
    padding: 14,
    minHeight: 52,
    justifyContent: 'center',
    marginBottom: 4,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  monthText: { flex: 1, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: { borderWidth: 1 },
  saveBtn: {},
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 32,
    maxHeight: '60%',
  },
  sheetTitle: { padding: 16, paddingBottom: 8 },
});
