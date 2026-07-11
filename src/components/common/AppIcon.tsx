import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import {
  AddressBook,
  Alarm,
  Bell,
  BellRinging,
  Buildings,
  CalendarBlank,
  CalendarCheck,
  CalendarDots,
  CaretDown,
  CaretLeft,
  CaretRight,
  CaretUp,
  ChartBar,
  Check,
  Checks,
  ClockCountdown,
  CurrencyInr,
  Database,
  DownloadSimple,
  DotsSix,
  DotsThree,
  Barbell,
  Export,
  GearSix,
  HandCoins,
  House,
  LockKey,
  MapPin,
  MoneyWavy,
  NotePencil,
  Package,
  PencilSimple,
  Plus,
  Question,
  Rows,
  SlidersHorizontal,
  Tag,
  Trash,
  UploadSimple,
  User,
  UserCircle,
  Users,
  UsersThree,
  Warning,
  WarningCircle,
  WarningOctagon,
  XCircle,
  type IconProps,
} from 'phosphor-react-native';

function getNumericSize(size: IconProps['size']): number {
  if (typeof size === 'number') return size;
  const parsed = Number(size);
  return Number.isFinite(parsed) ? parsed : 20;
}

function CalendarDotsThreeIcon({ color = 'currentColor', size = 20, weight = 'regular', style }: IconProps) {
  const iconSize = getNumericSize(size);

  return (
    <View style={[styles.compositeIcon, { width: iconSize, height: iconSize }, style as StyleProp<ViewStyle>]}>
      <CalendarBlank color={color} size={iconSize} weight={weight} />
      <View style={styles.dotsInset}>
        <DotsThree color={color} size={Math.round(iconSize * 0.58)} weight="bold" />
      </View>
    </View>
  );
}

function CalendarDotsSixIcon({ color = 'currentColor', size = 20, weight = 'regular', style }: IconProps) {
  const iconSize = getNumericSize(size);

  return (
    <View style={[styles.compositeIcon, { width: iconSize, height: iconSize }, style as StyleProp<ViewStyle>]}>
      <CalendarBlank color={color} size={iconSize} weight={weight} />
      <View style={styles.dotsInset}>
        <DotsSix color={color} size={Math.round(iconSize * 0.5)} weight="bold" />
      </View>
    </View>
  );
}

const ICONS = {
  addressBook: AddressBook,
  alarm: Alarm,
  bell: Bell,
  bellRinging: BellRinging,
  buildings: Buildings,
  calendar: CalendarBlank,
  calendarCheck: CalendarCheck,
  calendarDots: CalendarDots,
  calendarMonth: CalendarDotsSixIcon,
  calendarWeek: CalendarDotsThreeIcon,
  caretDown: CaretDown,
  caretLeft: CaretLeft,
  caretRight: CaretRight,
  caretUp: CaretUp,
  chartBar: ChartBar,
  check: Check,
  checks: Checks,
  clockAlert: ClockCountdown,
  currencyInr: CurrencyInr,
  database: Database,
  download: DownloadSimple,
  barbell: Barbell,
  export: Export,
  gear: GearSix,
  handCoins: HandCoins,
  home: House,
  lock: LockKey,
  mapPin: MapPin,
  money: MoneyWavy,
  notePencil: NotePencil,
  package: Package,
  pencil: PencilSimple,
  plus: Plus,
  question: Question,
  rows: Rows,
  sliders: SlidersHorizontal,
  classSeries: CalendarDots,
  tag: Tag,
  trash: Trash,
  upload: UploadSimple,
  user: User,
  userCircle: UserCircle,
  users: Users,
  usersThree: UsersThree,
  warning: Warning,
  warningCircle: WarningCircle,
  warningOctagon: WarningOctagon,
  xCircle: XCircle,
} as const;

export type AppIconName = keyof typeof ICONS;

interface AppIconProps extends Omit<IconProps, 'color' | 'size'> {
  name: AppIconName;
  color: string;
  size?: number;
}

export default function AppIcon({ name, color, size = 20, weight = 'regular', ...props }: AppIconProps) {
  const Icon = ICONS[name];
  return <Icon color={color} size={size} weight={weight} {...props} />;
}

const styles = StyleSheet.create({
  compositeIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dotsInset: {
    bottom: 4,
    position: 'absolute',
  },
});
