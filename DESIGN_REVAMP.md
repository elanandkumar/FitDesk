# FitDesk — Design Revamp Plan

## Decisions

| Feature | Decision | Reason |
|---|---|---|
| Dark/Light toggle | **REMOVE** | Brand has no light palette. Dark-only. |
| Accent color picker | **REMOVE** | Brand colors are semantic, not preference. |
| Theme system | Simplify to single static dark theme | No toggle = no runtime state needed |
| Icon library | Keep MaterialCommunityIcons for nav, add Phosphor for new UI elements | Avoid 15-file churn |

---

## Brand Tokens (source of truth)

```ts
// src/theme/brandColors.ts  ← new file

export const Brand = {
  // Backgrounds
  backgroundDark:  '#1B102F',   // screen bg
  surfaceDark:     '#241640',   // card/surface
  surfaceElevated: '#2E1D50',   // modals, elevated cards
  borderSubtle:    '#33254F',   // dividers, input borders

  // Brand palette
  purple:          '#5B2EFF',   // primary identity, active states, CTA
  orange:          '#FF7A00',   // earnings, revenue, primary FAB/CTA action
  pink:            '#FF3D81',   // completed status, alerts, energy accent

  // Text
  textPrimary:     '#FFFFFF',
  textSecondary:   '#B8B3C7',
  textMuted:       '#6B6480',

  // Status semantics
  statusUpcoming:  '#5B2EFF',   // purple
  statusCompleted: '#FF3D81',   // pink
  statusCancelled: '#6B6480',   // muted
  statusSkipped:   '#FF7A00',   // orange dim
} as const;

// Gradient definitions
export const Gradients = {
  hero:         ['#3D1DB5', '#1B102F'] as const,   // diagonal, dashboard hero
  purpleOrange: ['#5B2EFF', '#FF7A00'] as const,   // button CTAs
  cardBorder:   ['#5B2EFF', '#FF3D81'] as const,   // card accent borders
  orangePink:   ['#FF7A00', '#FF3D81'] as const,   // earnings highlight
} as const;
```

---

## Typography

Three fonts from brand kit:

| Font | Weight | Use |
|---|---|---|
| Poppins | Bold (700) | Screen titles, hero numbers, big stats |
| Montserrat | SemiBold (600) | Section headers, card titles, tab labels |
| Outfit | Regular (400) | Body text, labels, metadata, descriptions |

Install:
```bash
npx expo install expo-font @expo-google-fonts/poppins @expo-google-fonts/montserrat @expo-google-fonts/outfit
```

Font loading in `App.tsx` via `useFonts()` hook. Hold splash until loaded.

---

## Packages to Add

```bash
npx expo install expo-linear-gradient
npx expo install expo-blur
npx expo install react-native-reanimated
npx expo install moti
npx expo install phosphor-react-native
npx expo install @expo-google-fonts/poppins @expo-google-fonts/montserrat @expo-google-fonts/outfit
```

`react-native-reanimated` requires plugin in `babel.config.js`:
```js
plugins: ['react-native-reanimated/plugin']
```
Clear Metro cache after: `npx expo start --clear`

---

## Files to Delete

```
src/theme/lightTheme.ts         ← no light mode
src/theme/darkTheme.ts          ← replaced by brandColors.ts + new theme
src/theme/accentColors.ts       ← no accent picker
```

---

## Files to Rewrite

### `src/theme/index.tsx`
Before: `buildTheme(isDark, accentKey)` with toggle state, DB read for theme/accent  
After: Single static `FitDeskTheme` object built from `Brand` tokens. `ThemeProvider` just wraps `PaperProvider` — no state, no DB reads.

```ts
// Shape stays same so useAppTheme() callers don't break
// Remove: isDark, accentKey, toggleTheme, setAccentColor from context
// Keep: theme object (Paper-compatible)
// Add: expose Brand tokens directly for LinearGradient etc.
```

### `src/screens/Settings/SettingsScreen.tsx`
Remove: Theme toggle row, Accent color picker section  
Add: App version info card, branded grouped card layout

### `PLAN.md`
Update Phase 7/8 completed items — accent color picker removed from feature list.

---

## Component Design Specs

### Session Cards (currently flat TouchableOpacity)
```
Background:  Brand.surfaceDark (#241640)
Border:      1px Brand.borderSubtle, borderRadius 20
Left accent: 4px wide colored bar (class type color) — KEEP existing
Shadow:      elevation 4, shadowColor Brand.purple 30% opacity
Spacing:     paddingVertical 14, paddingHorizontal 12
Separator:   none (cards float, gap 8 between them)
```

### Dashboard Hero Card
```
Component:  LinearGradient (Gradients.hero diagonal)
Height:     ~160px
Content:    
  - "Good morning 👋" (Outfit Regular, textSecondary)
  - Today's class count (Poppins Bold 48px, textPrimary)
  - Subtitle: "classes today" (Montserrat SemiBold, textSecondary)
  - Right side: Week total + earnings pill (orange accent)
BorderRadius: 24
Margin: 16
```

### FAB
```
Primary FAB:   Brand.orange (#FF7A00) — action color
Secondary FAB: Brand.purple gradient
BorderRadius:  16 (pill-ish)
Icon:          Phosphor icon
Reanimated:    scale press animation (0.95 on press)
```

### Bottom Tab Bar (floating dock)
```
Custom tabBar component (tabBar prop in Tab.Navigator)
Background:    Brand.surfaceDark with expo-blur BlurView overlay
BorderRadius:  24 (top only, or fully floating with margin bottom 16)
Active:        Purple pill indicator behind icon + label
                OR purple glow dot under icon
Inactive:      Brand.textMuted icons
Height:        72px
Shadow:        elevation 8
```

### Status Badges
```
upcoming:   bg Brand.purple 20% opacity, text Brand.purple
completed:  bg Brand.pink 20% opacity,   text Brand.pink
cancelled:  bg Brand.textMuted 15% opacity, text Brand.textMuted
skipped:    bg Brand.orange 20% opacity,  text Brand.orange
```

### Input Fields
```
Background:  Brand.surfaceDark
Border:      1px Brand.borderSubtle, focus → Brand.purple
BorderRadius: 12
LabelColor:  Brand.textSecondary
Filled variant (Paper TextInput mode="flat" customized)
```

### Buttons
```
Primary CTA:
  LinearGradient (Gradients.purpleOrange)
  BorderRadius: 12
  Text: Poppins SemiBold white
  Press: Reanimated scale 0.97

Secondary:
  Border 1px Brand.purple, transparent bg
  Text: Brand.purple
```

---

## Screen-by-Screen Revamp

### Dashboard
- [ ] Remove plain `summaryCard` view
- [ ] Add `HeroCard` component (LinearGradient, today count, week earnings)
- [ ] Add "Quick actions" row (3 icon buttons: Add Session, View Calendar, Reports)
- [ ] Sessions list: floating cards (gap 8, no dividers)
- [ ] Section headers: Montserrat SemiBold, orange accent line left
- [ ] Moti fade-in on list items (staggered 50ms per item)

### Calendar
- [ ] Calendar header: brand purple selected date
- [ ] Session dots: brand colors by class type
- [ ] Day sessions bottom sheet: floating card style

### Session Detail
- [ ] Hero section with class type color gradient strip
- [ ] Action buttons: gradient primary CTA
- [ ] Stats row (student count etc.) in floating card

### Manager / Trainee Lists
- [ ] List items → elevated cards (not flat rows)
- [ ] Avatar circle: initials on brand.surfaceElevated
- [ ] Outstanding balance badge: orange pill

### Payments Screens
- [ ] Earnings numbers: Poppins Bold, orange color
- [ ] Pending: subtle orange bg pill
- [ ] Paid: pink pill with checkmark

### Add/Edit Forms (ClassSeries, Manager, Trainee, Package)
- [ ] Section grouping with Montserrat SemiBold headers
- [ ] Inputs: filled, rounded, animated focus
- [ ] Sticky bottom CTA (gradient button, safe area aware)
- [ ] Cards per section (not flat list)

### Settings
- [ ] Remove: Theme toggle, Accent color picker
- [ ] Grouped card layout (Notifications card, Data card, About card)
- [ ] Section headers: Montserrat SemiBold + brand.textSecondary
- [ ] Toggle switches: purple accent
- [ ] App version/logo at bottom

### Onboarding
- [ ] Slide backgrounds: LinearGradient variants
- [ ] Brand logo on slide 1
- [ ] Animated dot indicators (Moti)
- [ ] "Get Started" button: gradient CTA

---

## Animation Inventory

| Element | Library | Animation |
|---|---|---|
| Screen entry | Moti | `from={{ opacity: 0, translateY: 10 }}` |
| List items | Moti | Staggered fade-in (50ms delay per index) |
| FAB | Reanimated | Scale 0.95 on press |
| Button press | Reanimated | Scale 0.97 on press |
| Tab active indicator | Reanimated | Slide/scale pill |
| Status badge | Moti | Fade in on mount |
| Card press | Reanimated | Scale 0.98 |

Keep animations subtle. 200ms max duration. No bouncy spring on data-heavy lists.

---

## Implementation Phases

### Phase A — Theme foundation (do first, everything depends on this)
**Estimated: 1 session** ✅ COMPLETE
- [x] Create `src/theme/brandColors.ts` with all tokens + gradients
- [x] Rewrite `src/theme/index.tsx` — static theme, remove toggle/accent logic
- [x] Delete `lightTheme.ts`, `darkTheme.ts`, `accentColors.ts`
- [x] Update `app.json`: `userInterfaceStyle → "dark"`
- [x] Load Poppins + Montserrat + Outfit in `App.tsx`
- [x] Apply fonts to Paper theme
- [x] Fix `roundness: 3` (= ~24px border radius in Paper)
- [x] Remove theme/accent settings rows from `SettingsScreen`
- [x] Remove `theme` and `accent_color` from settings DB reads

> Checkpoint: App uses brand colors + Poppins everywhere. No features broken.

### Phase B — Dashboard hero + card polish
**Estimated: 1 session**
- [ ] Build `HeroCard` component (LinearGradient, today stats)
- [ ] Redesign session cards (floating, elevated, gap-separated)
- [ ] Redesign section headers (Montserrat + orange accent)
- [ ] Orange FAB for primary action
- [ ] Status badges with brand semantics

> Checkpoint: Dashboard looks premium.

### Phase C — Floating tab bar
**Estimated: 1 session**
- [ ] Write custom `FitDeskTabBar` component
- [ ] BlurView background + floating elevation
- [ ] Active pill indicator with Reanimated
- [ ] Phosphor icons for tab items

> Checkpoint: Nav feels modern.

### Phase D — Forms + lists polish
**Estimated: 1-2 sessions**
- [ ] Redesign all list screens (Manager, Trainee, ClassSeries, Payments)
- [ ] Redesign form screens (AddEdit flows, sticky CTA buttons)
- [ ] Redesign Settings screen (grouped cards, no toggle)
- [ ] Redesign Onboarding (gradient slides, brand logo)

> Checkpoint: Full app feels consistent.

### Phase E — Animations
**Estimated: 1 session**
- [ ] Screen entry fade-ins (Moti)
- [ ] List item stagger (Moti)
- [ ] Press scale animations (Reanimated) on buttons/cards
- [ ] Tab indicator animation

> Checkpoint: App feels alive.

---

## Settings DB Migration

Remove `theme` and `accent_color` from settings table reads.
No migration needed — keys can stay in DB, just never read/written.
Settings screen no longer shows those options.

---

## What Does NOT Change

- All repository functions
- All navigation structure and types
- All business logic (session generation, payments, etc.)
- SQLite schema
- Date/currency utilities
- Export/import logic
- Notification scheduling

---

## Files Touched Summary

```
MODIFY:
  src/theme/index.tsx              ← strip to static dark theme
  src/screens/Settings/SettingsScreen.tsx  ← remove toggle/accent UI
  src/navigation/TabNavigator.tsx  ← swap for custom FitDeskTabBar
  src/screens/Dashboard/DashboardScreen.tsx
  src/components/common/StatusBadge.tsx
  App.tsx                          ← font loading

CREATE:
  src/theme/brandColors.ts
  src/components/navigation/FitDeskTabBar.tsx
  src/components/common/HeroCard.tsx
  src/components/common/GradientButton.tsx

DELETE:
  src/theme/lightTheme.ts
  src/theme/darkTheme.ts
  src/theme/accentColors.ts
```

Total files: ~15 modified, 4 created, 3 deleted. No business logic touched.
