import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text, TextInput } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useAppTheme } from '../../theme';
import { RootStackParamList } from '../../navigation/types';
import {
  createTrainee,
  updateTrainee,
  getTraineeById,
} from '../../database/repositories/traineeRepository';

type Nav = StackNavigationProp<RootStackParamList, 'AddEditTrainee'>;
type Route = RouteProp<RootStackParamList, 'AddEditTrainee'>;

export default function AddEditTraineeScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
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
        error={!!nameError}
        autoFocus
      />
      {nameError ? (
        <Text variant="bodySmall" style={{ color: theme.colors.error }}>
          {nameError}
        </Text>
      ) : null}

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
