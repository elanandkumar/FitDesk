import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, Radius, Spacing, Typography } from '../../theme/brandColors';

export interface PickerItem {
  id: number;
  label: string;
  hint?: string;
  leftColor?: string;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  items: PickerItem[];
  selectedIds: number[];
  multiSelect?: boolean;
  onSelect: (ids: number[]) => void;
  onAddNew?: () => void;
  addNewLabel?: string;
  showAvatar?: boolean;
}

export default function PickerModal({
  visible,
  onDismiss,
  title,
  items,
  selectedIds,
  multiSelect = false,
  onSelect,
  onAddNew,
  addNewLabel = 'Add New',
  showAvatar = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [activeIds, setActiveIds] = useState<number[]>([]);

  useEffect(() => {
    if (visible) setActiveIds(selectedIds);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleId(id: number) {
    if (multiSelect) {
      const next = activeIds.includes(id)
        ? activeIds.filter((x) => x !== id)
        : [...activeIds, id];
      setActiveIds(next);
      onSelect(next);
    } else {
      onSelect([id]);
      onDismiss();
    }
  }

  const headerTitle = multiSelect && activeIds.length > 0
    ? `${title} (${activeIds.length})`
    : title;

  function renderItem({ item }: { item: PickerItem }) {
    const selected = activeIds.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.row, selected && styles.rowSelected]}
        onPress={() => toggleId(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          {item.leftColor ? (
            <View style={[styles.colorDot, { backgroundColor: item.leftColor }]} />
          ) : showAvatar ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(item.label)}</Text>
            </View>
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
            {selected && <MaterialCommunityIcons name="check" size={13} color={Brand.textPrimary} />}
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
      statusBarTranslucent
    >
      <Pressable style={styles.root} onPress={onDismiss}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom || Spacing.lg }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.sheetTitle}>{headerTitle}</Text>
            {onAddNew && (
              <TouchableOpacity
                onPress={onAddNew}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.headerBtn}
              >
                <MaterialCommunityIcons name="plus" size={20} color={Brand.textAccent} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={items}
            keyExtractor={(i) => String(i.id)}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No items</Text>
            }
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10, 5, 25, 0.65)',
  },
  sheet: {
    height: '55%',
    backgroundColor: Brand.surfaceElevated,
    borderTopLeftRadius: Radius.item,
    borderTopRightRadius: Radius.item,
    borderTopWidth: 1,
    borderTopColor: Brand.borderSubtle,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  sheetTitle: {
    ...Typography.h4,
    color: Brand.textPrimary,
    flex: 1,
  },
  headerBtn: {
    padding: Spacing.xs,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  separator: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    marginHorizontal: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
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
  avatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    backgroundColor: Brand.surfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.bodyLg,
    fontWeight: '700',
    color: Brand.textPrimary,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderColor: Brand.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  checkboxSelected: {
    backgroundColor: Brand.purple,
    borderColor: Brand.purple,
  },
  emptyText: {
    ...Typography.body,
    color: Brand.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});
