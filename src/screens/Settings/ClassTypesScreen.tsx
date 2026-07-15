import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import {
  Text,
  TextInput,
} from 'react-native-paper';
import AppModal from '../../components/common/AppModal';
import GradientFAB from '../../components/common/GradientFAB';
import AppIconButton from '../../components/common/AppIconButton';
import { AppThemeColors, Layout, Radius, Spacing, useAppTheme } from '../../theme';
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
  const { accentPalette, colors, theme } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    await deleteClassType(deleteTarget.id);
    setDeleteTarget(null);
    await load();
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
              <AppIconButton
                icon="pencil"
                size={20}
                iconColor={accentPalette.textAccent}
                onPress={() => openEdit(item)}
              />
              <AppIconButton
                icon="trash"
                size={20}
                iconColor={theme.colors.error}
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
          <Text variant="labelMedium" style={{ color: colors.textSecondary }}>
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
        message={`Delete "${deleteTarget?.name}"? If used by series, it will be archived instead.`}
        onConfirm={handleDelete}
        onDismiss={() => setDeleteTarget(null)}
      />
    </View>
  );
}

const createStyles = (colors: AppThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { padding: Spacing.lg, paddingBottom: Layout.LIST_PAD_NO_FAB },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: Radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    gap: Spacing.md,
  },
  itemName: { flex: 1, color: colors.textPrimary },
  colorDot: { width: 24, height: 24, borderRadius: Radius.full },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  fab: { position: 'absolute', bottom: Spacing.lg, right: Spacing.lg },
  dialogContent: { gap: Spacing.md },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorSwatch: { width: 28, height: 28, borderRadius: Radius.full },
  colorSelected: { borderWidth: 3, borderColor: colors.textPrimary },
});
