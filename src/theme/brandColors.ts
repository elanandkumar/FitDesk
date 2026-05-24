export const Brand = {
  // Backgrounds
  backgroundDark:  '#1B102F',
  surfaceDark:     '#241640',
  surfaceElevated: '#2E1D50',
  surfaceCard:     '#24163D',
  borderSubtle:    '#33254F',

  // Brand palette
  purple:          '#5B2EFF',
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
  purpleOrange: ['#5B2EFF', '#FF7A00'] as const,
  cardBorder:   ['#5B2EFF', '#FF3D81'] as const,
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
} as const;
