# FitDesk — Claude Context

## What This App Is
Single-trainer personal fitness class management app. Local-only, Android, no backend.

Two class source types:
- **Manager-sourced**: External managers assign Zumba/Yoga/Dance classes → trainer paid per class
- **Personal training**: Trainer's own clients → monthly session packages

See `PLAN.md` for full architecture, data schema, screen map, folder structure.

---

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | Expo managed SDK 51+ |
| Language | TypeScript strict |
| UI | React Native Paper |
| Storage | expo-sqlite |
| Notifications | expo-notifications (local only) |
| Navigation | React Navigation v6 + bottom tabs |
| Calendar | react-native-calendars |
| File I/O | expo-file-system + expo-sharing |

---

## Core Architecture Rules

### Database
- Single SQLite DB via `src/database/db.ts` (singleton)
- All DB access through repository pattern in `src/database/repositories/`
- Schema versioned via `src/database/migrations.ts`
- Never raw SQL in screens/components

### Theme
- `src/theme/` exports `ThemeContext` and `useAppTheme()` hook
- All screens use `useAppTheme()`, never hardcode colors
- `PaperProvider` at root wraps with active theme
- Theme persisted in `settings` table (key=`theme`, value=`light`|`dark`)

### Navigation
- Bottom tabs: Dashboard | Calendar | People | Payments | Settings
- `src/navigation/types.ts` holds all param list types
- Never use `navigation.navigate` with untyped strings

### Recurring Classes
- Series creates sessions 90 days ahead on save
- On app open → extend sessions for active series
- Skip one occurrence: set `status='skipped'` on session only, never delete series
- Cancel series: set `is_active=0` on series

### Payment Logic
- Manager payment auto-created when session marked `completed`
- Individual payment marking only — no bulk mark-all (trainer must verify each)
- Trainee packages: track `used_sessions` increment when session completed

---

## Key Types (src/types/index.ts)

```ts
type SourceType = 'manager' | 'personal'
type RecurrenceType = 'daily' | 'weekly' | 'custom'
type SessionStatus = 'upcoming' | 'completed' | 'cancelled' | 'skipped'
type PaymentStatus = 'pending' | 'paid'
type LocationType = 'offline' | 'online'
```

---

## Coding Conventions
- TypeScript strict, no `any`
- Functional components + hooks only
- Repository functions return typed objects, never raw DB rows
- Dates stored as ISO string (`YYYY-MM-DD`), displayed as `DD MMM YYYY`
- Times stored as 24h `HH:MM`, displayed as 12h
- Currency default INR, stored as REAL, displayed with `currencyUtils`
- No inline styles — use Paper's `StyleSheet` or themed styles

---

## What NOT To Do
- No backend calls, no network requests
- No auth screens in MVP
- No iOS-specific code
- No `console.log` in committed code — use proper error handling
- Don't generate sessions beyond 90 days ahead
- Don't bulk-mark manager payments paid

---

## Dev Phases (current priority order)
1. Foundation: Expo init, SQLite, theme, navigation skeleton
2. Core data: Class Types, Managers, Trainees, Class Series + session generation
3. Daily use: Dashboard, Calendar, Session detail
4. Payments: Manager payments, Trainee packages
5. Notifications + Reports
6. Export/Import

---

## Future Scope (not now)
- Phone OTP auth
- Multi-trainer invite system
- Online live classes
- Attendance by name (currently count only)
- In-app chat
