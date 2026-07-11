export const Brand = {
  // Backgrounds
  backgroundDark:  '#111018',
  surfaceDark:     '#1A1724',
  surfaceElevated: '#221E2E',
  surfaceCard:     '#1F1B2A',
  borderSubtle:    '#332D42',

  // Brand palette
  purple:          '#7B35FF',
  orange:          '#FF7A00',
  pink:            '#FF3D81',

  // Text
  textPrimary:     '#FFFFFF',
  textSecondary:   '#C8C4DA',
  textMuted:       '#9B95B5',
  textDisabled:    '#6B6480',
  textAccent:      '#A78BFA',

  // Status semantics
  statusUpcoming:  '#7B5FFF',
  statusCompleted: '#FF3D81',
  statusCancelled: '#9B95B5',
  statusSkipped:   '#FF7A00',
} as const;

export const Gradients = {
  hero:         ['#3D1DB5', Brand.backgroundDark] as const,
  purpleOrange: [Brand.purple, Brand.orange] as const,
  button:       [Brand.purple, Brand.pink, Brand.orange] as const,
  cardBorder:   [Brand.purple, Brand.pink] as const,
  orangePink:   ['#FF7A00', '#FF3D81'] as const,
} as const;

export const AccentPalettes = {
  purple: {
    label: 'Violet',
    main: '#7C3AED',
    accent: '#B91C5C',
    warm: '#C65300',
    textAccent: Brand.textAccent,
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
export type AccentPalette = (typeof AccentPalettes)[AccentKey];

export const BadgeTones = {
  neutral: {
    text: Brand.textSecondary,
    background: Brand.surfaceElevated,
  },
  upcoming: {
    text: '#C4B5FD',
    background: '#332B63',
  },
  completed: {
    text: '#FF9ABD',
    background: '#5A243D',
  },
  cancelled: {
    text: '#D6D2E8',
    background: '#343041',
  },
  skipped: {
    text: '#FFB86B',
    background: '#4A2F1F',
  },
  missed: {
    text: '#FCA5A5',
    background: '#4A252A',
  },
} as const;

export type BadgeTone = keyof typeof BadgeTones;

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
  bodySm:   { fontFamily: 'Outfit_400Regular',      fontSize: 12, lineHeight: 18 },
  labelMd:  { fontFamily: 'Montserrat_600SemiBold', fontSize: 13, lineHeight: 18 },
  labelSm:  { fontFamily: 'Montserrat_600SemiBold', fontSize: 12, lineHeight: 16, letterSpacing: 0.2 },
  labelLg:    { fontFamily: 'Montserrat_600SemiBold', fontSize: 14, lineHeight: 20 },
  microLabel: { fontFamily: 'Montserrat_600SemiBold', fontSize: 11, lineHeight: 14 },
  caption:  { fontFamily: 'Outfit_400Regular',      fontSize: 11, lineHeight: 16 },
} as const;

export const Elevation = {
  base:    Brand.backgroundDark,   // '#111018' — screen bg
  surface: Brand.surfaceDark,      // '#1A1724' — cards, list items
  raised:  Brand.surfaceElevated,  // '#221E2E' — modals, pickers, overlays
  card:    Brand.surfaceCard,      // '#1F1B2A' — info cards inside surface
} as const;
