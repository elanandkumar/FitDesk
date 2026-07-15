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
import { useAppTheme } from '../../theme';
import { Radius, Spacing, Typography } from '../../theme/brandColors';
import AppIcon, { AppIconName } from './AppIcon';

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
  leadingIcon?: AppIconName;
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
  leadingIcon,
}: Props) {
  const { accentPalette, colors } = useAppTheme();
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
        style={[styles.row, selected && { backgroundColor: `${accentPalette.main}22` }]}
        onPress={() => toggleId(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.rowLeft}>
          {item.leftColor ? (
            <View style={[styles.colorDot, { backgroundColor: item.leftColor }]} />
          ) : leadingIcon ? (
            <View style={[styles.leadingIcon, { backgroundColor: `${accentPalette.main}22`, borderColor: `${accentPalette.main}55` }]}>
              <AppIcon name={leadingIcon} size={20} color={accentPalette.textAccent} />
            </View>
          ) : showAvatar ? (
            <View style={[styles.avatar, { backgroundColor: `${accentPalette.main}22`, borderColor: `${accentPalette.main}55` }]}>
              <Text style={[styles.avatarText, { color: accentPalette.textAccent }]}>{getInitials(item.label)}</Text>
            </View>
          ) : null}
          <Text style={[styles.rowLabel, { color: selected ? colors.textPrimary : colors.textSecondary }]}>
            {item.label}
          </Text>
          {item.hint ? (
            <Text style={[styles.rowHint, { color: colors.textMuted }]}>{item.hint}</Text>
          ) : null}
        </View>
        {multiSelect && (
          <View
            style={[
              styles.checkbox,
              { borderColor: colors.textMuted },
              selected && { backgroundColor: accentPalette.main, borderColor: accentPalette.main },
            ]}
          >
            {selected && <AppIcon name="check" size={13} color="#FFFFFF" weight="bold" />}
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
      <Pressable style={[styles.root, { backgroundColor: colors.scrim }]} onPress={onDismiss}>
        <Pressable style={[styles.sheet, { paddingBottom: insets.bottom || Spacing.lg, backgroundColor: colors.surfaceRaised, borderTopColor: colors.border }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>{headerTitle}</Text>
            {onAddNew && (
              <TouchableOpacity
                onPress={onAddNew}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.headerBtn}
              >
                <AppIcon name="plus" size={20} color={accentPalette.textAccent} />
              </TouchableOpacity>
            )}
          </View>

          <FlatList
            data={items}
            keyExtractor={(i) => String(i.id)}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: colors.border }]} />}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No items</Text>
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
  },
  sheet: {
    height: '55%',
    borderTopLeftRadius: Radius.item,
    borderTopRightRadius: Radius.item,
    borderTopWidth: 1,
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
    flex: 1,
  },
  headerBtn: {
    padding: Spacing.xs,
  },
  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  separator: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
  },
  rowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rowLabel: {
    ...Typography.body,
    flex: 1,
  },
  rowHint: {
    ...Typography.caption,
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
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...Typography.bodyLg,
    fontWeight: '700',
  },
  leadingIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },
});
