# FitDesk Agent Notes

## Project Defaults

- Android-only Expo React Native app.
- TypeScript is strict; avoid `any`.
- Prefer existing shared components, theme helpers, and repository patterns over one-off screen logic.
- Run `npx tsc --noEmit` after code changes.

## Icons

- Use `phosphor-react-native` for all icons.
- Do not import `@expo/vector-icons`, `MaterialCommunityIcons`, or React Native Paper `IconButton`.
- Screens and components should use `src/components/common/AppIcon.tsx` and `src/components/common/AppIconButton.tsx`.
- When a new icon is needed, add a named entry to the shared `AppIcon` map instead of importing icon components directly in screens.

## Theme and Accent Consistency

- Use `useAppTheme()` for app theme, accent palette, and accent-aware UI state.
- Add or tune accent palettes only in `src/theme/brandColors.ts` through `AccentPalettes`.
- Use `accentPalette.main` for selected states, focused inputs, active navigation, and filled accent actions.
- Use `accentPalette.textAccent` for accent text and icons on dark surfaces.
- Use `accentPalette.gradient` only for intentionally prominent actions, such as the main FAB or primary completion CTA.
- Do not use accent-colored shadows on passive surfaces. Cards, panels, bottom nav containers, and list rows should use neutral surfaces, borders, and shadows.
- Keep semantic colors stable:
  - Orange for warnings, backup notices, and overdue-style notices.
  - `#FF5252` or the shared danger styling for destructive actions.
  - Accent colors for user-selected identity, navigation, focused controls, and primary app actions.

## UI Direction

- Keep the app visually quiet and operational: dense, readable, and consistent rather than decorative.
- Avoid nested cards and decorative gradients on passive content.
- Prefer reusable controls for buttons, icons, pickers, empty states, and navigation affordances.
- Before adding a new visual treatment, check whether it should be accent-driven, semantic, or neutral.
