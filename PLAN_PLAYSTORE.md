# Plan: FitDesk — Play Store Release

## Status: Pre-submission

---

## What is Google Play Console?

Google Play Console is the developer portal at play.google.com/console where you:
- Upload your AAB (app bundle)
- Write store listing (name, description, screenshots)
- Set content ratings, target audience
- Manage releases (internal test → production)
- Monitor crashes, reviews, installs

One-time cost: **$25 USD** developer registration fee.

---

## Checklist

### 1. Google Play Console — One-time Setup
- [ ] Register at play.google.com/console ($25)
- [ ] Create app → Android → Free → "FitDesk"
- [ ] Set default language: English (US) or English (India)

---

### 2. Privacy Policy Page ✅ DONE
**Hosted at:** `app.elanandkumar.com/fitdesk/privacy`

Privacy policy live. Covers: no data collection, local SQLite storage, no third-party SDKs, local-only notifications, permissions (notifications + storage), children's clause, contact link.

---

### 3. Store Listing Content

**App name:** FitDesk

**Short description** (max 80 chars):
```
Manage fitness classes, payments & trainee packages — all offline.
```

**Full description** (max 4000 chars — draft):
```
FitDesk is a class management app built for freelance fitness trainers.

Whether you teach Zumba, Yoga, or personal training sessions, FitDesk
keeps your schedule, payments, and client packages organized — entirely
on your device, no internet required.

KEY FEATURES

Class Management
• Create recurring class series (daily / weekly / custom)
• Track individual sessions — mark complete, skip, or cancel
• Manage multiple class types with custom colors

Manager-Sourced Classes
• Track classes assigned by external managers (gyms, studios)
• Auto-calculate per-class earnings
• Per-manager payment tracking — mark individual sessions paid

Personal Training
• Link trainees to series and sessions
• Monthly session packages with used/total tracking
• Session numbering (e.g. Session 3 of 12)

Payments & Reports
• Monthly income summary with paid/pending breakdown
• Per-center earnings breakdown
• Trainee package payment status

Client Management
• Manager profiles with contact info and per-class rate
• Trainee profiles with package history and session logs
• Centers/locations management for venue-based earnings

Data Safety
• Full JSON export and import
• All data stays on your device — no cloud, no accounts

Built for the solo fitness professional who needs a simple,
reliable tool that works without internet.
```

---

### 4. Assets Needed

| Asset | Size | Status |
|---|---|---|
| App icon | 512×512 PNG | ✅ have 1024×1024 (Play auto-scales) |
| Feature graphic | 1024×500 PNG | ✅ done |
| Phone screenshots | Min 2, max 8 (16:9 or 9:16) | ✅ done (7 captured) |

**Feature graphic:** Banner shown at top of store listing. Dark background (#1B102F), app name + tagline. Can create in Canva or Figma.

**Screenshots:** Capture from running app or emulator. Suggested screens:
1. Dashboard (today's sessions)
2. Calendar view
3. Session detail / mark complete
4. Payments screen
5. Trainee detail with packages

---

### 5. Content Rating
In Play Console → Policy → App content → Content ratings:
- Answer questionnaire (no violence, no sexual content, no user data collection)
- Will get rated **Everyone** or **Everyone 3+**

---

### 6. Target Audience
- Age group: 18+
- Not directed at children → no COPPA/GDPR-K issues

---

### 7. Release Signing Config (REQUIRED before build)

Current `android/app/build.gradle` uses debug keystore for release — Play Store will reject this.

**Step 1 — Generate release keystore (once, keep it safe forever):**
```bash
keytool -genkey -v -keystore android/app/fitdesk-release.keystore \
  -alias fitdesk -keyalg RSA -keysize 2048 -validity 10000
```
> ⚠️ Store this file securely. Losing it = can never update app on Play Store.

**Step 2 — Add to `android/gradle.properties`:**
```properties
FITDESK_UPLOAD_STORE_FILE=fitdesk-release.keystore
FITDESK_UPLOAD_KEY_ALIAS=fitdesk
FITDESK_UPLOAD_STORE_PASSWORD=yourpassword
FITDESK_UPLOAD_KEY_PASSWORD=yourpassword
```

**Step 3 — Update `android/app/build.gradle`:**
```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        storeFile file(FITDESK_UPLOAD_STORE_FILE)
        keyAlias FITDESK_UPLOAD_KEY_ALIAS
        storePassword FITDESK_UPLOAD_STORE_PASSWORD
        keyPassword FITDESK_UPLOAD_KEY_PASSWORD
    }
}
buildTypes {
    release {
        signingConfig signingConfigs.release  // ← was signingConfigs.debug
        ...
    }
}
```

**Step 4 — Add to `.gitignore`:**
```
android/app/fitdesk-release.keystore
android/gradle.properties
```

---

### 8. Build & Upload

```bash
# Build production AAB (from android/ directory)
cd android && ./gradlew bundleRelease

# Output: android/app/build/outputs/bundle/release/app-release.aab
# Upload this file to Play Console
```

**Versioning:**
- Current: version `1.1.0`, versionCode `2`
- Each Play Store upload needs a higher `versionCode`

---

### 8. Release Strategy (Recommended)

1. **Internal Testing** → upload AAB, add yourself as tester, install via Play Store link
2. Test on real device via Play Store (not Expo Go)
3. **Closed Testing (Alpha)** → optional, add a few friends
4. **Production** → submit for review (usually 1–3 days for new apps)

---

### 9. Google Drive Backup (Post-launch, v1.2.0)

After initial publish, add Drive backup as an update:
- Add `@react-native-google-signin/google-signin`
- Google Cloud Console: enable Drive API, create OAuth client, add SHA-1
- Place `google-services.json` in `android/app/`
- Auto-backup on app open if last backup > 24h
- Uses `drive.appdata` scope (hidden folder, no Drive quota used, no store review needed)
- Update privacy policy page to mention optional Google account sign-in

---

## Open Items

- [x] Create privacy policy page on elanandkumar.com
- [x] Create feature graphic (1024×500)
- [x] Capture 5 screenshots (7 captured)
- [ ] Fix release signing config (generate keystore, update build.gradle, add to .gitignore)
- [ ] Register Google Play Console ($25)
- [ ] Run production build (`cd android && ./gradlew bundleRelease`)
- [ ] Submit for review
