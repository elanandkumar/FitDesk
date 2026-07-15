import React, { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Divider, Text } from 'react-native-paper';
import GradientFAB from '../../components/common/GradientFAB';
import AppIconButton from '../../components/common/AppIconButton';
import { useIsFocused, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Calendar, CalendarProvider, WeekCalendar } from 'react-native-calendars';
import type { DateData } from 'react-native-calendars';
import { AccentPalette, useAppTheme, Radius, Spacing } from '../../theme';
import { Layout, Typography } from '../../theme/brandColors';
import { EnrichedSession } from '../../types';
import { getEnrichedSessionsByDateRange } from '../../database/repositories/classSessionRepository';
import { formatDisplayDate, todayISO } from '../../utils/dateUtils';
import { RootStackParamList } from '../../navigation/types';
import HelpSheet from '../../components/common/HelpSheet';
import SessionCard from '../../components/common/SessionCard';
import { HELP } from '../../constants/helpContent';
import { listItemEntering } from '../../animations/listItemEntering';

type Nav = StackNavigationProp<RootStackParamList>;
type ViewMode = 'week' | 'month';

type MarkedDates = Record<string, { dots: { key: string; color: string }[]; selected?: boolean; selectedColor?: string }>;

function localISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function weekRange(dateStr: string): { start: string; end: string } {
  const date = new Date(dateStr + 'T00:00:00');
  const day = date.getDay();
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - day);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  return { start: localISO(startDate), end: localISO(endDate) };
}

function monthRange(dateStr: string): { start: string; end: string } {
  const date = new Date(dateStr + 'T00:00:00');
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: localISO(start), end: localISO(end) };
}

const CALENDAR_THEME = (
  theme: ReturnType<typeof useAppTheme>['theme'],
  accentPalette: AccentPalette,
) => ({
  backgroundColor: theme.colors.surface,
  calendarBackground: theme.colors.surface,
  textSectionTitleColor: theme.colors.onSurfaceVariant,
  selectedDayBackgroundColor: accentPalette.main,
  selectedDayTextColor: theme.colors.onPrimary,
  todayTextColor: accentPalette.warm,
  dayTextColor: theme.colors.onSurface,
  textDisabledColor: theme.colors.onSurfaceVariant,
  arrowColor: accentPalette.main,
  monthTextColor: theme.colors.onSurface,
  dotColor: accentPalette.main,
  selectedDotColor: theme.colors.onPrimary,
});

export default function CalendarScreen() {
  const { accentPalette, colors, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const today = todayISO();
  const [helpVisible, setHelpVisible] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  const [weekStart, setWeekStart] = useState(() => weekRange(today).start);
  const [monthAnchor, setMonthAnchor] = useState(() => today.slice(0, 7) + '-01');
  const [sessions, setSessions] = useState<EnrichedSession[]>([]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [animationCycle, setAnimationCycle] = useState(0);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const daySessions = useMemo(
    () => sessions.filter((s) => s.session_date === selectedDate),
    [sessions, selectedDate],
  );

  const isFocused = useIsFocused();

  const calTheme = useMemo(() => CALENDAR_THEME(theme, accentPalette), [accentPalette, theme]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row' }}>
          <AppIconButton
            icon="classSeries"
            iconColor={accentPalette.textAccent}
            onPress={() => navigation.navigate('ClassSeriesList')}
          />
          <AppIconButton
            icon={viewMode === 'week' ? 'calendarMonth' : 'calendarWeek'}
            iconColor={accentPalette.textAccent}
            onPress={() =>
              setViewMode((prev) => {
                const next = prev === 'week' ? 'month' : 'week';
                if (next === 'month') setMonthAnchor(selectedDate.slice(0, 7) + '-01');
                else setWeekStart(weekRange(selectedDate).start);
                return next;
              })
            }
          />
          <AppIconButton
            icon="question"
            iconColor={accentPalette.textAccent}
            onPress={() => setHelpVisible(true)}
          />
        </View>
      ),
    });
  }, [accentPalette.textAccent, navigation, viewMode, selectedDate]);

  const loadRange = useCallback(async (start: string, end: string) => {
    const data = await getEnrichedSessionsByDateRange(start, end);
    setSessions(data);
    const marks: MarkedDates = {};
    for (const s of data) {
      if (s.status === 'cancelled' || s.status === 'skipped') continue;
      const existing = marks[s.session_date] ?? { dots: [] };
      const alreadyHasColor = existing.dots.some((d) => d.key === s.class_type_color);
      if (!alreadyHasColor) {
        existing.dots.push({ key: s.class_type_color, color: s.class_type_color });
      }
      marks[s.session_date] = existing;
    }
    setMarkedDates(marks);
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    const range = viewMode === 'week' ? weekRange(weekStart) : monthRange(monthAnchor);
    loadRange(range.start, range.end);
  }, [weekStart, monthAnchor, viewMode, isFocused, loadRange]);

  useEffect(() => {
    if (isFocused) setAnimationCycle((cycle) => cycle + 1);
  }, [isFocused]);

  function handleDateChanged(date: string) {
    const newWeekStart = weekRange(date).start;
    setSelectedDate(date);
    if (newWeekStart !== weekStart) {
      setWeekStart(newWeekStart);
    }
  }

  function handleDayPress(date: DateData) {
    setSelectedDate(date.dateString);
  }

  function handleMonthChange(month: DateData) {
    setMonthAnchor(month.dateString.slice(0, 7) + '-01');
  }

  const marked: MarkedDates = { ...markedDates };
  if (selectedDate) {
    marked[selectedDate] = {
      ...(marked[selectedDate] ?? { dots: [] }),
      selected: true,
      selectedColor: accentPalette.main,
    };
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ flex: 0, backgroundColor: theme.colors.surface }}>
        {viewMode === 'week' ? (
          <CalendarProvider
            date={selectedDate}
            onDateChanged={handleDateChanged}
            style={{ flex: 0 }}
            theme={{ todayButtonTextColor: accentPalette.warm }}
          >
            <WeekCalendar
              markingType="multi-dot"
              markedDates={marked}
              onDayPress={handleDayPress}
              theme={calTheme}
            />
          </CalendarProvider>
        ) : (
          <Calendar
            current={selectedDate}
            markingType="multi-dot"
            markedDates={marked}
            onDayPress={handleDayPress}
            onMonthChange={handleMonthChange}
            theme={calTheme}
          />
        )}
      </View>

      <Divider style={{ backgroundColor: colors.border }} />

      <View style={styles.dayHeader}>
        <Text style={{ ...Typography.h3, color: colors.textSecondary }}>
          {selectedDate === today ? 'Today' : formatDisplayDate(selectedDate)}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.textMuted }}>
          {daySessions.length === 0 ? 'No sessions' : `${daySessions.length} session${daySessions.length > 1 ? 's' : ''}`}
        </Text>
      </View>

      <FlatList
        data={daySessions}
        keyExtractor={(item) => `${animationCycle}-${item.id}`}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Layout.LIST_PAD_NO_FAB, paddingTop: Spacing.sm }}
        ListEmptyComponent={
          <View style={styles.emptyDay}>
            <Text variant="bodyMedium" style={{ color: colors.textMuted }}>
              No sessions on this date
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Animated.View entering={listItemEntering(index)}>
            <SessionCard
              session={item}
              onPress={() => navigation.navigate('ClassSessionDetail', { sessionId: item.id })}
              style={styles.sessionCard}
            />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      <GradientFAB
        icon="plus"
        style={[styles.fab, { bottom: Layout.FAB_BOTTOM + insets.bottom }]}
        onPress={() => navigation.navigate('AddSession', { initialDate: selectedDate })}
      />

      <HelpSheet visible={helpVisible} onDismiss={() => setHelpVisible(false)} content={HELP.calendar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  emptyDay: { flex: 1, alignItems: 'center', paddingTop: Spacing.section },
  sessionCard: {
    marginHorizontal: Spacing.lg,
  },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
  },
});
