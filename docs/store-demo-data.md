# Play Store demo data

The 1.5.0 Play Store assets use a deterministic, fictional dataset stored at
`scripts/fixtures/store-demo-v1.5.0.json`. It is a version 4 Solo Class HQ JSON
backup and is imported through the same transactional importer used by the Data
screen. The fixture contains no phone numbers, email addresses, or personal
notes. Every person, organizer, and center is explicitly marked `Demo`.

The fixture is anchored to **20 September 2026**. Keep the capture emulator on
that date while reproducing these assets; otherwise the Dashboard's relative
date labels and upcoming-session window will differ.

## Dataset summary

- 3 centers, 3 organizers, and 4 trainees
- 4 class types and 4 recurring class series
- 36 sessions from May through October 2026, including completed, upcoming,
  and skipped states
- 15 organizer payments with paid and pending balances
- 13 trainee packages spanning five months
- Dark theme, Solo Violet accent, completed onboarding, and notifications off

The fixture is designed to produce these screens:

- **Dashboard:** three sessions on 20 September and varied sessions through the
  following week.
- **Income Summary:** five months of organizer and trainee income with distinct
  paid and pending chart segments.
- **Calendar:** Yoga, Dance Fitness, Mobility, and Strength colors across the
  selected week and month.
- **Payments:** three organizer summaries plus a mix of paid and pending
  trainee packages. Select `All payments` when the screenshot should show both
  paid and pending organizer totals.
- **Class Details:** open Sunrise Yoga on 21 September for a complete upcoming
  organizer-session example.
- **Data & Privacy:** no fixture-specific interaction is required.

## Validate and preview

Install the current debug build and keep Metro running. Preview is the default
and never clears data:

```bash
scripts/prepare-store-demo.sh --serial emulator-5554
```

The command validates the JSON, requires exactly one connected Android device,
checks that the explicit serial is an emulator, and verifies that
`com.elanandkumar.fitdesk` is installed. It prints the package, record counts,
and fixture date range before exiting.

You can validate the fixture without any Android device:

```bash
node scripts/validate-store-demo.mjs \
  scripts/fixtures/store-demo-v1.5.0.json
```

## Reset and seed

Do not run the reset command until the owner confirms the target emulator and
decides whether its existing data should be exported. Export first from
Settings → Data when a backup is wanted.

After explicit approval, run:

```bash
scripts/prepare-store-demo.sh \
  --serial emulator-5554 \
  --reset \
  --confirm-clear-package-data
```

The reset path refuses physical devices, multiple connected devices, serial
mismatches, missing packages, non-debuggable builds, invalid fixtures, and a
missing confirmation flag. It clears only `com.elanandkumar.fitdesk`, copies the
fixture into that app's private cache with `run-as`, and launches a debug-only
deep link. Production builds do not expose that intent filter, and the importer
also exits immediately when `__DEV__` is false.

The script waits for an import-complete marker before reporting success. Run
the same reset command twice when checking idempotency: because each run clears
only the named package and imports fixed IDs, the record counts and resulting
screens must be identical.

## Post-import checks

1. Confirm onboarding is skipped and the Dashboard greets `Maya Demo`.
2. Confirm dark theme and Solo Violet are active.
3. Compare the Dashboard, Income Summary, Calendar, Payments, and Sunrise Yoga
   details with the expectations above.
4. Confirm no phone numbers, email addresses, personal notes, or non-demo names
   appear anywhere.
5. Do not enable notifications until the screenshot set has been captured.
