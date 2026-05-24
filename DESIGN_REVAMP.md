# FitDesk — Design Revamp Plan

## Decisions

| Feature | Decision | Reason |
|---|---|---|
| Dark/Light toggle | **REMOVE** | Brand has no light palette. Dark-only. |
| Accent color picker | **REMOVE** | Brand colors are semantic, not preference. |
| Theme system | Simplify to single static dark theme | No toggle = no runtime state needed |
| Icon library | Keep MaterialCommunityIcons for nav, add Phosphor for tab bar | Avoid churn |
| Moti | **NOT used** — Reanimated 4 used directly | Moti version compat risk with Reanimated 4.x |

---

## Gradient Usage Policy

Gradients are **selective**, not universal. Overuse makes them lose impact.

| Element | Treatment |
|---|---|
| Primary form CTA | `GradientButton` (Gradients.purpleOrange) ✅ |
| FABs | Solid `Brand.orange` — distinct from buttons ✅ |
| Dashboard HeroCard | Gradient background (Gradients.hero) ✅ |
| Session Detail hero strip | Class type color or thin gradient strip |
| List cards | No gradient — solid `Brand.surfaceDark` ✅ |
| Status badges | Solid color at 20% opacity ✅ |
| Secondary actions | Solid `Brand.purple` or outline only |
| Income/earnings numbers | `Brand.orange` text color, no gradient |

---

## Brand Tokens (source of truth)

```ts
// src/theme/brandColors.ts

export const Brand = {
  backgroundDark:  '#1B102F',
  surfaceDark:     '#241640',
  surfaceElevated: '#2E1D50',
  borderSubtle:    '#33254F',
  purple:          '#5B2EFF',
  orange:          '#FF7A00',
  pink:            '#FF3D81',
  textPrimary:     '#FFFFFF',
  textSecondary:   '#B8B3C7',
  textMuted:       '#6B6480',
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

// Layout constants (floating tab bar clearance)
export const Layout = {
  TAB_BAR_HEIGHT: 80,
  FAB_BOTTOM: 96,           // FAB bottom: above tab bar + 16px gap
  LIST_PAD_WITH_FAB: 160,   // list paddingBottom: clears FAB + tab bar
  LIST_PAD_NO_FAB: 96,      // list paddingBottom: clears tab bar only
} as const;
```

---

## Typography

| Font | Weight | Use |
|---|---|---|
| Poppins | Bold (700) | Screen titles, hero numbers, big stats |
| Montserrat | SemiBold (600) | Section headers, card titles, tab labels |
| Outfit | Regular (400) | Body text, labels, metadata, descriptions |

---

## Component Design Specs

### Session / List Cards
```
Background:  Brand.surfaceDark
Border:      1px Brand.borderSubtle, borderRadius 20
Shadow:      elevation 4, shadowColor Brand.purple 15-30% opacity
Spacing:     paddingVertical 14, paddingHorizontal 14
Gap:         8px between cards, no dividers
Press:       activeOpacity 0.75 (cards) or Reanimated scale 0.96 (CTAs)
```

### Dashboard Hero Card
```
Component:   LinearGradient (Gradients.hero diagonal)
Height:      ~160px, borderRadius 24, margin 16
```

### FAB
```
Color:       Brand.orange (solid, not gradient)
BorderRadius: 16
Bottom:      Layout.FAB_BOTTOM (96px) on tab screens, 16px on stack-only screens
```

### Bottom Tab Bar
```
Custom FitDeskTabBar — BlurView bg, floating, borderRadius 24
Active indicator: filled Phosphor icon + Brand.purple label (pill indicator removed)
Height: 72px, paddingBottom: insets.bottom + 8
```

### GradientButton
```
Gradient:    Gradients.purpleOrange (left→right)
BorderRadius: 12, minHeight 52
Press scale: withSpring(0.96) via Reanimated
Use only for: primary form CTAs (sticky footer on add/edit screens)
```

### Input Fields
```
Background:  Brand.surfaceDark
Border:      1px Brand.borderSubtle, focus → Brand.purple
BorderRadius: 12
Label:       Brand.textSecondary
```

### Status Badges
```
upcoming:   bg Brand.purple 20%, text Brand.purple
completed:  bg Brand.pink 20%, text Brand.pink
cancelled:  bg Brand.textMuted 15%, text Brand.textMuted
skipped:    bg Brand.orange 20%, text Brand.orange
```

---

## Screen-by-Screen Status

### Dashboard ✅
- [x] HeroCard (LinearGradient, today count, week earnings)
- [x] Session cards — floating, elevated
- [x] Section headers — Montserrat + orange accent bar
- [x] Orange FAB — positioned above tab bar
- [x] Status badges
- [x] Screen entry FadeIn + list item stagger
- [x] Quick Actions row — Add Session, Calendar, Reports icon buttons below HeroCard

### Calendar ✅
- [x] Brand purple selected date highlight
- [x] Session dots: brand colors by class type (markingType multiDot)
- [x] Day session list: floating card style
- [x] FAB: Brand.orange, Layout.FAB_BOTTOM
- [x] List paddingBottom: `Layout.LIST_PAD_NO_FAB`

### Session Detail (`ClassSessionDetailScreen`) ✅
- [x] Hero section: class type color top strip
- [x] Action buttons: GradientButton (Mark Complete), outline (Skip)
- [x] Details + Notes in floating cards
- [x] Brand tokens throughout

### Manager / Trainee Lists ✅
- [x] Elevated cards, avatar circles, outstanding balance badge

### Manager Detail (`ManagerDetailScreen`) ✅
- [x] Brand tokens
- [x] Payment history list → floating cards
- [x] Earnings totals → Poppins Bold, Brand.orange
- [x] Section headers → Montserrat SemiBold
- [x] FAB → Brand.orange

### Trainee Detail (`TraineeDetailScreen`) ✅
- [x] Brand tokens
- [x] Package cards → floating card style, amounts Brand.orange
- [x] Session history → floating cards
- [x] FAB → Brand.orange

### Payments Screens ✅ (Phase D)
- [x] Earnings numbers — orange, Poppins Bold
- [x] Paid badge — pink pill
- [x] Pending badge — orange pill
- [x] FAB and list padding fixed for tab bar

### Add/Edit Forms ✅ (Phase D)
- [x] AddEditManager, AddEditTrainee, AddPackage — sectioned cards + GradientButton CTA

### AddEditClassSeries ✅
- [x] Brand tokens
- [x] Sectioned card layout matching other add/edit screens
- [x] GradientButton sticky footer CTA
- [x] Recurrence day selector → Brand.purple active chips

### AddSession (`Calendar/AddSessionScreen`) ✅
- [x] Brand tokens
- [x] Sectioned card layout
- [x] GradientButton CTA

### Settings ✅ (Phase D)
- [x] Grouped card layout, no toggle/accent picker

### ClassTypes Screen (`Settings/ClassTypesScreen`) ✅
- [x] Brand tokens
- [x] List items → floating card style
- [x] Color dot preview → class type color

### Data Screen (`Settings/DataScreen`) ✅
- [x] Brand tokens
- [x] Export → GradientButton, Import → outlined Brand.pink

### Income Summary (`Reports/IncomeSummaryScreen`) ✅
- [x] Brand tokens
- [x] Month cards → floating card style
- [x] Income amounts → Poppins Bold, Brand.orange
- [x] Summary bar → Brand.surfaceElevated

### Income Month Detail (`Reports/IncomeMonthDetailScreen`) ✅
- [x] Brand tokens
- [x] Item rows → floating cards
- [x] Income amounts → Brand.orange (Poppins Bold)
- [x] Total earnings summary card → Brand.orange highlight

### Onboarding ✅ (Phase D)
- [x] Gradient slides, brand logo, GradientButton CTA

---

## Animation Inventory

| Element | Library | Status |
|---|---|---|
| Screen entry FadeIn | Reanimated 4 | ✅ Dashboard, Managers, Trainees, ClassSeriesList |
| List item stagger FadeInDown | Reanimated 4 | ✅ same screens |
| GradientButton press scale | Reanimated 4 | ✅ |
| Tab item press scale | Reanimated 4 | ✅ FitDeskTabBar |
| Tab active pill | **removed** — icon fill + color change only | ✅ |
| Session Detail actions | GradientButton (Reanimated spring) | ✅ |
| Calendar day tap | not planned | — |

---

## Implementation Phases

### Phase A — Theme foundation ✅ COMPLETE
- [x] `brandColors.ts` tokens + gradients + Layout constants
- [x] Static dark theme, remove toggle/accent logic
- [x] Delete light/dark/accent theme files
- [x] Poppins + Montserrat + Outfit fonts in App.tsx
- [x] Remove theme/accent DB reads

### Phase B — Dashboard hero + card polish ✅ COMPLETE
- [x] HeroCard component (LinearGradient)
- [x] Floating session cards
- [x] Section headers (Montserrat + orange accent)
- [x] Orange FAB
- [x] StatusBadge component

### Phase C — Floating tab bar ✅ COMPLETE
- [x] FitDeskTabBar with BlurView + Reanimated
- [x] Phosphor icons
- [x] Active pill indicator (later removed — icon fill/color sufficient)

### Phase D — Forms + lists polish ✅ COMPLETE
- [x] Manager, Trainee, ClassSeries list screens
- [x] ManagerPayments, TraineePackages screens
- [x] AddEditManager, AddEditTrainee, AddPackage forms
- [x] SettingsScreen grouped cards
- [x] OnboardingScreen gradient slides

### Phase E — Animations ✅ COMPLETE
- [x] Screen entry FadeIn (Dashboard, Managers, Trainees, ClassSeriesList)
- [x] List item FadeInDown stagger (index * 60ms, cap at 8)
- [x] GradientButton press scale withSpring(0.96)
- [x] Tab pill removed — active state = fill icon + purple color

### Phase F — Remaining screens ✅ COMPLETE

**F1 — Dashboard Quick Actions + Calendar**
- [x] Dashboard: Quick Actions row below HeroCard (Add Session, Calendar, Reports icon buttons)
- [x] CalendarScreen: brand purple theme, multiDot session markers, floating day list cards
- [x] CalendarScreen: list padding for floating tab bar

**F2 — Session + Detail screens**
- [x] ClassSessionDetailScreen: hero strip, GradientButton actions, floating stats card
- [x] ManagerDetailScreen: Brand tokens, payment history cards, orange earnings
- [x] TraineeDetailScreen: Brand tokens, package cards, session history cards

**F3 — Secondary screens**
- [x] AddEditClassSeriesScreen: Brand tokens, sectioned card layout, GradientButton CTA
- [x] AddSessionScreen: Brand tokens, sectioned layout, GradientButton CTA
- [x] ClassTypesScreen: Brand tokens, floating card list, color dot preview
- [x] DataScreen: Brand tokens, GradientButton or outlined buttons
- [x] IncomeSummaryScreen: Brand tokens, floating month cards, orange income numbers
- [x] IncomeMonthDetailScreen: Brand tokens, floating session rows, earnings summary

---

## Known Issues Fixed

| Issue | Fix |
|---|---|
| FAB behind floating tab bar | `Layout.FAB_BOTTOM = 96` on all tab-visible screens |
| List content cut off by tab bar | `Layout.LIST_PAD_WITH_FAB = 160` / `LIST_PAD_NO_FAB = 96` |
| Horizontal pill line on active tab | Removed — active = filled icon + Brand.purple color |

---

## What Does NOT Change

- All repository functions
- All navigation structure and types
- All business logic (session generation, payments, etc.)
- SQLite schema
- Date/currency/formatting utilities
- Export/import logic
- Notification scheduling
