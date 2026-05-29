import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { IconButton, Text, TextInput } from 'react-native-paper';
import AppModal from '../../components/common/AppModal';
import GradientFAB from '../../components/common/GradientFAB';
import EmptyState from '../../components/common/EmptyState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Brand, Layout, Radius, Spacing } from '../../theme/brandColors';
import { Center } from '../../types';
import {
  getAllCenters,
  createCenter,
  updateCenter,
  deleteCenter,
} from '../../database/repositories/centerRepository';

export default function CentersScreen() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Center | null>(null);
  const [editTarget, setEditTarget] = useState<Center | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setCenters(await getAllCenters());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditTarget(null);
    setName('');
    setAddress('');
    setDialogVisible(true);
  }

  function openEdit(center: Center) {
    setEditTarget(center);
    setName(center.name);
    setAddress(center.address ?? '');
    setDialogVisible(true);
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data = { name: name.trim(), address: address.trim() || undefined };
      if (editTarget) {
        await updateCenter(editTarget.id, data);
      } else {
        await createCenter(data);
      }
      setDialogVisible(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteCenter(deleteTarget.id);
    setDeleteTarget(null);
    await load();
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={centers}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={[styles.listContent, { flexGrow: 1 }]}
        ListEmptyComponent={<EmptyState title="No centers" subtitle="Tap + to add a venue" />}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            <View style={styles.itemText}>
              <Text variant="titleSmall" style={styles.itemName}>{item.name}</Text>
              {item.address ? (
                <Text variant="bodySmall" style={styles.itemAddress}>{item.address}</Text>
              ) : null}
            </View>
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
        title={editTarget ? 'Edit Center' : 'Add Center'}
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
          <TextInput
            label="Address (optional)"
            value={address}
            onChangeText={setAddress}
            mode="outlined"
            dense
          />
        </View>
      </AppModal>

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Remove Center"
        message={`Remove "${deleteTarget?.name}"? If referenced by sessions or series, it will be archived instead.`}
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
  },
  itemText: { flex: 1, gap: 2 },
  itemName: { color: Brand.textPrimary },
  itemAddress: { color: Brand.textMuted },
  rowActions: { flexDirection: 'row', alignItems: 'center' },
  fab: { position: 'absolute', bottom: Spacing.lg, right: Spacing.lg },
  dialogContent: { gap: Spacing.md },
});
