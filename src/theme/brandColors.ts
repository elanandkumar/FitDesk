export const Brand = {
  // Backgrounds
  backgroundDark:  '#1B102F',
  surfaceDark:     '#241640',
  surfaceElevated: '#2E1D50',
  borderSubtle:    '#33254F',

  // Brand palette
  purple:          '#5B2EFF',
  orange:          '#FF7A00',
  pink:            '#FF3D81',

  // Text
  textPrimary:     '#FFFFFF',
  textSecondary:   '#B8B3C7',
  textMuted:       '#6B6480',

  // Status semantics
  statusUpcoming:  '#5B2EFF',
  statusCompleted: '#FF3D81',
  statusCancelled: '#6B6480',
  statusSkipped:   '#FF7A00',
} as const;

export const Gradients = {
  hero:         ['#3D1DB5', '#1B102F'] as const,
  purpleOrange: ['#5B2EFF', '#FF7A00'] as const,
  cardBorder:   ['#5B2EFF', '#FF3D81'] as const,
  orangePink:   ['#FF7A00', '#FF3D81'] as const,
} as const;
