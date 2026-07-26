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
  createOrganizer,
  updateOrganizer,
  getOrganizerById,
} from '../../database/repositories/organizerRepository';
import GradientButton from '../../components/common/GradientButton';
import AppButton from '../../components/common/AppButton';
import ThemedSegmentedButtons from '../../components/common/ThemedSegmentedButtons';
import { OrganizerContactType } from '../../types';

type Nav = StackNavigationProp<RootStackParamList, 'AddEditOrganizer'>;
type Route = RouteProp<RootStackParamList, 'AddEditOrganizer'>;

export default function AddEditOrganizerScreen() {
  const { colors, theme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { organizerId, returnToAddSession } = route.params ?? {};

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [contactType, setContactType] = useState<OrganizerContactType>('regular');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; rate?: string }>({});

  useEffect(() => {
    if (organizerId) {
      navigation.setOptions({ title: 'Edit Organizer' });
      getOrganizerById(organizerId).then((m) => {
        if (m) {
          setName(m.name);
          setContactPerson(m.contact_person ?? '');
          setPhone(m.phone ?? '');
          setEmail(m.email ?? '');
          setRate(String(m.per_class_rate));
          setNotes(m.notes ?? '');
          setContactType(m.contact_type);
        }
      });
    } else {
      navigation.setOptions({ title: 'Add Organizer' });
    }
  }, [organizerId, navigation]);

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!name.trim()) errs.name = 'Name is required';
    const rateNum = rate.trim() ? parseFloat(rate) : 0;
    if (contactType === 'regular' && (isNaN(rateNum) || rateNum < 0)) {
      errs.rate = 'Enter a valid rate';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    setSaving(true);
    try {
      const data = {
        name: name.trim(),
        contact_person: contactPerson.trim() || undefined,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        per_class_rate: rate.trim() ? parseFloat(rate) : 0,
        currency: 'INR',
        notes: notes.trim() || undefined,
        contact_type: contactType,
      };
      if (organizerId) {
        await updateOrganizer(organizerId, data);
      } else {
        const created = await createOrganizer(data);
        if (returnToAddSession) {
          navigation.popTo('AddSession', { selectedOrganizerId: created.id });
          return;
        }
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
        <SectionHeader label="Organizer Info" />
        <View style={styles.card}>
          <Text variant="labelMedium" style={styles.fieldLabel}>Contact type</Text>
          <ThemedSegmentedButtons
            value={contactType}
            onValueChange={(value: string) => {
              setContactType(value as OrganizerContactType);
              setErrors({});
            }}
            buttons={[
              { value: 'regular', label: 'Regular' },
              { value: 'one_time', label: 'One-time' },
            ]}
          />
          <View style={styles.fieldGap} />
          <TextInput
            label="Contact person (optional)"
            value={contactPerson}
            onChangeText={setContactPerson}
            mode="outlined"
            dense
          />
          <View style={styles.fieldGap} />
          <TextInput
            label="Organizer / company name *"
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

        {contactType === 'regular' && (
          <>
            <SectionHeader label="Payment" />
            <View style={styles.card}>
              <TextInput
                label="Default session rate (₹) (optional)"
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
          </>
        )}

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
  fieldLabel: { color: colors.textSecondary, marginBottom: Spacing.xs },
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
