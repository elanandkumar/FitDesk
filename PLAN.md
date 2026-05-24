# FitDesk — Architecture & Implementation Plan

## 1. Project Context

**App Name:** FitDesk

Single-trainer personal app. Freelance fitness instructor managing:
- **Manager-sourced classes**: Zumba/Yoga/Dance Fitness assigned by external managers → trainer gets paid per class
- **Personal training**: Trainer's own clients (gym/dance/etc.) → monthly session packages

Local-only. No backend. No auth for MVP. Android only.

---

## 2. Confirmed Tech Stack

| Layer | Package |
|---|---|
| Framework | Expo managed (SDK 51+) |
| Language | TypeScript (strict) |
| UI | React Native Paper |
| Storage | expo-sqlite |
| Notifications | expo-notifications (local only) |
| Navigation | React Navigation v6 + bottom tabs |
| Theme | Paper PaperProvider theme config |
| Calendar | react-native-calendars |
| File I/O | expo-file-system + expo-sharing |

---

## 3. Data Schema (SQLite)

### `class_types`
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
name        TEXT NOT NULL UNIQUE          -- Zumba, Yoga, Dance Fitness, custom
color       TEXT NOT NULL DEFAULT '#6200ee'
created_at  TEXT NOT NULL
```

### `managers`
```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
name            TEXT NOT NULL
phone           TEXT
email           TEXT
per_class_rate  REAL NOT NULL DEFAULT 0
currency        TEXT NOT NULL DEFAULT 'INR'
notes           TEXT
created_at      TEXT NOT NULL
```

### `trainees`
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
name        TEXT NOT NULL
phone       TEXT
email       TEXT
notes       TEXT
created_at  TEXT NOT NULL
```

### `class_series` — recurring class definition
```sql
id                  INTEGER PRIMARY KEY AUTOINCREMENT
title               TEXT NOT NULL
class_type_id       INTEGER NOT NULL REFERENCES class_types(id)
source_type         TEXT NOT NULL CHECK(source_type IN ('manager','personal'))
manager_id          INTEGER REFERENCES managers(id)   -- null if personal
recurrence_type     TEXT NOT NULL CHECK(recurrence_type IN ('daily','weekly','custom'))
recurrence_days     TEXT                              -- JSON array: [0,1,3] (0=Sun)
start_date          TEXT NOT NULL                     -- ISO date YYYY-MM-DD
end_date            TEXT                              -- null = ongoing
class_time          TEXT NOT NULL                     -- HH:MM 24h
duration_minutes    INTEGER NOT NULL DEFAULT 60
location_type       TEXT NOT NULL CHECK(location_type IN ('offline','online'))
location            TEXT                              -- address or meeting link
notes               TEXT
is_active           INTEGER NOT NULL DEFAULT 1
created_at          TEXT NOT NULL
```

### `class_sessions` — individual occurrences
```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
series_id       INTEGER NOT NULL REFERENCES class_series(id)
session_date    TEXT NOT NULL               -- ISO date YYYY-MM-DD
class_time      TEXT NOT NULL               -- can differ from series (override)
status          TEXT NOT NULL DEFAULT 'upcoming'
                  CHECK(status IN ('upcoming','completed','cancelled','skipped'))
student_count   INTEGER DEFAULT 0
notes           TEXT
created_at      TEXT NOT NULL
```

### `session_trainees` — personal training attendees
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
session_id  INTEGER NOT NULL REFERENCES class_sessions(id)
trainee_id  INTEGER NOT NULL REFERENCES trainees(id)
UNIQUE(session_id, trainee_id)
```

### `manager_payments` — per-class payment tracking
```sql
id          INTEGER PRIMARY KEY AUTOINCREMENT
session_id  INTEGER NOT NULL REFERENCES class_sessions(id)
manager_id  INTEGER NOT NULL REFERENCES managers(id)
amount      REAL NOT NULL
status      TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid'))
paid_date   TEXT                            -- ISO date, null if pending
notes       TEXT
created_at  TEXT NOT NULL
```

### `trainee_packages` — monthly packages
```sql
id              INTEGER PRIMARY KEY AUTOINCREMENT
trainee_id      INTEGER NOT NULL REFERENCES trainees(id)
month           TEXT NOT NULL               -- YYYY-MM
total_sessions  INTEGER NOT NULL DEFAULT 12
used_sessions   INTEGER NOT NULL DEFAULT 0
amount          REAL NOT NULL
status          TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid'))
paid_date       TEXT
notes           TEXT
created_at      TEXT NOT NULL
UNIQUE(trainee_id, month)
```

### `settings`
```sql
key    TEXT PRIMARY KEY
value  TEXT NOT NULL
```

Default settings keys:
- `theme` → `light` | `dark`
- `notification_enabled` → `true` | `false`
- `notification_minutes_before` → `60`

---

## 4. Screen Map

### Bottom Tab Navigation
```
[Dashboard] [Calendar] [People] [Payments] [Settings]
```

### Screen Hierarchy

```
Dashboard
  └─ SessionDetailScreen (tap any session)

Calendar
  └─ DaySessionsSheet (tap date → bottom sheet with sessions)
  └─ SessionDetailScreen

People (top tab: Managers | Trainees)
  ├─ Managers
  │   ├─ ManagerListScreen
  │   ├─ ManagerDetailScreen (classes history, outstanding balance)
  │   └─ AddEditManagerScreen
  └─ Trainees
      ├─ TraineeListScreen
      ├─ TraineeDetailScreen (packages, session history)
      └─ AddEditTraineeScreen

Payments (top tab: Managers | Trainees)
  ├─ ManagerPaymentsScreen (filter by manager, mark paid)
  └─ TraineePackagesScreen (monthly packages, mark paid)

Settings
  ├─ ThemeToggle (light/dark)
  ├─ NotificationSettings (enable, minutes before)
  ├─ ClassTypesScreen (add/edit/delete)
  └─ DataScreen (export JSON, import JSON)

--- Stack screens (no tab, pushed) ---
ClassSeriesListScreen        (accessible from Dashboard FAB or Calendar)
AddEditClassSeriesScreen
ClassSessionDetailScreen     (mark complete, student count, skip, notes)
IncomeSummaryScreen          (monthly income report)
```

---

## 5. Folder Structure

```
FitClassManagementApp/
├── app.json
├── App.tsx
├── tsconfig.json
├── src/
│   ├── navigation/
│   │   ├── AppNavigator.tsx        -- root stack
│   │   ├── TabNavigator.tsx        -- bottom tabs
│   │   ├── PeopleNavigator.tsx     -- top tab: managers/trainees
│   │   ├── PaymentsNavigator.tsx   -- top tab: manager/trainee payments
│   │   └── types.ts                -- RootStackParamList etc.
│   ├── database/
│   │   ├── db.ts                   -- expo-sqlite init, singleton
│   │   ├── schema.ts               -- CREATE TABLE statements
│   │   ├── migrations.ts           -- versioned migrations
│   │   └── repositories/
│   │       ├── classTypeRepository.ts
│   │       ├── managerRepository.ts
│   │       ├── traineeRepository.ts
│   │       ├── classSeriesRepository.ts
│   │       ├── classSessionRepository.ts
│   │       └── paymentRepository.ts
│   ├── theme/
│   │   ├── lightTheme.ts
│   │   ├── darkTheme.ts
│   │   └── index.ts                -- ThemeContext + useAppTheme hook
│   ├── notifications/
│   │   ├── scheduler.ts            -- schedule/cancel local notifications
│   │   └── permissions.ts
│   ├── utils/
│   │   ├── dateUtils.ts            -- recurring date generation
│   │   ├── exportUtils.ts          -- JSON export/import
│   │   └── currencyUtils.ts
│   ├── hooks/
│   │   ├── useDatabase.ts
│   │   └── useSettings.ts
│   ├── types/
│   │   └── index.ts                -- shared TS interfaces
│   ├── constants/
│   │   └── index.ts                -- default values, currencies
│   ├── components/
│   │   ├── common/
│   │   │   ├── EmptyState.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   └── LoadingOverlay.tsx
│   │   ├── sessions/
│   │   │   ├── SessionCard.tsx
│   │   │   └── SessionListItem.tsx
│   │   ├── payments/
│   │   │   ├── PaymentStatusChip.tsx
│   │   │   └── OutstandingBanner.tsx
│   │   └── classes/
│   │       └── ClassTypeChip.tsx
│   └── screens/
│       ├── Dashboard/
│       │   └── DashboardScreen.tsx
│       ├── Calendar/
│       │   └── CalendarScreen.tsx
│       ├── Managers/
│       │   ├── ManagerListScreen.tsx
│       │   ├── ManagerDetailScreen.tsx
│       │   └── AddEditManagerScreen.tsx
│       ├── Trainees/
│       │   ├── TraineeListScreen.tsx
│       │   ├── TraineeDetailScreen.tsx
│       │   └── AddEditTraineeScreen.tsx
│       ├── Classes/
│       │   ├── ClassSeriesListScreen.tsx
│       │   ├── AddEditClassSeriesScreen.tsx
│       │   └── ClassSessionDetailScreen.tsx
│       ├── Payments/
│       │   ├── ManagerPaymentsScreen.tsx
│       │   └── TraineePackagesScreen.tsx
│       ├── Reports/
│       │   └── IncomeSummaryScreen.tsx
│       └── Settings/
│           ├── SettingsScreen.tsx
│           ├── ClassTypesScreen.tsx
│           └── DataScreen.tsx
```

---

## 6. Key Technical Decisions

### Recurring Class Generation
- On series create/edit → generate sessions up to 90 days ahead
- Background job (on app open) → extend sessions for active series
- Skip single occurrence → set `status = 'skipped'` on that session only, series intact
- Cancel series → set `is_active = 0` on series

### Payment Flow — Manager
1. Session marked `completed` → auto-create `manager_payments` record (status=pending, amount=manager.per_class_rate)
2. Manager detail shows outstanding balance = SUM of pending payments
3. Trainer taps individual session payment → marks paid with date
4. No bulk-mark-all (by design — ensures individual verification)

### Payment Flow — Trainee
1. Package created per trainee per month (manual or auto on month start)
2. Session completed with trainee → increment `used_sessions` on active package
3. Package marked paid/pending independently

### Theme System
```ts
// ThemeContext provides theme + toggleTheme
// All screens consume useAppTheme()
// PaperProvider wraps app with active theme
// Persisted in settings table
```

### Export/Import
```json
{
  "version": 1,
  "exported_at": "2026-05-23T10:00:00Z",
  "class_types": [...],
  "managers": [...],
  "trainees": [...],
  "class_series": [...],
  "class_sessions": [...],
  "manager_payments": [...],
  "trainee_packages": [...],
  "settings": [...]
}
```
Import = full replace after confirmation dialog.

---

## 7. Development Phases

### Phase 1 — Foundation ✅
- [x] Expo project init, TypeScript config
- [x] SQLite setup, schema, migrations
- [x] Theme system (light/dark)
- [x] Bottom tab navigation skeleton
- [x] Settings screen (theme toggle)

### Phase 2 — Core Data ✅
- [x] Class Types CRUD
- [x] Managers CRUD
- [x] Trainees CRUD
- [x] Class Series CRUD + recurring session generation

### Phase 3 — Daily Use Screens ✅
- [x] Dashboard (next 7 days list)
- [x] Calendar screen
- [x] Session detail (mark complete, student count, skip)

### Phase 4 — Payments ✅
- [x] Manager payments screen (outstanding, mark paid)
- [x] Trainee packages screen

### Phase 5 — Notifications + Reports ✅
- [x] Local notification scheduling
- [x] Notification settings
- [x] Income summary screen

### Phase 6 — Data Safety ✅
- [x] Export JSON
- [x] Import JSON

### Phase 7 — Polish & UX ✅
- [x] Fix: add UNIQUE(series_id, session_date) index + INSERT OR IGNORE in createSessionsBatch
- [x] Date/time pickers in AddEditClassSeriesScreen (native DateTimePicker)
- [x] TraineeDetailScreen: show packages list + session history
- [x] ManagerDetailScreen: show payment history list (pending + paid)
- [x] Search/filter on Manager, Trainee, ClassSeries list screens
- [x] Fix: TraineePackages FAB color inconsistency (missing theme primary color)

### Phase 8 — Onboarding, Help & App Polish ✅

#### Onboarding ✅
- [x] OnboardingScreen — 3-slide paginated screen with dot indicators + Skip/Next/Get Started
- [x] Persist onboarding complete flag via `settings` table (`key='onboarding_done', value='true'`)
- [x] AppNavigator shows OnboardingScreen before tabs if flag not set

#### Per-screen Help ✅
- [x] HelpSheet component — Portal modal, reusable, screen-specific content
- [x] Help button (❓ icon) in header of all major screens:
  - Dashboard, Calendar, Settings (via useLayoutEffect/setOptions)
  - ClassSeriesListScreen, ClassSessionDetailScreen, IncomeSummaryScreen (stack screens)
  - ManagerDetailScreen, TraineeDetailScreen (with existing Edit button in row)
  - ManagerListScreen, TraineeListScreen, ManagerPaymentsScreen, TraineePackagesScreen (via getParent + useFocusEffect)

#### Other Polish ✅
- [x] Throttle `extendActiveSeriesSessions` — skips re-run if already ran today (`last_session_extend_date` in settings)
- [x] ErrorBoundary component wrapping app root
- [x] Help icon color — `iconColor={theme.colors.primary}` on all 12 help `IconButton`s (was gray/unthemed)
- [x] Calendar dark mode — wrapped `<Calendar>` in `<View style={{backgroundColor: theme.colors.surface}}>` to fix white background
- [x] Accent color picker — 5 colors (Purple/Teal/Blue/Orange/Pink) in Settings > Appearance; each has light+dark palette; persisted as `accent_color` in settings table; `ThemeContext` rebuilds theme on change via `buildTheme(isDark, accentKey)` in `src/theme/accentColors.ts`
- [x] Remove unused `expo-document-picker` dependency (P2 — do when cleaning package.json)

### Phase 9 — Deployment Readiness

#### 🔴 P0 — Crash / build blockers ✅
- [x] Fix: `expo-notifications` crashes in Expo Go on Android SDK 53+
- [x] Fix: FK constraint crashes on delete — `deleteManager`, `deleteTrainee` cascade in transaction; `deleteClassType` blocks with user-facing error if series reference it
- [x] Fix: Session "Mark Complete" now transactional — `completeManagerSession` / `completePersonalSession` in classSessionRepository wrap all DB ops in `withTransactionAsync`
- [x] `app.json`: added `android.package: com.fitdesk.app`
- [x] `app.json`: added `expo-notifications` to plugins array

#### 🟡 P1 — Broken behavior / store risk ✅
- [x] `app.json`: `userInterfaceStyle` → `"automatic"`
- [x] `app.json`: added `splash` section
- [x] `app.json`: added `android.versionCode: 1`
- [x] `app.json`: removed `ios` section
- [x] Created `eas.json` with preview (APK) and production (AAB) profiles

#### 🟢 P2 — Pre-release polish
- [x] Remove `expo-document-picker` from `package.json` — unused, bloats APK
- [x] Add try/catch error handling in all screen async operations (currently silent failures)

### Future Scope (not in MVP)
- Phone OTP auth
- Multi-trainer / invite system
- Online live classes
- Attendance tracking by name
- In-app chat

---

## 8. Assumptions & Constraints
- Android only (no iOS)
- No internet required
- No backend, no auth for MVP
- Single user (trainer) = no data isolation needed
- INR default currency (configurable in settings)
- Date format: DD MMM YYYY display, ISO internally
- Time format: 12h display, 24h stored
