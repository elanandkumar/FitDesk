export interface ReleaseNote {
  version: string;
  title: string;
  changes: readonly string[];
}

export const RELEASE_NOTES: readonly ReleaseNote[] = [
  {
    version: '1.5.0',
    title: 'FitDesk is now Solo Class HQ',
    changes: [
      'Redesigned Income Summary with period filters, month comparisons, and an interactive paid-versus-pending chart.',
      'Improved organizer payments and trainee packages with clearer totals, sorting, filtering, and payment actions.',
      'Refined class and session workflows with consistent inputs, better recurrence controls, and cleaner handling when ending a series.',
      'Updated cards, navigation, calendar selections, and forms for a denser and more consistent experience.',
    ],
  },
  {
    version: '1.4.0',
    title: 'FitDesk 1.4.0',
    changes: [
      'add variable session pricing',
      'theme fix and scroll fix in income summary',
    ],
  },
  {
    version: '1.3.0',
    title: 'A smoother FitDesk release',
    changes: [
      'Added the About section and in-app release notes shown after updates.',
      'Improved onboarding, backup warnings, and Settings organization.',
      'Refined Payments, Contacts, class screens, charts, filters, and card readability.',
      'Replaced system alerts with app-styled dialogs and improved dashboard flows.',
    ],
  },
  {
    version: '1.2.3',
    title: 'A cleaner, more personal FitDesk',
    changes: [
      'Choose Light, Dark, or System appearance from Settings.',
      'Pick an accent color for buttons, tabs, and selected controls.',
      'Enjoy clearer Settings, Payments, Contacts, and class screens.',
    ],
  },
];

export function getReleaseNote(version: string | null): ReleaseNote | undefined {
  return RELEASE_NOTES.find((release) => release.version === version);
}
