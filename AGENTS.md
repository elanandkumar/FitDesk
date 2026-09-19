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
- Treat elevation as an interaction or floating-layer signal, not as default card decoration.
- Passive cards, summary panels, grouped form sections, and containers whose only actions are nested buttons must be flat (`elevation: 0` with no shadow). Use a neutral surface, border, or tonal contrast for separation.
- A whole-card press target may use only slight, neutral elevation and must have a pressed state. It does not need an added chevron, icon, or action label when the existing interaction is clear.
- Do not infer that every clickable row needs elevation. Flat pressable rows are valid when their pressed state and surrounding context make the interaction clear.
- Reserve stronger elevation for genuinely floating or temporary layers such as FABs, menus, tooltips, modal sheets, and bottom navigation.
- When a shared card supports optional `onPress`, derive its elevation and pressed styling from whether `onPress` is present; do not expose styling flags that can make passive cards look interactive.
- Prefer reusable controls for buttons, icons, pickers, empty states, and navigation affordances.
- Use FitDesk shared modal/dialog components (`AppModal`, `ConfirmDialog`, or another app-styled wrapper) for user-facing alerts and confirmations; do not introduce native `Alert.alert` for new UI flows.
- Before adding a new visual treatment, check whether it should be accent-driven, semantic, or neutral.
