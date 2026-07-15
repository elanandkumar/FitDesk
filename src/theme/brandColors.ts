export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedThemeMode = 'light' | 'dark';

export const BrandCore = {
  purple: '#7B35FF',
  pink: '#FF3D81',
  orange: '#FF7A00',
} as const;

export interface AppThemeColors {
  background: string;
  surface: string;
  surfaceRaised: string;
  surfaceCard: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  shadow: string;
  scrim: string;
  danger: string;
  success: string;
  info: string;
  warning: string;
}

export const ThemePalettes = {
  light: {
    background: '#F7F7FA',
    surface: '#FFFFFF',
    surfaceRaised: '#F0EEF5',
    surfaceCard: '#FFFFFF',
    border: '#DED9E8',
    textPrimary: '#201C29',
    textSecondary: '#514B60',
    textMuted: '#70697E',
    textDisabled: '#9892A2',
    shadow: '#000000',
    scrim: '#00000052',
    danger: '#C62828',
    success: '#287A3E',
    info: '#1769AA',
    warning: '#A64F00',
  },
  dark: {
    background: '#111018',
    surface: '#1A1724',
    surfaceRaised: '#221E2E',
    surfaceCard: '#1F1B2A',
    border: '#332D42',
    textPrimary: '#FFFFFF',
    textSecondary: '#C8C4DA',
    textMuted: '#9B95B5',
    textDisabled: '#6B6480',
    shadow: '#000000',
    scrim: '#00000099',
    danger: '#FF5252',
    success: '#66D17A',
    info: '#64B5F6',
    warning: BrandCore.orange,
  },
} as const satisfies Record<ResolvedThemeMode, AppThemeColors>;

export const Gradients = {
  hero:         ['#3D1DB5', ThemePalettes.dark.background] as const,
  purpleOrange: [BrandCore.purple, BrandCore.orange] as const,
  button:       [BrandCore.purple, BrandCore.pink, BrandCore.orange] as const,
  cardBorder:   [BrandCore.purple, BrandCore.pink] as const,
  orangePink:   [BrandCore.orange, BrandCore.pink] as const,
} as const;

export const AccentPalettes = {
  purple: {
    label: 'Violet',
    main: '#7C3AED',
    accent: '#B91C5C',
    warm: '#C65300',
    textAccent: '#A78BFA',
    gradient: ['#7C3AED', '#B91C5C', '#C65300'] as const,
  },
  ocean: {
    label: 'Ocean',
    main: '#007D8A',
    accent: '#007A68',
    warm: '#5B21B6',
    textAccent: '#77E5DC',
    gradient: ['#007D8A', '#007A68', '#5B21B6'] as const,
  },
  rose: {
    label: 'Rose',
    main: '#CC1F66',
    accent: '#C65300',
    warm: '#6D28D9',
    textAccent: '#FF9ABD',
    gradient: ['#CC1F66', '#C65300', '#6D28D9'] as const,
  },
  ember: {
    label: 'Cobalt',
    main: '#2563EB',
    accent: '#0F766E',
    warm: '#5B21B6',
    textAccent: '#93C5FD',
    gradient: ['#2563EB', '#0F766E', '#5B21B6'] as const,
  },
} as const;

export type AccentKey = keyof typeof AccentPalettes;
export interface AccentPalette {
  readonly label: string;
  readonly main: string;
  readonly accent: string;
  readonly warm: string;
  readonly textAccent: string;
  readonly gradient: readonly [string, string, string];
}

const AccentTextByMode = {
  light: {
    purple: '#6530C9',
    ocean: '#006C75',
    rose: '#B01858',
    ember: '#1D4ED8',
  },
  dark: {
    purple: AccentPalettes.purple.textAccent,
    ocean: AccentPalettes.ocean.textAccent,
    rose: AccentPalettes.rose.textAccent,
    ember: AccentPalettes.ember.textAccent,
  },
} as const satisfies Record<ResolvedThemeMode, Record<AccentKey, string>>;

export type ResolvedAccentPalette = AccentPalette;

export function getAccentPalette(
  accentKey: AccentKey,
  mode: ResolvedThemeMode,
): ResolvedAccentPalette {
  return {
    ...AccentPalettes[accentKey],
    textAccent: AccentTextByMode[mode][accentKey],
  };
}

export const BadgeTonePalettes = {
  light: {
    neutral: { text: '#514B60', background: '#E9E6EE' },
    upcoming: { text: '#4C1D95', background: '#EDE9FE' },
    completed: { text: '#9D174D', background: '#FCE7F3' },
    cancelled: { text: '#514B60', background: '#E9E6EE' },
    skipped: { text: '#8A3D00', background: '#FFF0DE' },
    missed: { text: '#A61B1B', background: '#FDE8E8' },
  },
  dark: {
    neutral: { text: '#C8C4DA', background: '#221E2E' },
    upcoming: { text: '#C4B5FD', background: '#332B63' },
    completed: { text: '#FF9ABD', background: '#5A243D' },
    cancelled: { text: '#D6D2E8', background: '#343041' },
    skipped: { text: '#FFB86B', background: '#4A2F1F' },
    missed: { text: '#FCA5A5', background: '#4A252A' },
  },
} as const;

export type BadgeTone = keyof typeof BadgeTonePalettes.dark;
export type ResolvedBadgeTones = Record<BadgeTone, { text: string; background: string }>;

export function getBadgeTones(mode: ResolvedThemeMode): ResolvedBadgeTones {
  return BadgeTonePalettes[mode];
}

/** @deprecated Dark-only compatibility export. Use getBadgeTones(mode). */
export const BadgeTones = BadgeTonePalettes.dark;

export const Radius = {
  xs:   2,   // accent lines, tiny indicators
  sm:   6,   // chips, segment items
  md:   8,   // icon backgrounds, small boxes, picker fields
  lg:   12,  // buttons, searchbars, modals
  card: 16,  // section cards, info cards
  item: 20,  // list item cards
  hero: 24,  // hero sections, large containers
  full: 999, // pills, badges, circles
} as const;

// Floating tab bar: 72px height + 8px bottom padding = 80px total
export const Layout = {
  TAB_BAR_HEIGHT: 80,
  FAB_BOTTOM: 96,         // above tab bar (80px) + 16px gap
  LIST_PAD_WITH_FAB: 160, // clears FAB (56px) + gap + tab bar
  LIST_PAD_NO_FAB: 96,    // clears tab bar + buffer, no FAB
  INPUT_HEIGHT: 48,       // dense MD3 outlined TextInput height
} as const;

export const Spacing = {
  xs:      4,
  sm:      8,
  md:      12,
  lg:      16,
  xl:      20,
  xxl:     24,
  section: 32,
} as const;

export const Typography = {
  heroNum:  { fontFamily: 'Poppins_700Bold',        fontSize: 52, lineHeight: 62 },
  h1:       { fontFamily: 'Poppins_700Bold',        fontSize: 24, lineHeight: 32 },
  h2:       { fontFamily: 'Montserrat_600SemiBold', fontSize: 18, lineHeight: 26 },
  h3:       { fontFamily: 'Montserrat_600SemiBold', fontSize: 16, lineHeight: 22 },
  h4:       { fontFamily: 'Montserrat_600SemiBold', fontSize: 15, lineHeight: 22 },
  bodyLg:   { fontFamily: 'Outfit_400Regular',      fontSize: 16, lineHeight: 24 },
  body:     { fontFamily: 'Outfit_400Regular',      fontSize: 14, lineHeight: 20 },
  bodySm:   { fontFamily: 'Outfit_400Regular',      fontSize: 13, lineHeight: 19 },
  labelMd:  { fontFamily: 'Montserrat_600SemiBold', fontSize: 13, lineHeight: 18 },
  labelSm:  { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 17, letterSpacing: 0.2 },
  labelLg:    { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, lineHeight: 20 },
  microLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11, lineHeight: 15 },
  caption:  { fontFamily: 'Outfit_400Regular',      fontSize: 12, lineHeight: 17 },
} as const;
