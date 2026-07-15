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
  createManager,
  updateManager,
  getManagerById,
} from '../../database/repositories/managerRepository';
import GradientButton from '../../components/common/GradientButton';
import AppButton from '../../components/common/AppButton';

type Nav = StackNavigationProp<RootStackParamList, 'AddEditManager'>;
type Route = RouteProp<RootStackParamList, 'AddEditManager'>;

export default function AddEditManagerScreen() {
  const { colors, theme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { managerId } = route.params ?? {};

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; rate?: string }>({});

  useEffect(() => {
    if (managerId) {
      navigation.setOptions({ title: 'Edit Manager' });
      getManagerById(managerId).then((m) => {
        if (m) {
          setName(m.name);
          setPhone(m.phone ?? '');
          setEmail(m.email ?? '');
          setRate(String(m.per_class_rate));
          setNotes(m.notes ?? '');
        }
      });
    } else {
      navigation.setOptions({ title: 'Add Manager' });
    }
  }, [managerId, navigation]);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = 'Name is required';
    const rateNum = parseFloat(rate);
    if (!rate.trim() || isNaN(rateNum) || rateNum < 0) errs.rate = 'Enter a valid rate';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        per_class_rate: parseFloat(rate),
        currency: 'INR',
        notes: notes.trim() || undefined,
      };
      if (managerId) {
        await updateManager(managerId, data);
      } else {
        await createManager(data);
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
        <SectionHeader label="Basic Info" />
        <View style={styles.card}>
          <TextInput
            label="Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            dense
            error={!!errors.name}
            autoFocus
          />
          {errors.name && (
            <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: Spacing.xs }}>
              {errors.name}
            </Text>
          )}
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

        <SectionHeader label="Payment" />
        <View style={styles.card}>
          <TextInput
            label="Per Class Rate (₹) *"
            value={rate}
            onChangeText={setRate}
            mode="outlined"
            keyboardType="numeric"
            dense
            error={!!errors.rate}
          />
          {errors.rate && (
            <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: Spacing.xs }}>
              {errors.rate}
            </Text>
          )}
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
    justifyContent: "center",
    width: 100,
  },
  saveBtn: { flex: 1 },
});
