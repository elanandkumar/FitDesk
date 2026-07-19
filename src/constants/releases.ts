export interface ReleaseNote {
  version: string;
  title: string;
  changes: readonly string[];
}

export const RELEASE_NOTES: readonly ReleaseNote[] = [
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
