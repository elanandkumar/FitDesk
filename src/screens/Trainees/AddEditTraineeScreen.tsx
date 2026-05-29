import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import {
  createTrainee,
  updateTrainee,
  getTraineeById,
} from '../../database/repositories/traineeRepository';
import GradientButton from '../../components/common/GradientButton';
import AppButton from '../../components/common/AppButton';

type Nav = StackNavigationProp<RootStackParamList, 'AddEditTrainee'>;
type Route = RouteProp<RootStackParamList, 'AddEditTrainee'>;

function FormSection({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

export default function AddEditTraineeScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { traineeId } = route.params ?? {};

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => {
    if (traineeId) {
      navigation.setOptions({ title: 'Edit Trainee' });
      getTraineeById(traineeId).then((t) => {
        if (t) {
          setName(t.name);
          setPhone(t.phone ?? '');
          setEmail(t.email ?? '');
          setNotes(t.notes ?? '');
        }
      });
    } else {
      navigation.setOptions({ title: 'Add Trainee' });
    }
  }, [traineeId, navigation]);

  async function handleSave() {
    if (!name.trim()) {
      setNameError('Name is required');
      return;
    }
    setNameError('');
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      if (traineeId) {
        await updateTrainee(traineeId, data);
      } else {
        await createTrainee(data);
      }
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior="padding"
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <FormSection label="Contact" />
        <View style={styles.card}>
          <TextInput
            label="Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            dense
            error={!!nameError}
            autoFocus
          />
          {nameError ? (
            <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: Spacing.xs }}>
              {nameError}
            </Text>
          ) : null}
          <View style={styles.fieldGap} />
          <TextInput
            label="Phone (optional)"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            keyboardType="phone-pad"
            dense
          />
          <View style={styles.fieldGap} />
          <TextInput
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            dense
          />
        </View>

        <FormSection label="Notes" />
        <View style={styles.card}>
          <TextInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            mode="outlined"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={{ height: 16 }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <AppButton
          variant="ghost"
          label="Cancel"
          onPress={() => navigation.goBack()}
          style={styles.cancelBtn}
        />
        <GradientButton
          label={saving ? 'Saving...' : 'Save'}
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xl,
  },
  sectionAccent: { width: 3, height: 14, borderRadius: Radius.xs, backgroundColor: Brand.orange },
  sectionLabel: {
    ...Typography.labelSm,
    color: Brand.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    padding: Spacing.lg,
  },
  fieldGap: { height: Spacing.sm },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Brand.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
  },
  cancelBtn: {
    flex: 0,
    justifyContent: 'center',
    width: 100,
    borderColor: Brand.borderSubtle,
    borderRadius: Radius.lg,
  },
  saveBtn: { flex: 1 },
});
