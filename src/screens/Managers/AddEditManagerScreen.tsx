import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import {
  createManager,
  updateManager,
  getManagerById,
} from '../../database/repositories/managerRepository';

type Nav = StackNavigationProp<RootStackParamList, 'AddEditManager'>;
type Route = RouteProp<RootStackParamList, 'AddEditManager'>;

export default function AddEditManagerScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
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
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput
        label="Name *"
        value={name}
        onChangeText={setName}
        mode="outlined"
        error={!!errors.name}
      />
      {errors.name && (
        <Text variant="bodySmall" style={{ color: theme.colors.error }}>
          {errors.name}
        </Text>
      )}

      <TextInput
        label="Phone (optional)"
        value={phone}
        onChangeText={setPhone}
        mode="outlined"
        keyboardType="phone-pad"
      />

      <TextInput
        label="Email (optional)"
        value={email}
        onChangeText={setEmail}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        label="Per Class Rate *"
        value={rate}
        onChangeText={setRate}
        mode="outlined"
        keyboardType="numeric"
        error={!!errors.rate}
      />
      {errors.rate && (
        <Text variant="bodySmall" style={{ color: theme.colors.error }}>
          {errors.rate}
        </Text>
      )}

      <TextInput
        label="Notes (optional)"
        value={notes}
        onChangeText={setNotes}
        mode="outlined"
        multiline
        numberOfLines={3}
      />

      <View style={styles.actions}>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={{ flex: 1 }}>
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={{ flex: 1 }}
        >
          Save
        </Button>
      </View>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, gap: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
});
