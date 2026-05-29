import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  IconButton,
  Text,
  TextInput,
} from 'react-native-paper';
import AppModal from '../../components/common/AppModal';
import GradientFAB from '../../components/common/GradientFAB';
import { Brand, Layout, Radius, Spacing } from '../../theme/brandColors';
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
    <View style={styles.container}>
      <FlatList
        data={classTypes}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
        ListEmptyComponent={<EmptyState title="No class types" subtitle="Tap + to add one" />}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={[styles.colorDot, { backgroundColor: item.color }]} />
            <Text variant="titleSmall" style={styles.itemName}>{item.name}</Text>
            <View style={styles.rowActions}>
              <IconButton
                icon="pencil"
                size={20}
                iconColor={Brand.textSecondary}
                onPress={() => openEdit(item)}
              />
              <IconButton
                icon="delete"
                size={20}
                iconColor={Brand.textSecondary}
                onPress={() => setDeleteTarget(item)}
              />
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      <GradientFAB
        icon="plus"
        style={styles.fab}
        onPress={openAdd}
      />

      <AppModal
        visible={dialogVisible}
        onDismiss={() => setDialogVisible(false)}
        title={editTarget ? 'Edit Class Type' : 'Add Class Type'}
        confirmLabel="Save"
        onConfirm={handleSave}
        loading={saving}
      >
        <View style={styles.dialogContent}>
          <TextInput
            label="Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            dense
            autoFocus
          />
          <Text variant="labelMedium" style={{ color: Brand.textSecondary }}>
            Color
          </Text>
          <View style={styles.colorRow}>
            {DEFAULT_CLASS_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setSelectedColor(c)}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: c },
                  selectedColor === c && styles.colorSelected,
                ]}
              />
            ))}
          </View>
        </View>
      </AppModal>

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
  container: { flex: 1, backgroundColor: Brand.backgroundDark },
  listContent: { padding: Spacing.lg, paddingBottom: Layout.LIST_PAD_NO_FAB },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    elevation: 4,
    shadowColor: Brand.purple,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    gap: Spacing.md,
  },
  itemName: { flex: 1, color: Brand.textPrimary },
  colorDot: { width: 24, height: 24, borderRadius: Radius.full },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  fab: { position: 'absolute', bottom: Spacing.lg, right: Spacing.lg },
  dialogContent: { gap: Spacing.md },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorSwatch: { width: 28, height: 28, borderRadius: Radius.full },
  colorSelected: { borderWidth: 3, borderColor: Brand.textPrimary },
});
