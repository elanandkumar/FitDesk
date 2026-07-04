#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/release.sh [options]

Build FitDesk, generate release notes from git log, tag the commit, and
optionally create a GitHub release.

Options:
  --version <x.y.z>       Release version. Defaults to package.json version.
  --version-code <n>      Android versionCode to write when --update-version is used.
  --update-version        Update package.json, package-lock.json, app.json, and android/app/build.gradle.
  --commit-version        Commit version file updates before building/tagging.
  --format <aab|apk>      Android artifact format. Defaults to aab for Play Store uploads.
  --previous-tag <tag>    Compare commits after this tag. Defaults to latest semver tag before current tag.
  --target <ref>          Commit/ref to tag. Defaults to HEAD.
  --github-release        Create a GitHub release with gh after build/tag.
  --draft                 Create the GitHub release as a draft.
  --prerelease            Mark the GitHub release as a prerelease.
  --skip-build            Generate notes/tag/release without building.
  --dry-run               Generate notes only; do not tag or publish.
  --allow-dirty           Allow running with uncommitted changes.
  --force-tag             Replace an existing local tag with the same name.
  -h, --help              Show this help.

Examples:
  scripts/release.sh
  scripts/release.sh --version 1.2.2 --version-code 5 --update-version --commit-version
  scripts/release.sh --format apk --github-release --draft
EOF
}

die() {
  echo "release: $*" >&2
  exit 1
}

run() {
  echo "+ $*"
  "$@"
}

repo_root="$(git rev-parse --show-toplevel 2>/dev/null)" || die "not inside a git repository"
cd "$repo_root"

version=""
version_code=""
update_version=false
commit_version=false
format="aab"
previous_tag=""
target_ref="HEAD"
github_release=false
draft=false
prerelease=false
skip_build=false
dry_run=false
allow_dirty=false
force_tag=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      [[ $# -ge 2 ]] || die "--version requires a value"
      version="$2"
      shift 2
      ;;
    --version-code)
      [[ $# -ge 2 ]] || die "--version-code requires a value"
      version_code="$2"
      shift 2
      ;;
    --update-version)
      update_version=true
      shift
      ;;
    --commit-version)
      commit_version=true
      shift
      ;;
    --format)
      [[ $# -ge 2 ]] || die "--format requires a value"
      format="$2"
      shift 2
      ;;
    --previous-tag)
      [[ $# -ge 2 ]] || die "--previous-tag requires a value"
      previous_tag="$2"
      shift 2
      ;;
    --target)
      [[ $# -ge 2 ]] || die "--target requires a value"
      target_ref="$2"
      shift 2
      ;;
    --github-release)
      github_release=true
      shift
      ;;
    --draft)
      draft=true
      shift
      ;;
    --prerelease)
      prerelease=true
      shift
      ;;
    --skip-build)
      skip_build=true
      shift
      ;;
    --dry-run)
      dry_run=true
      skip_build=true
      shift
      ;;
    --allow-dirty)
      allow_dirty=true
      shift
      ;;
    --force-tag)
      force_tag=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      die "unknown option: $1"
      ;;
  esac
done

[[ "$format" == "aab" || "$format" == "apk" ]] || die "--format must be aab or apk"
[[ -z "$version_code" || "$version_code" =~ ^[0-9]+$ ]] || die "--version-code must be a number"

command -v node >/dev/null 2>&1 || die "node is required"
[[ -f package.json ]] || die "package.json not found"
[[ -f app.json ]] || die "app.json not found"
[[ -f android/app/build.gradle ]] || die "android/app/build.gradle not found"

if [[ -z "$version" ]]; then
  version="$(node -p "require('./package.json').version")"
fi

[[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.-]+)?$ ]] || die "version must look like x.y.z"

tag="v$version"

if [[ "$dry_run" == true && "$update_version" == true ]]; then
  die "--dry-run cannot be combined with --update-version because version files would change."
fi

if [[ "$allow_dirty" == false && -n "$(git status --porcelain)" ]]; then
  die "working tree is dirty. Commit/stash changes or pass --allow-dirty."
fi

if [[ "$commit_version" == true && -n "$(git status --porcelain -- package.json package-lock.json app.json android/app/build.gradle)" ]]; then
  die "--commit-version requires clean version files before the script edits them."
fi

run git rev-parse --verify --quiet "$target_ref^{commit}" >/dev/null

if [[ "$update_version" == true ]]; then
  [[ -n "$version_code" ]] || die "--update-version requires --version-code"
  node - "$version" "$version_code" <<'NODE'
const fs = require('fs');

const [version, rawVersionCode] = process.argv.slice(2);
const versionCode = Number(rawVersionCode);

function writeJson(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
}

for (const path of ['package.json', 'package-lock.json']) {
  if (!fs.existsSync(path)) continue;
  const data = JSON.parse(fs.readFileSync(path, 'utf8'));
  data.version = version;
  if (data.packages && data.packages['']) {
    data.packages[''].version = version;
  }
  writeJson(path, data);
}

const app = JSON.parse(fs.readFileSync('app.json', 'utf8'));
app.expo.version = version;
app.expo.android = app.expo.android || {};
app.expo.android.versionCode = versionCode;
writeJson('app.json', app);

let gradle = fs.readFileSync('android/app/build.gradle', 'utf8');
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
gradle = gradle.replace(/versionName\s+"[^"]+"/, `versionName "${version}"`);
fs.writeFileSync('android/app/build.gradle', gradle);
NODE

  if [[ "$commit_version" == true ]]; then
    run git add package.json package-lock.json app.json android/app/build.gradle
    run git commit -m "chore: bump version to ${tag}"
    target_ref="HEAD"
  elif [[ "$dry_run" == false ]]; then
    die "--update-version changed files but --commit-version was not passed; commit them before tagging or use --commit-version."
  fi
fi

if [[ -z "$previous_tag" ]]; then
  previous_tag="$(git tag --sort=-v:refname | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+' | grep -v "^${tag}$" | head -n 1 || true)"
fi

if [[ -n "$previous_tag" ]]; then
  git rev-parse --verify --quiet "$previous_tag^{commit}" >/dev/null || die "previous tag not found: $previous_tag"
  compare_range="${previous_tag}..${target_ref}"
else
  compare_range="$target_ref"
fi

artifact=""
if [[ "$skip_build" == false ]]; then
  if [[ "$format" == "aab" ]]; then
    run ./android/gradlew -p android bundleRelease
    artifact="android/app/build/outputs/bundle/release/app-release.aab"
  else
    run ./android/gradlew -p android assembleRelease
    artifact="android/app/build/outputs/apk/release/app-release.apk"
  fi
  [[ -f "$artifact" ]] || die "expected build artifact was not found: $artifact"
fi

mkdir -p dist/releases
notes_file="dist/releases/${tag}.md"

node - "$tag" "$version" "$previous_tag" "$compare_range" "$notes_file" "$artifact" <<'NODE'
const fs = require('fs');
const { execFileSync } = require('child_process');

const [tag, version, previousTag, compareRange, notesFile, artifact] = process.argv.slice(2);

function git(args) {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
}

const commitLines = git(['log', '--pretty=format:%H%x09%s', compareRange])
  .split('\n')
  .filter(Boolean);

const groups = [
  { title: 'Features', matches: [/^feat(\(.+\))?:/i] },
  { title: 'Fixes', matches: [/^fix(\(.+\))?:/i] },
  { title: 'Maintenance', matches: [/^chore(\(.+\))?:/i, /^build(\(.+\))?:/i, /^ci(\(.+\))?:/i, /^refactor(\(.+\))?:/i, /^perf(\(.+\))?:/i, /^test(\(.+\))?:/i, /^docs(\(.+\))?:/i] },
  { title: 'Other Changes', matches: [] },
];

const buckets = new Map(groups.map((group) => [group.title, []]));

function cleanSubject(subject) {
  return subject
    .replace(/^[a-z]+(\([^)]+\))?!?:\s*/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

for (const line of commitLines) {
  const [hash, subject] = line.split('\t');
  const group = groups.find((candidate) => candidate.matches.some((pattern) => pattern.test(subject))) || groups[groups.length - 1];
  buckets.get(group.title).push(`- ${cleanSubject(subject)} (${hash.slice(0, 7)})`);
}

const date = new Date().toISOString().slice(0, 10);
const lines = [
  `# FitDesk ${tag}`,
  '',
  `Release date: ${date}`,
  '',
];

if (previousTag) {
  lines.push(`Changes since ${previousTag}.`, '');
}

for (const group of groups) {
  const items = buckets.get(group.title);
  if (!items.length) continue;
  lines.push(`## ${group.title}`, ...items, '');
}

if (!commitLines.length) {
  lines.push('## Changes', '- No commits found for this release range.', '');
}

if (artifact) {
  lines.push('## Build Artifact', `- ${artifact}`, '');
}

lines.push('## Version', `- Version: ${version}`, '');

fs.writeFileSync(notesFile, lines.join('\n'));
NODE

if [[ "$dry_run" == false ]]; then
  if git rev-parse --verify --quiet "refs/tags/$tag" >/dev/null; then
    if [[ "$force_tag" == true ]]; then
      run git tag -d "$tag"
    else
      die "tag already exists: $tag. Pass --force-tag to replace the local tag."
    fi
  fi
fi

if [[ "$dry_run" == false ]]; then
  run git tag -a "$tag" "$target_ref" -F "$notes_file"
fi

if [[ "$github_release" == true && "$dry_run" == false ]]; then
  command -v gh >/dev/null 2>&1 || die "gh is required for --github-release"
  args=(release create "$tag" --title "FitDesk $tag" --notes-file "$notes_file")
  [[ "$draft" == true ]] && args+=(--draft)
  [[ "$prerelease" == true ]] && args+=(--prerelease)
  [[ -n "$artifact" ]] && args+=("$artifact")
  run gh "${args[@]}"
fi

echo
if [[ "$dry_run" == true ]]; then
  echo "Release preview prepared: $tag"
else
  echo "Release prepared: $tag"
fi
echo "Notes: $notes_file"
if [[ -n "$artifact" ]]; then
  echo "Artifact: $artifact"
fi
if [[ "$dry_run" == false ]]; then
  echo "Next: git push origin $tag"
fi
if [[ "$github_release" == false && "$dry_run" == false ]]; then
  echo "Optional: gh release create $tag --title \"FitDesk $tag\" --notes-file $notes_file ${artifact}"
fi
