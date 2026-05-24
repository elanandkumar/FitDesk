import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Button,
  Dialog,
  FAB,
  IconButton,
  List,
  Portal,
  Text,
  TextInput,
} from 'react-native-paper';
import { useAppTheme } from '../../theme';
import { ClassType } from '../../types';
import {
  getAllClassTypes,
  createClassType,
  updateClassType,
  deleteClassType,
} from '../../database/repositories/classTypeRepository';
import { DEFAULT_CLASS_COLORS } from '../../constants';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function ClassTypesScreen() {
  const { theme } = useAppTheme();
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClassType | null>(null);
  const [editTarget, setEditTarget] = useState<ClassType | null>(null);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_CLASS_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setClassTypes(await getAllClassTypes());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditTarget(null);
    setName('');
    setSelectedColor(DEFAULT_CLASS_COLORS[0]);
    setDialogVisible(true);
  }

  function openEdit(ct: ClassType) {
    setEditTarget(ct);
    setName(ct.name);
    setSelectedColor(ct.color);
    setDialogVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await updateClassType(editTarget.id, name.trim(), selectedColor);
      } else {
        await createClassType(name.trim(), selectedColor);
      }
      setDialogVisible(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteClassType(deleteTarget.id);
      setDeleteTarget(null);
      await load();
    } catch (e: unknown) {
      setDeleteTarget(null);
      if (e instanceof Error && e.message === 'CLASS_TYPE_IN_USE') {
        Alert.alert(
          'Cannot Delete',
          'This class type is used by one or more class series. Remove those series first.'
        );
      }
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={classTypes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={<EmptyState title="No class types" subtitle="Tap + to add one" />}
        renderItem={({ item }) => (
          <List.Item
            title={item.name}
            style={{ backgroundColor: theme.colors.surface }}
            titleStyle={{ color: theme.colors.onSurface }}
            left={() => (
              <View style={[styles.colorDot, { backgroundColor: item.color, marginVertical: 'auto' }]} />
            )}
            right={() => (
              <View style={styles.rowActions}>
                <IconButton icon="pencil" size={20} onPress={() => openEdit(item)} />
                <IconButton icon="delete" size={20} onPress={() => setDeleteTarget(item)} />
              </View>
            )}
          />
        )}
        ItemSeparatorComponent={() => (
          <View style={{ height: 1, backgroundColor: theme.colors.surfaceVariant }} />
        )}
      />

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: theme.colors.primary }]}
        color={theme.colors.onPrimary}
        onPress={openAdd}
      />

      <Portal>
        <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
          <Dialog.Title>{editTarget ? 'Edit Class Type' : 'Add Class Type'}</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <TextInput
              label="Name *"
              value={name}
              onChangeText={setName}
              mode="outlined"
              autoFocus
            />
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Color
            </Text>
            <View style={styles.colorRow}>
              {DEFAULT_CLASS_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setSelectedColor(c)}
                  style={[
                    styles.colorDot,
                    { backgroundColor: c },
                    selectedColor === c && styles.colorSelected,
                  ]}
                />
              ))}
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleSave}
              loading={saving}
              disabled={!name.trim() || saving}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Class Type"
        message={`Delete "${deleteTarget?.name}"? Classes using this type will be affected.`}
        onConfirm={handleDelete}
        onDismiss={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  colorDot: { width: 24, height: 24, borderRadius: 12, marginHorizontal: 8 },
  colorSelected: { borderWidth: 3, borderColor: '#000' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  fab: { position: 'absolute', bottom: 16, right: 16, borderRadius: 4 },
  dialogContent: { gap: 12 },
});
