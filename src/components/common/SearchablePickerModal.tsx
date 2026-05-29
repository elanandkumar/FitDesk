import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Modal,
  StyleSheet,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';
import GradientButton from './GradientButton';
import AppButton from './AppButton';

export interface PickerItem {
  id: number;
  label: string;
  hint?: string;
  leftColor?: string;
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  items: PickerItem[];
  selectedIds: number[];
  multiSelect?: boolean;
  onSelect: (ids: number[]) => void;
  onAddNew?: (searchText: string) => void;
  addNewEntityLabel?: string;
}

export default function SearchablePickerModal({
  visible,
  onDismiss,
  title,
  items,
  selectedIds,
  multiSelect = false,
  onSelect,
  onAddNew,
  addNewEntityLabel = 'item',
}: Props) {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [pendingIds, setPendingIds] = useState<number[]>([]);
  const inputRef = useRef<RNTextInput>(null);

  useEffect(() => {
    if (visible) {
      setPendingIds(selectedIds);
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((i) => i.label.toLowerCase().includes(q));
  }, [items, query]);

  const hasExactMatch = useMemo(() => {
    const q = query.trim().toLowerCase();
    return !q || items.some((i) => i.label.toLowerCase() === q);
  }, [items, query]);

  function toggleId(id: number) {
    if (multiSelect) {
      setPendingIds((prev) =>
        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      );
    } else {
      onSelect([id]);
      onDismiss();
    }
  }

  function handleConfirm() {
    onSelect(pendingIds);
    onDismiss();
  }

  function handleAddNew() {
    onAddNew?.(query.trim());
    onDismiss();
  }

  function renderItem({ item }: { item: PickerItem }) {
    const selected = pendingIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.row, selected && styles.rowSelected]}
        onPress={() => toggleId(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          {item.leftColor ? (
            <View style={[styles.colorDot, { backgroundColor: item.leftColor }]} />
          ) : null}
          <Text style={[styles.rowLabel, selected && styles.rowLabelSelected]}>
            {item.label}
          </Text>
          {item.hint ? (
            <Text style={styles.rowHint}>{item.hint}</Text>
          ) : null}
        </View>
        {multiSelect && (
          <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
            {selected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.backdrop}
        onPress={() => { Keyboard.dismiss(); onDismiss(); }}
        activeOpacity={1}
      >
        <Surface style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <TouchableOpacity activeOpacity={1} onPress={Keyboard.dismiss}>
            <Text style={styles.sheetTitle}>{title}</Text>

            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>🔍</Text>
              <RNTextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search..."
                placeholderTextColor={Brand.textMuted}
                style={styles.searchInput}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.clearBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>

          <FlatList
            data={filtered}
            keyExtractor={(i) => String(i.id)}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No results</Text>
            }
            ListFooterComponent={
              onAddNew && !hasExactMatch && query.trim().length > 0 ? (
                <TouchableOpacity style={styles.addRow} onPress={handleAddNew}>
                  <Text style={styles.addIcon}>＋</Text>
                  <Text style={styles.addLabel}>
                    Add "{query.trim()}" as new {addNewEntityLabel}
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />

          {multiSelect && (
            <View style={styles.footer}>
              <AppButton
                variant="ghost"
                label="Cancel"
                onPress={onDismiss}
                fullWidth={false}
                style={styles.cancelBtn}
              />
              <GradientButton
                label={`Select (${pendingIds.length})`}
                onPress={handleConfirm}
                style={styles.confirmBtn}
              />
            </View>
          )}
        </Surface>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Brand.surfaceElevated,
    borderTopLeftRadius: Radius.item,
    borderTopRightRadius: Radius.item,
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
    maxHeight: '70%',
  },
  sheetTitle: {
    ...Typography.h4,
    color: Brand.textPrimary,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Brand.surfaceDark,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Brand.borderSubtle,
    paddingHorizontal: Spacing.md,
    height: 44,
    gap: Spacing.sm,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    ...Typography.body,
    color: Brand.textPrimary,
    height: 44,
  },
  clearBtn: {
    color: Brand.textMuted,
    fontSize: 14,
  },
  list: { flexGrow: 0 },
  listContent: { paddingHorizontal: Spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginVertical: 1,
  },
  rowSelected: {
    backgroundColor: `${Brand.purple}22`,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowLabel: {
    ...Typography.body,
    color: Brand.textSecondary,
    flex: 1,
  },
  rowLabelSelected: {
    color: Brand.textPrimary,
  },
  rowHint: {
    ...Typography.caption,
    color: Brand.textMuted,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: Radius.full,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Brand.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  checkboxSelected: {
    backgroundColor: Brand.purple,
    borderColor: Brand.purple,
  },
  checkmark: {
    color: Brand.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyText: {
    ...Typography.body,
    color: Brand.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginVertical: 1,
  },
  addIcon: {
    color: Brand.purple,
    fontSize: 16,
    fontWeight: '700',
  },
  addLabel: {
    ...Typography.body,
    color: Brand.textAccent,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
  },
  cancelBtn: {
    flex: 0,
    width: 100,
    borderColor: Brand.borderSubtle,
    borderRadius: Radius.lg,
  },
  confirmBtn: { flex: 1 },
});
