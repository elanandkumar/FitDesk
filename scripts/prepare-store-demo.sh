#!/usr/bin/env bash

set -euo pipefail

PACKAGE="com.elanandkumar.fitdesk"
COMPONENT="${PACKAGE}/.MainActivity"
SEED_URL="soloclasshq-dev://seed-store-demo"
FIXTURE_BASENAME="store-demo-v1.5.0.json"
RESULT_BASENAME="store-demo-seeded.ok"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
FIXTURE="${SCRIPT_DIR}/fixtures/${FIXTURE_BASENAME}"
SERIAL=""
RESET=false
CONFIRM_CLEAR=false
ADB_BIN="${ADB:-adb}"
REMOTE_FIXTURE="/data/local/tmp/${FIXTURE_BASENAME}"

usage() {
  printf '%s\n' \
    'Usage: scripts/prepare-store-demo.sh --serial SERIAL [options]' \
    '' \
    'Preview is the default and does not modify the emulator.' \
    '' \
    'Options:' \
    '  --serial SERIAL                 Required explicit Android emulator serial.' \
    '  --fixture PATH                  Override the repository fixture.' \
    '  --reset                         Enable the destructive reset/import path.' \
    '  --confirm-clear-package-data    Confirm clearing the package named above.' \
    '  --help                          Show this help.'
}

# Prepare the deterministic Solo Class HQ Play Store demo dataset.
#
# Preview (default; does not modify the emulator):
#   scripts/prepare-store-demo.sh --serial emulator-5554
#
# Reset and import (clears only com.elanandkumar.fitdesk on the named emulator):
#   scripts/prepare-store-demo.sh \
#     --serial emulator-5554 \
#     --reset \
#     --confirm-clear-package-data
#
# Options:
#   --serial SERIAL                 Required explicit Android emulator serial.
#   --fixture PATH                  Override the repository fixture.
#   --reset                         Enable the destructive reset/import path.
#   --confirm-clear-package-data    Confirm clearing the package named above.
#   --help                          Show this help.

while [[ $# -gt 0 ]]; do
  case "$1" in
    --serial)
      [[ $# -ge 2 ]] || { echo "Missing value for --serial" >&2; exit 2; }
      SERIAL="$2"
      shift 2
      ;;
    --fixture)
      [[ $# -ge 2 ]] || { echo "Missing value for --fixture" >&2; exit 2; }
      FIXTURE="$2"
      shift 2
      ;;
    --reset)
      RESET=true
      shift
      ;;
    --confirm-clear-package-data)
      CONFIRM_CLEAR=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

[[ -n "$SERIAL" ]] || { echo "--serial is required; no device is selected implicitly." >&2; exit 2; }
[[ -f "$FIXTURE" ]] || { echo "Fixture not found: $FIXTURE" >&2; exit 2; }
command -v "$ADB_BIN" >/dev/null 2>&1 || { echo "adb not found: $ADB_BIN" >&2; exit 1; }
command -v node >/dev/null 2>&1 || { echo "node is required to validate the fixture." >&2; exit 1; }

cd "$REPO_DIR"
node scripts/validate-store-demo.mjs "$FIXTURE"

CONNECTED_SERIALS="$($ADB_BIN devices | awk 'NR > 1 && $2 == "device" { print $1 }')"
CONNECTED_COUNT="$(printf '%s\n' "$CONNECTED_SERIALS" | awk 'NF { count++ } END { print count + 0 }')"
if [[ "$CONNECTED_COUNT" -ne 1 ]]; then
  echo "Expected exactly one connected Android device; found ${CONNECTED_COUNT}." >&2
  [[ -n "$CONNECTED_SERIALS" ]] && printf 'Connected serials:\n%s\n' "$CONNECTED_SERIALS" >&2
  exit 1
fi
if [[ "$CONNECTED_SERIALS" != "$SERIAL" ]]; then
  echo "Connected device '$CONNECTED_SERIALS' does not match --serial '$SERIAL'." >&2
  exit 1
fi
if [[ "$SERIAL" != emulator-* ]]; then
  echo "Refusing non-emulator serial: $SERIAL" >&2
  exit 1
fi
if [[ "$($ADB_BIN -s "$SERIAL" shell getprop ro.kernel.qemu | tr -d '\r')" != "1" ]]; then
  echo "Refusing device that does not report ro.kernel.qemu=1: $SERIAL" >&2
  exit 1
fi
if ! $ADB_BIN -s "$SERIAL" shell pm path "$PACKAGE" | tr -d '\r' | grep -q '^package:'; then
  echo "Package is not installed on $SERIAL: $PACKAGE" >&2
  exit 1
fi

echo "Target serial: $SERIAL"
echo "Target package: $PACKAGE"
echo "Mode: $([[ "$RESET" == true ]] && echo reset-and-import || echo preview-only)"

if [[ "$RESET" != true ]]; then
  echo "Preview complete. No emulator data was changed."
  exit 0
fi
if [[ "$CONFIRM_CLEAR" != true ]]; then
  echo "Reset requested, but --confirm-clear-package-data was not supplied. No data was changed." >&2
  exit 2
fi
if ! $ADB_BIN -s "$SERIAL" shell run-as "$PACKAGE" true >/dev/null 2>&1; then
  echo "The installed app is not debuggable. Install the current debug build before seeding." >&2
  exit 1
fi

cleanup() {
  $ADB_BIN -s "$SERIAL" shell rm -f "$REMOTE_FIXTURE" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "Clearing only $PACKAGE on $SERIAL..."
$ADB_BIN -s "$SERIAL" shell am force-stop "$PACKAGE" >/dev/null
$ADB_BIN -s "$SERIAL" shell pm clear "$PACKAGE" >/dev/null
$ADB_BIN -s "$SERIAL" shell run-as "$PACKAGE" mkdir -p cache
$ADB_BIN -s "$SERIAL" push "$FIXTURE" "$REMOTE_FIXTURE" >/dev/null
$ADB_BIN -s "$SERIAL" shell run-as "$PACKAGE" cp "$REMOTE_FIXTURE" "cache/$FIXTURE_BASENAME"
$ADB_BIN -s "$SERIAL" shell run-as "$PACKAGE" rm -f "cache/$RESULT_BASENAME"
$ADB_BIN -s "$SERIAL" shell am start -W -a android.intent.action.VIEW -d "$SEED_URL" -n "$COMPONENT" >/dev/null

for _ in {1..30}; do
  RESULT="$($ADB_BIN -s "$SERIAL" shell run-as "$PACKAGE" cat "cache/$RESULT_BASENAME" 2>/dev/null | tr -d '\r' || true)"
  if [[ -n "$RESULT" ]]; then
    echo "Seed import complete: $RESULT"
    echo "The app now contains the deterministic fixture data."
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for the app to confirm the fixture import. Check Metro and adb logcat." >&2
exit 1
