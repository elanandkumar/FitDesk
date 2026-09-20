# Solo Class HQ — identity proposal

Status: approved on 2026-09-19. The Schedule S direction is the production
identity for the 1.5.0 rename.

## Idea

The approved mark is a **calendar-shaped S** with schedule cells and a
completion check. The S anchors the symbol directly to Solo, while the calendar
bindings, grid, and check communicate planning and completion.

The earlier home-base/calendar direction remains available as an alternate. It
expresses HQ well, but may be mistaken for home workouts, a physical studio, or
property software.

## Logo system

- Production master: `approved-icon-master.png` on a violet rounded square.
- Production adaptive foreground: `approved-icon-foreground.png`.
- Production monochrome mark: `approved-icon-monochrome.png`.
- Production notification mark: `approved-icon-notification.png`.
- The `mark-schedule-s*.svg` files are simplified construction references, not
  the production launcher artwork.
- Recommended horizontal wordmark: `wordmark-schedule-s-light.svg`.
- Compact wordmark with completion capsule: `wordmark-text.svg`.
- Alternate HQ/calendar sources: `mark-primary.svg`, `mark-foreground.svg`,
  `mark-monochrome.svg`, `wordmark-light.svg`, and `wordmark-dark.svg`.
- Customer-facing name: **Solo Class HQ**.
- Campaign tagline: **Teach. Track. Earn.**

Do not place the full product name inside the launcher icon. At notification
size, use only the monochrome mark. Preserve the master artwork's restrained
violet depth and soft highlights; do not add external drop shadows.

## Palette

| Role | Color | Hex | Use |
| --- | --- | --- | --- |
| Primary violet | Violet 700 | `#6D28D9` | Icon field, brand emphasis |
| Digital violet | Electric violet | `#6724F9` | Splash and Solo app accent |
| Warm accent | Coral orange | `#F06432` | Check/progress detail, never large passive surfaces |
| Primary ink | Midnight ink | `#171224` | Light-background wordmark and headlines |
| Dark surface | Night | `#111018` | Dark brand background |
| Light surface | Soft white | `#F7F7FA` | Light brand background |
| Muted light text | Lavender gray | `#C8C4DA` | Supporting copy on dark surfaces |
| Muted dark text | Slate violet | `#514B60` | Supporting copy on light surfaces |

Use white on primary violet and midnight ink on soft white for accessible main
text. Coral orange is a semantic accent in the mark, not a body-text color.

## Typography

- Brand/product name and display headlines: Poppins Bold.
- Section headings, labels, and campaign copy: Montserrat SemiBold.
- Body and supporting copy: Outfit Regular.

These families match the app's existing typography and avoid adding another
font dependency.

Solo Violet is the brand-aligned default accent alongside Ocean, Rose, Cobalt,
and Graphite. Graphite provides a quiet neutral option without reusing semantic
success, warning, or danger colors. The internal `purple` key is retained so
existing saved selections continue to work.

## Spacing and minimum size

- Clear space: at least one quarter of the square mark's width on every side.
- Launcher/master mark: 1024 × 1024 source.
- Standalone mark minimum: 24 px digital; use monochrome below 32 px.
- Horizontal wordmark minimum: 180 px wide.
- Never stretch, rotate, outline, recolor individual pieces, or add a shadow.
- Never place the primary mark on a low-contrast violet or orange background.

## Approval sequence

1. Export the Android launcher, adaptive, monochrome, notification, and splash
   assets from the approved PNG master and its derived transparent variants.
2. Replace current production assets and rename visible app surfaces in one
   implementation pass.
3. Verify the installed Android build at launcher, splash, onboarding,
   notification, and themed-icon sizes.
