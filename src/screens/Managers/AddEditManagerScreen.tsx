import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../theme';
import { Brand, Radius } from '../../theme/brandColors';
import { RootStackParamList } from '../../navigation/types';
import {
  createManager,
  updateManager,
  getManagerById,
} from '../../database/repositories/managerRepository';
import GradientButton from '../../components/common/GradientButton';

type Nav = StackNavigationProp<RootStackParamList, 'AddEditManager'>;
type Route = RouteProp<RootStackParamList, 'AddEditManager'>;

function FormSection({ label }: { label: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

export default function AddEditManagerScreen() {
  const { theme } = useAppTheme();
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
        <FormSection label="Basic Info" />
        <View style={styles.card}>
          <TextInput
            label="Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            error={!!errors.name}
            autoFocus
          />
          {errors.name && (
            <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
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
          />
          <View style={styles.fieldGap} />
          <TextInput
            label="Email (optional)"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <FormSection label="Payment" />
        <View style={styles.card}>
          <TextInput
            label="Per Class Rate (₹) *"
            value={rate}
            onChangeText={setRate}
            mode="outlined"
            keyboardType="numeric"
            error={!!errors.rate}
          />
          {errors.rate && (
            <Text variant="bodySmall" style={{ color: theme.colors.error, marginTop: 4 }}>
              {errors.rate}
            </Text>
          )}
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
          style={styles.saveBtn}
        />
      </View>
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
  sectionAccent: { width: 3, height: 14, borderRadius: Radius.xs, backgroundColor: Brand.orange },
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
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    padding: 14,
  },
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
    justifyContent: "center",
    width: 100,
    borderColor: Brand.borderSubtle,
    borderRadius: Radius.lg,
  },
  saveBtn: { flex: 1 },
});
