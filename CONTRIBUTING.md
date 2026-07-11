# Contributing to FitDesk

Thanks for your interest in contributing!

## Getting Started

1. Fork the repo
2. Clone your fork: `git clone https://github.com/<your-username>/FitDesk.git`
3. Install dependencies: `npm install`
4. Start the dev server: `npm run start`
5. Run on Android: `npm run android`

## Development Setup

- Node 18+
- Expo CLI through the local project scripts or `npx expo`
- Android Studio or a physical Android device for testing

## Making Changes

1. Create a branch: `git checkout -b feat/your-feature` or `fix/your-bug`
2. Make your changes
3. Test on Android (iOS not supported)
4. Commit with a clear message
5. Push and open a PR against `main`

## Code Style

- TypeScript strict — no `any`
- Functional components + hooks only
- Prefer shared components and React Native `StyleSheet` over one-off inline styles
- No `console.log` in committed code
- Dates stored as `YYYY-MM-DD`, displayed as `DD MMM YYYY`
- Times stored as 24h `HH:MM`, displayed as 12h

## Theme and UI

- Use `useAppTheme()` for app theme, accent palette, and accent-aware UI state
- Add new accent colors in `src/theme/brandColors.ts` through `AccentPalettes`
- Persist user-facing settings with `INSERT OR REPLACE INTO settings`
- Keep shared controls accent-aware instead of hard-coding `Brand.purple`
- Use Phosphor icons only, through `src/components/common/AppIcon.tsx` or `src/components/common/AppIconButton.tsx`; do not import `@expo/vector-icons`, `MaterialCommunityIcons`, or React Native Paper `IconButton`
- Add new icon names to the shared `AppIcon` map instead of importing icon components inside screens
- Use `accentPalette.main` for selected states, focused controls, and filled accent actions; use `accentPalette.textAccent` for accent text/icons on dark surfaces
- Use `accentPalette.gradient` only for intentionally prominent actions such as the main FAB or primary completion CTA
- Keep passive cards, panels, bottom nav containers, and list rows free of accent shadows; use neutral surfaces, borders, and shadows so accent color does not look randomly applied
- Keep semantic colors stable: orange for warnings and backup/overdue notices, `#FF5252`/danger styling for destructive actions, and accent colors for user-selected identity or navigation state

## Database Changes

- All schema changes go through `src/database/migrations.ts`
- All DB access through repository pattern in `src/database/repositories/`
- Never raw SQL in screens or components
- Export/import code must preserve full SQLite database backups and validate imported tables before restore
- Completing a session must stay blocked for future-dated class times in both UI and repository logic

## PR Guidelines

- One feature or fix per PR
- Keep PRs focused and small
- Describe what changed and why in the PR body
- Reference any related issues

## Reporting Bugs

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Android version and device

## Questions

Open a GitHub Discussion or issue with the `question` label.
