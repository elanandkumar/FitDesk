# Contributing to FitDesk

Thanks for your interest in contributing!

## Getting Started

1. Fork the repo
2. Clone your fork: `git clone https://github.com/<your-username>/FitDesk.git`
3. Install dependencies: `npm install`
4. Start the dev server: `npx expo start`

## Development Setup

- Node 18+
- Expo CLI: `npm install -g expo-cli`
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
- No inline styles — use React Native Paper's `StyleSheet`
- No `console.log` in committed code
- Dates stored as `YYYY-MM-DD`, displayed as `DD MMM YYYY`
- Times stored as 24h `HH:MM`, displayed as 12h

## Database Changes

- All schema changes go through `src/database/migrations.ts`
- All DB access through repository pattern in `src/database/repositories/`
- Never raw SQL in screens or components

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
