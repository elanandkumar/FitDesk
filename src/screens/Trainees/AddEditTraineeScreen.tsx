import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import SectionHeader from '../../components/common/SectionHeader';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { AppThemeColors, Radius, Spacing } from '../../theme/brandColors';
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

export default function AddEditTraineeScreen() {
  const { colors, theme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
        <SectionHeader label="Contact" />
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

        <SectionHeader label="Notes" />
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

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: Spacing.lg,
  },
  fieldGap: { height: Spacing.sm },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 0,
    justifyContent: 'center',
    width: 100,
  },
  saveBtn: { flex: 1 },
});
