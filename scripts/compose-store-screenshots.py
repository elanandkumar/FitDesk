#!/usr/bin/env python3
"""Compose branded Play Store screenshots from the approved raw captures."""

from __future__ import annotations

import argparse
from pathlib import Path

try:
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
except ImportError as error:
    raise SystemExit("Pillow is required: python3 -m pip install Pillow") from error


ROOT_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT_DIR / "assets/store/raw-phone-screenshots/v1.5.0"
DEFAULT_OUTPUT_DIR = (
    ROOT_DIR / "assets/store/phone-screenshots/v1.5.0-candidates"
)
BACKGROUND = ROOT_DIR / "assets/store/source/solo-class-hq-violet-background.png"
ICON = ROOT_DIR / "assets/brand/solo-class-hq/approved-icon-master.png"
POPPINS_BOLD = (
    ROOT_DIR
    / "node_modules/@expo-google-fonts/poppins/700Bold/Poppins_700Bold.ttf"
)
MONTSERRAT_SEMIBOLD = (
    ROOT_DIR
    / "node_modules/@expo-google-fonts/montserrat/600SemiBold/"
    / "Montserrat_600SemiBold.ttf"
)

CANVAS_SIZE = (1440, 2560)
SCREEN_WIDTH = 1000
SCREEN_POSITION = (380, 590)

SCREENSHOTS = (
    ("01-dashboard.png", "Your sessions,", "all in one view"),
    ("02-income-summary.png", "Understand your income", "at a glance"),
    ("03-calendar.png", "Plan every class", "with clarity"),
    ("04-payments.png", "Track paid and", "pending payments"),
    ("05-class-details.png", "Every session detail,", "right where you need it"),
    ("06-data-privacy.png", "Your data stays", "on your device"),
)


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    """Resize and center-crop an image to fill the requested size."""
    scale = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1]))


def rounded_screen(source: Path) -> Image.Image:
    screenshot = Image.open(source).convert("RGB")
    height = round(screenshot.height * SCREEN_WIDTH / screenshot.width)
    screenshot = screenshot.resize(
        (SCREEN_WIDTH, height), Image.Resampling.LANCZOS
    )
    mask = Image.new("L", screenshot.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, screenshot.width - 1, screenshot.height - 1),
        radius=42,
        fill=255,
    )
    screenshot.putalpha(mask)
    return screenshot


def compose(source: Path, output: Path, line_one: str, line_two: str) -> None:
    canvas = cover(Image.open(BACKGROUND).convert("RGB"), CANVAS_SIZE).convert("RGBA")
    screenshot = rounded_screen(source)

    shadow = Image.new("RGBA", CANVAS_SIZE, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    x, y = SCREEN_POSITION
    shadow_draw.rounded_rectangle(
        (x - 16, y - 16, x + screenshot.width + 16, y + screenshot.height + 16),
        radius=54,
        fill=(0, 0, 0, 170),
        outline=(109, 100, 124, 130),
        width=4,
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(18))
    canvas.alpha_composite(shadow)
    canvas.alpha_composite(screenshot, SCREEN_POSITION)

    icon = Image.open(ICON).convert("RGB").resize((64, 64), Image.Resampling.LANCZOS)
    icon_mask = Image.new("L", icon.size, 0)
    ImageDraw.Draw(icon_mask).rounded_rectangle((0, 0, 63, 63), radius=15, fill=255)
    icon.putalpha(icon_mask)
    canvas.alpha_composite(icon, (80, 72))

    draw = ImageDraw.Draw(canvas)
    brand_font = ImageFont.truetype(str(MONTSERRAT_SEMIBOLD), 38)
    campaign_font = ImageFont.truetype(str(MONTSERRAT_SEMIBOLD), 20)
    headline_font = ImageFont.truetype(str(POPPINS_BOLD), 76)

    draw.text((164, 75), "Solo Class HQ", font=brand_font, fill="#FFFFFF")
    draw.text(
        (164, 127),
        "TEACH. TRACK. EARN.",
        font=campaign_font,
        fill="#C8C4DA",
        stroke_width=0,
    )
    draw.rounded_rectangle((80, 204, 184, 214), radius=5, fill="#F06432")
    draw.text((80, 240), line_one, font=headline_font, fill="#FFFFFF")
    draw.text((80, 334), line_two, font=headline_font, fill="#FFFFFF")

    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(output, format="PNG", optimize=True)
    print(f"Created {output.relative_to(ROOT_DIR)}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help="Candidate output directory (defaults inside assets/store).",
    )
    args = parser.parse_args()

    required_files = (BACKGROUND, ICON, POPPINS_BOLD, MONTSERRAT_SEMIBOLD)
    missing = [path for path in required_files if not path.is_file()]
    if missing:
        paths = "\n".join(f"- {path}" for path in missing)
        raise SystemExit(f"Missing required files:\n{paths}")

    for filename, line_one, line_two in SCREENSHOTS:
        source = RAW_DIR / filename
        if not source.is_file():
            raise SystemExit(f"Missing raw screenshot: {source}")
        compose(source, args.output_dir / filename, line_one, line_two)


if __name__ == "__main__":
    main()
