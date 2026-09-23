# Solo Class HQ 1.5.0 Play Store and Branding Plan

## Goal

Rename FitDesk to Solo Class HQ and refresh the public Play Store presentation
for 1.5.0 so the in-app identity, screenshots, preview video, feature graphic,
terminology, and release text form one consistent brand before the production
update is published.

Play Store listing:
https://play.google.com/store/apps/details?id=com.elanandkumar.fitdesk

## Current state

- The live listing shows FitDesk 1.4.0.
- The approved Solo Class HQ calendar-S identity and rename are implemented and
  installed-build verification is complete.
- Six phone screenshots, a feature graphic, and a seven-second YouTube preview
  video are live.
- The approved 1.5.0 preview video was uploaded to YouTube as
  `https://youtu.be/nrov5kK3_mI`; the Play Store listing still needs to be
  updated to use this URL.
- The current Play Store screenshots still show the older listing; the
  approved 1.5.0 replacements are now in `assets/store/phone-screenshots/`.
- Dashboard, Calendar, Class Details, and Payments visibly show the older card,
  badge, navigation, and layout treatments.
- The preview video shows only the older Payments layout.
- The feature graphic remains functionally accurate, but its UI mockups use the
  older visual treatment.
- The store description uses "manager" terminology where the app now uses
  "organizer."
- The live What's New text still describes the first production release.
- An Android emulator was available as `emulator-5554`, and
  `com.elanandkumar.fitdesk` was installed when this plan was written.

## Locked brand direction

- **Display name:** Solo Class HQ
- **Tagline:** Teach. Track. Earn.
- **Short description:** Classes, clients and payments for independent fitness
  instructors.
- **Positioning:** A focused business companion for independent fitness
  instructors who manage their own classes, clients, attendance, and payments.
- **Naming convention:** Write the product name as `Solo Class HQ` in customer-
  facing copy.
- **Web presence:** Do not register a separate Solo Class HQ domain or create
  product-specific social handles. Update the existing FitDesk page on
  `apps.elanandkumar.com` for Solo Class HQ, retaining the existing `/fitdesk`
  path where needed for compatibility and established links.
- **Android application ID:** Keep `com.elanandkumar.fitdesk`; changing the
  visible brand does not require changing the installed app's package ID.
- **Transition wording:** Use "Solo Class HQ, formerly FitDesk" temporarily in
  the Play Store description and release communication so existing users
  recognize the update.

The exact-name web, app, and YouTube collision screen did not identify a
relevant competing product. Complete an official Indian trademark search before
paying for registration, printing materials, or treating the identity as
legally cleared. A separate domain and product-specific social handles are out
of scope.

## Decisions to confirm when resuming

- [x] Confirm that all names, locations, dates, and payment amounts in the
  emulator are fictional and suitable for public marketing assets.
- [x] Decide whether to export the emulator's existing FitDesk data before it is
  reset. The owner confirmed on 2026-09-20 that no export was required.
- [x] Confirm the recommended six-screen ordering below. Approved with the
  final assets on 2026-09-21.
- [x] Confirm a 10–15 second landscape preview video using the previous
  preview's soundtrack. The owner confirmed the soundtrack and proceeded with
  the upload.
- [x] Decide whether the YouTube upload will be done manually or through an
  explicitly authorized signed-in browser session. The owner uploaded it
  manually on 2026-09-23.
- [x] Confirm that Play Console Managed Publishing is enabled before submission.
  The owner enabled it on 2026-09-23.

## Deliverables

### 0. Brand identity and application rename

Implementation status:

- [x] Approve the Solo Class HQ calendar-S identity, wordmark direction,
  palette, typography, and usage guidance.
- [x] Save the approved production icon master and transparent adaptive,
  monochrome, and notification variants under
  `assets/brand/solo-class-hq/`.
- [x] Export the launcher, round launcher, adaptive foreground, themed icon,
  notification icon, favicon, onboarding logo, and light/dark asset variants.
- [x] Replace the native and in-app splash artwork with the approved purple
  calendar-S tile, a shared padded source, matching violet backgrounds, and a
  200 px visual container.
- [x] Preserve real PNG transparency so launcher/settings icons do not acquire
  an unintended white background.
- [x] Replace the temporary text treatment with the designed Solo Class
  wordmark and orange HQ completion capsule used by onboarding and Settings.
- [x] Make Solo Violet the brand-aligned default while retaining the existing
  `purple` preference key, and finalize Ocean, Rose, Cobalt, and Graphite as
  the other distinct user-selectable accents.
- [x] Update customer-visible in-app naming, onboarding/help/privacy copy,
  backup/export filenames, notification labels, Expo configuration, Android
  label/colors, repository documentation, and 1.5.0 release notes.
- [x] Retain `com.elanandkumar.fitdesk` and other required legacy identifiers
  as compatibility decisions.
- [x] Validate TypeScript, Android resources, SVG sources, PNG alpha channels,
  and whitespace/diff integrity.
- [x] Install the final rebuilt APK and visually verify the latest launcher,
  Android Settings, native splash, in-app splash, redesigned wordmark,
  notification, themed-icon, and five-accent rendering on the target emulator.
- [ ] Update the Play Store listing and the existing FitDesk page on
  `apps.elanandkumar.com`; these remain later publishing tasks.

Create a compact brand system before composing any new Play Store assets:

- A primary Solo Class HQ wordmark.
- A simple app-icon mark that remains recognizable at launcher and notification
  sizes; do not place the full three-word name inside the icon.
- Light, dark, monochrome, and small-size logo/icon variants.
- A defined color palette with accessible foreground/background pairings.
- A typography hierarchy for store graphics, video captions, and supporting
  brand material.
- Basic spacing, clear-space, minimum-size, and incorrect-use guidance.
- Editable source files plus production PNG exports at all required sizes.

The identity should feel focused, independent, and operational rather than like
a large gym chain. It may evolve the current purple/pink/orange palette to
preserve continuity, but the final palette and icon must be approved before
screenshots, the feature graphic, or the video are produced.

Update and verify every user-visible brand surface, including:

- Android launcher label, adaptive icon, splash screen, and notification icon.
- In-app header, onboarding, About/help text, dialogs, empty states, and any
  visible FitDesk references.
- Backup/export filenames, shared text, generated documents, and notification
  channel labels where the old name may appear.
- Expo/app configuration, repository metadata, documentation, and asset paths
  where changing the visible product name is appropriate.
- Play Store title, short description, full description, screenshots, feature
  graphic, preview video, release notes, and alt text.
- The existing FitDesk page on `apps.elanandkumar.com`, plus its privacy policy,
  support/contact content, store support details, and other public documentation
  that identifies the product as FitDesk.

Do not rename the Android package ID, repository directory, Git history, or
existing technical identifiers merely for visual consistency. Record any
retained `fitdesk` identifiers as intentional compatibility decisions.

### 1. Phone screenshots

Create six final 1440 x 2560 portrait PNG files:

1. `01-dashboard.png`
   - Caption: "Your sessions, all in one view"
   - Show the refreshed dashboard and current session-card design.
2. `02-income-summary.png`
   - Caption: "Understand your income at a glance"
   - Show the new period selector, paid/pending totals, and monthly chart.
3. `03-calendar.png`
   - Caption: "Plan every class with clarity"
   - Show the updated selected-date styling and current session rows.
4. `04-payments.png`
   - Caption: "Track paid and pending payments"
   - Show the new Sessions/Paid/Pending organizer layout and filter summary.
5. `05-class-details.png`
   - Caption: "Every session detail, right where you need it"
   - Show the flatter hero, color-dot class label, and updated detail sections.
6. `06-data-privacy.png`
   - Caption: "Your data stays on your device"
   - Retain or recapture depending on whether the screen has visibly changed.

Requirements:

- Use the approved Solo Class HQ promotional style and logo treatment.
- Capture real current app UI rather than reconstructing screen contents.
- Use only fictional demo data.
- Remove transient notifications and incomplete status-bar indicators.
- Keep captions concise and readable at thumbnail size.
- Export 24-bit PNG without transparency.
- Verify the final files visually at full size and at phone-preview size.
- Replace the corresponding files under
  `assets/store/phone-screenshots/` only after approval.

### 2. Preview video

Create an updated 10–15 second landscape MP4:

- Open with the Solo Class HQ brand and "Teach. Track. Earn."
- Show actual app footage within the first few seconds.
- Feature Income Summary, Payments, and Calendar.
- Use short captions so the video works while muted.
- Keep at least 80% of the presentation representative of the actual app.
- Avoid calls to action such as "Download now."
- Avoid copyrighted music; silence or original/licensed audio is acceptable.
- Export a clean high-quality MP4 and retain the source/editing assets.
- Generate and inspect frames from the beginning, middle, and end before
  approval.

Suggested sequence:

1. Brand/title frame.
2. Income Summary chart and period selection.
3. Payments overview and filter interaction.
4. Calendar/session view.
5. Short Solo Class HQ closing frame.

After approval:

- Upload the video to YouTube as Public or Unlisted.
- Disable monetization/ads.
- Ensure the video is not age restricted and is embeddable.
- Replace the current preview-video URL in Play Console.

### 3. Feature graphic

Create an updated `1024 x 500` 24-bit PNG without transparency:

- Use the approved Solo Class HQ palette and iconography, retaining selected
  FitDesk colors only if they remain part of the approved transition identity.
- Retain the core promise of managing fitness classes and payments offline.
- Replace the old rounded/accent-rail mockups with the current flatter session
  and income-summary visual language.
- Keep the primary content away from crop-sensitive edges.
- Ensure the composition works with a Play button overlaid in the center.
- Avoid small UI details that will disappear at store-card size.
- Avoid time-sensitive copy and promotional claims.

Target file:

- `assets/feature_graphics.png`

Keep the existing graphic available until the replacement is approved.

### 4. Store text

- Change the Play Store title to `Solo Class HQ`.
- Set the short description to:
  `Classes, clients and payments for independent fitness instructors.`
- Incorporate `Teach. Track. Earn.` as supporting campaign copy, not as a
  replacement for the functional short description.
- Add "formerly FitDesk" to the opening portion of the full description for a
  limited transition period, then remove it after existing users have had a
  reasonable opportunity to recognize the rename.
- Replace "manager" and "manager session" terminology with "organizer" and
  "organizer session" where applicable.
- Review the short and full descriptions against the current feature set.
- Add accurate alt text for every new screenshot and the feature graphic.
- Replace the Play Store What's New text with a concise 1.5.0 summary.

Suggested What's New text:

```text
FitDesk is now Solo Class HQ: Teach. Track. Earn. This update also redesigns
income reporting and makes payments, trainee packages, class workflows,
navigation, and forms clearer and more consistent.
```

## Execution workflow

### Branding prerequisite

- [ ] Complete the official Indian trademark search for the app name. Intentionally
  skipped by the owner on 2026-09-19.
- [x] Approve the wordmark, icon, palette, typography, and usage guidance.
- [x] Update all in-app brand surfaces while retaining the existing package ID.
- [ ] Install the renamed build and search the visible UI for stale FitDesk
  references.
- [ ] Confirm existing upgrades, local data, backups, and notifications still
  work after the display-name and asset changes.
- [x] Freeze the approved identity before producing screenshots or video.

### Phase 0: Reset and seed safe demo data

Phase 0 tooling and seeding were completed on 2026-09-20: the deterministic
fixture, fixture validator, emulator-only preview/reset script, debug-only
import entry point, and reproduction guide are in the repository. The owner
declined a backup and approved clearing `com.elanandkumar.fitdesk` on
`emulator-5554`. Two reset/import runs produced identical record counts, and
the owner approved all six seeded target screens. The installed debug build
contains the 1.5.0 code while release metadata remains at 1.4.0 intentionally
until the later release workflow. The six Play Store marketing images are now
captured, composed, exported, and validated as approval candidates. The three
app flows for the preview video were recorded on 2026-09-21. A landscape
preview-video and feature-graphic approval candidates were exported. The owner
approved all assets on 2026-09-21, and the approved files were promoted to the
repository's release asset paths. The public Play Store listing is unchanged.

Reset only the FitDesk installation on the confirmed Android emulator. Do not
clear a physical device, repository data, or production user data.

Prefer a repository-owned deterministic seeding tool over manual entry. Before
implementing it, inspect FitDesk's existing export/import format and database
repositories, then choose the least invasive approach. The preferred design is:

- A version-controlled fictional fixture containing all demo records.
- A script such as `scripts/prepare-store-demo.sh` that requires an explicit
  emulator serial and refuses physical devices.
- Reuse of the app's normal import/restore format where practical, so the seed
  exercises supported data paths instead of maintaining a second database
  schema implementation.
- Idempotent behavior: every run resets the target emulator to the same dataset
  without duplicating records.
- A preview or validation mode that prints the target serial, package, record
  counts, and date range before destructive work.
- An explicit confirmation flag for clearing app data; never infer the target
  from the first connected device.
- Clear failure if more than one device is connected, the serial is not an
  emulator, the package does not match, or the fixture fails validation.
- Documentation describing the exact command and expected resulting screens.

Proposed command shape:

```bash
scripts/prepare-store-demo.sh \
  --serial emulator-5554 \
  --reset \
  --fixture scripts/fixtures/store-demo-v1.5.0.json
```

If importing a fixture cannot be automated reliably, create a development-only
seed entry point that is excluded from production builds. Directly editing the
SQLite database should be the last choice because it can drift from application
validation and migration behavior.

Safety procedure:

- [x] Confirm the target serial is the intended emulator, such as
  `emulator-5554`.
- [x] Confirm the package is `com.elanandkumar.fitdesk` on that emulator.
- [x] Offer to export the emulator's existing Solo Class HQ/FitDesk data before
  clearing it.
- [x] Clear only that package's application data after explicit confirmation.
- [ ] Launch the current 1.5.0 build and complete onboarding with neutral demo
  settings.
- [x] Keep the seeded dataset local to the emulator.

Create a deterministic fictional dataset containing:

- Clearly fictional organizers, trainees, studios, centers, and locations.
- No real phone numbers, email addresses, personal notes, or identifying data.
- Recurring and one-off classes with readable, non-overlapping titles.
- Upcoming, completed, and skipped sessions across useful dates.
- Several months of income history so the monthly chart is meaningful.
- A balanced mix of paid and pending organizer payments and trainee packages.
- Realistic but non-sensitive rupee amounts that remain legible in cards and
  charts.
- Controlled payment reminders and notification counts.
- Dates aligned with the capture month while avoiding stale or confusing
  content.

Dataset quality checks:

- [x] Every planned screenshot has enough content without looking crowded.
- [x] Income Summary contains multiple months and a visually useful comparison.
- [x] Payments demonstrates Sessions, Paid, and Pending values clearly.
- [x] Calendar contains enough differently colored sessions to explain its
  value.
- [x] Class Details contains complete but non-sensitive sample information.
- [x] No text is clipped, duplicated, or likely to be mistaken for a real person
  or business.
- [x] Document the seed values or automate the seed so assets can be reproduced
  consistently later.
- [x] Run the seeding tool twice and verify that the resulting record counts and
  screenshots are identical.

### Phase A: Prepare the app

- [x] Confirm the emulator/device is connected.
- [x] Install the current pre-release build carrying the Solo Class HQ identity;
  defer the 1.5.0 metadata/version-code bump to the release workflow.
- [x] Verify dark theme and the intended accent color.
- [x] Review the seeded fictional demo data on every target screen.
- [x] Set deterministic dates, names, amounts, and notification counts.
- [x] Disable distracting system notifications.
- [x] Verify every target screen looks correct before capture.

### Phase B: Capture and compose screenshots

- [x] Capture raw screenshots from the running app.
- [x] Review raw captures for clipping, keyboard visibility, transient UI, and
  personal information.
- [x] Compose the six Play Store marketing images.
- [x] Review typography, alignment, crop safety, and consistency as a set.
- [x] Export approval-candidate PNG files and compare them with the live
  listing assets.

Raw captures were completed and visually reviewed on 2026-09-20 at the
emulator's native `1344 x 2992` resolution. They are stored under
`assets/store/raw-phone-screenshots/v1.5.0/`. System status indicators were
hidden for a clean, consistent source set; no keyboard, transient overlay, or
non-demo personal information is visible. The data-privacy source uses the
current in-app Privacy Policy summary rather than the older onboarding panel.

The six branded compositions were completed and reviewed as a set on
2026-09-21. The approved files are directly under
`assets/store/phone-screenshots/`; their approval candidates remain under
`assets/store/phone-screenshots/v1.5.0-candidates/`. Regenerate the candidates
with:

```bash
scripts/compose-store-screenshots.py
```

### Phase C: Produce video and feature graphic

- [x] Record the approved app flows from the emulator.
- [x] Edit the 10–15 second preview video.
- [x] Create the updated feature graphic.
- [x] Review both at full size and at small Play Store preview size.
- [x] Obtain final approval before replacing repository assets. The owner
  approved the six screenshots, preview video, and feature graphic on
  2026-09-21.

Raw, unapproved emulator footage is under
`assets/store/raw-preview-video/v1.5.0/`: Income Summary changes from This
Month to This Year and reveals the monthly chart; Payments opens the filter
sheet and selects Pending only; Calendar changes from the 24 September Zumba
session to the 25 September Yoga session. Sampled frames confirm the actual
1.5.0 app UI and fictional demo data. These silent portrait H.264 clips are
`672 x 1496` because the emulator encoder could not record its native
`1344 x 2992` display. Their variable frame rates and short durations make
them edit sources, not a finished Play Store preview. Trim the Payments clip
before the lingering filter sheet, and review motion at full size in the
landscape edit. The existing live preview MP4 remains unchanged.

The approved 13.63-second `1920 x 1080` landscape video is
`assets/store/video/solo-class-hq-play-preview-v1.5.0.mp4`; its approval
candidate remains beside it.
It opens with the approved icon and campaign tagline, shows app footage by
0.8 seconds, then presents Income Summary, Payments, and Calendar with short
captions before a brief brand close. Actual app footage occupies about 89% of
the runtime. The editable composition script and generated frames are under
`scripts/compose-store-preview-video.py` and
`assets/store/video/source/v1.5.0/`. The candidate decoded cleanly end to end;
opening, middle, and closing frames were inspected at full size, and a small
preview contact sheet was checked on 2026-09-21. The owner approved it on
2026-09-21 and uploaded it manually on 2026-09-23 at
`https://youtu.be/nrov5kK3_mI`. Set this URL in the Play Console preview-video
field with the 1.5.0 listing update. The old YouTube video can remain available
while the current listing uses it.
The prior preview's stereo AAC soundtrack was reused with short start/end
fades after the owner requested it. The MP4 alone does not establish music
rights; the owner confirmed it was acceptable for this use before uploading.
Captions remain in place for muted autoplay.

The approved `1024 x 500` RGB feature graphic is
`assets/feature_graphics.png`; its approval candidate remains at
`assets/store/solo-class-hq-feature-graphic-v1.5.0-candidate.png`. It uses the
approved icon, typography, palette, and background, plus real 1.5.0 dashboard
and Income Summary crops. The editable composition script is
`scripts/compose-store-feature-graphic.py`. The graphic was inspected at full
size and at half-size preview on 2026-09-21; the central Play-button area does
not obscure the headline or app UI. The owner approved it on 2026-09-21.

### Phase D: Validate repository outputs

- [x] Confirm screenshot dimensions are 1440 x 2560.
- [x] Confirm feature graphic dimensions are 1024 x 500.
- [x] Confirm the screenshot PNG files have no alpha channel.
- [x] Confirm the preview-video candidate decodes cleanly from beginning to end.
- [x] Confirm no real personal data appears in the screenshot assets.
- [x] Run `npx tsc --noEmit` after producing the screenshot assets.
- [ ] Commit the approved asset and documentation changes without pushing unless
  explicitly requested.

### Phase E: Submit with the 1.5.0 release

- [x] Confirm the reused soundtrack, upload the approved preview as a new
  YouTube video, and record its URL: `https://youtu.be/nrov5kK3_mI`.
- [x] Turn on Managed Publishing in Play Console. Enabled by the owner on
  2026-09-23.
- [ ] Upload the 1.5.0 AAB.
- [ ] Update Graphics under Grow users > Store presence > Main store listing.
- [ ] Update screenshots, feature graphic, preview-video URL, descriptions, alt
  text, and What's New.
- [ ] Check Publishing overview for both production-release and store-listing
  changes.
- [ ] Submit all intended changes for review together.
- [ ] Avoid adding more changes while review is underway because doing so can
  restart the review timing.
- [ ] After approval, inspect the Ready to publish section and publish through
  Managed Publishing.
- [ ] Verify the public listing and installed production update after rollout.

## Release command

Once the repository and Play Store materials are ready:

```bash
npm run release -- \
  --version 1.5.0 \
  --version-code 9 \
  --update-version \
  --commit-version \
  --notes-file release-notes/v1.5.0.md \
  --github-release
```

The command publishes the GitHub release; it does not upload the AAB or listing
assets to Google Play. Existing unrelated untracked files must be handled first,
or `--allow-dirty` must be passed deliberately.

## Definition of done

- Solo Class HQ is used consistently across the installed app and public store
  listing, with no unintended visible FitDesk references.
- The approved wordmark, launcher icon, palette, typography, and reusable source
  assets are stored in the repository.
- The package ID remains `com.elanandkumar.fitdesk`, and an upgrade from the
  existing production app preserves local user data.
- The six screenshots accurately show the 1.5.0 interface.
- Income Summary is prominently represented.
- The preview video no longer shows the old Payments layout.
- The feature graphic reflects the current visual system.
- Store terminology consistently uses "organizer."
- What's New accurately describes 1.5.0.
- The AAB and listing changes are approved and published together.
- The public listing is checked after rollout.
