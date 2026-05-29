export const Brand = {
  // Backgrounds
  backgroundDark:  '#1B102F',
  surfaceDark:     '#241640',
  surfaceElevated: '#2E1D50',
  surfaceCard:     '#24163D',
  borderSubtle:    '#33254F',

  // Brand palette
  purple:          '#7B35FF',
  orange:          '#FF7A00',
  pink:            '#FF3D81',

  // Text
  textPrimary:     '#FFFFFF',
  textSecondary:   '#C8C4DA',
  textMuted:       '#9B95B5',
  textDisabled:    '#6B6480',
  textAccent:      '#A78BFF',

  // Status semantics
  statusUpcoming:  '#7B5FFF',
  statusCompleted: '#FF3D81',
  statusCancelled: '#9B95B5',
  statusSkipped:   '#FF7A00',
} as const;

export const Gradients = {
  hero:         ['#3D1DB5', '#1B102F'] as const,
  purpleOrange: [Brand.purple, Brand.orange] as const,
  button:       [Brand.purple, Brand.pink, Brand.orange] as const,
  cardBorder:   [Brand.purple, Brand.pink] as const,
  orangePink:   ['#FF7A00', '#FF3D81'] as const,
} as const;

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
  base:    Brand.backgroundDark,   // '#1B102F' — screen bg
  surface: Brand.surfaceDark,      // '#241640' — cards, list items
  raised:  Brand.surfaceElevated,  // '#2E1D50' — modals, pickers, overlays
  card:    Brand.surfaceCard,      // '#24163D' — info cards inside surface
} as const;
