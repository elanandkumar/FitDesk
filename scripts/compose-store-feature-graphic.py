#!/usr/bin/env python3
"""Compose the Solo Class HQ feature-graphic approval candidate."""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets/store/raw-phone-screenshots/v1.5.0"
BACKGROUND = ROOT / "assets/store/source/solo-class-hq-violet-background.png"
ICON = ROOT / "assets/brand/solo-class-hq/approved-icon-master.png"
POPPINS = ROOT / "node_modules/@expo-google-fonts/poppins/700Bold/Poppins_700Bold.ttf"
MONTSERRAT = ROOT / "node_modules/@expo-google-fonts/montserrat/600SemiBold/Montserrat_600SemiBold.ttf"
OUTFIT = ROOT / "node_modules/@expo-google-fonts/outfit/400Regular/Outfit_400Regular.ttf"
OUTPUT = ROOT / "assets/store/solo-class-hq-feature-graphic-v1.5.0-candidate.png"
SIZE = (1024, 500)


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    scale = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize(
        (round(image.width * scale), round(image.height * scale)),
        Image.Resampling.LANCZOS,
    )
    x = (resized.width - size[0]) // 2
    y = (resized.height - size[1]) // 2
    return resized.crop((x, y, x + size[0], y + size[1]))


def add_ui_crop(
    canvas: Image.Image,
    source: Path,
    crop: tuple[int, int, int, int],
    position: tuple[int, int],
    size: tuple[int, int],
) -> None:
    screenshot = Image.open(source).convert("RGB")
    panel = cover(screenshot.crop(crop), size).convert("RGBA")
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius=18, fill=255)
    panel.putalpha(mask)
    shadow = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    x, y = position
    ImageDraw.Draw(shadow).rounded_rectangle(
        (x - 6, y - 6, x + size[0] + 6, y + size[1] + 6), radius=22, fill=(0, 0, 0, 105)
    )
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(12)))
    canvas.alpha_composite(panel, position)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    required = [BACKGROUND, ICON, POPPINS, MONTSERRAT, OUTFIT,
                RAW / "01-dashboard.png", RAW / "02-income-summary.png"]
    missing = [path for path in required if not path.is_file()]
    if missing:
        raise SystemExit("Missing required source files:\n" + "\n".join(map(str, missing)))

    canvas = cover(Image.open(BACKGROUND).convert("RGB"), SIZE).convert("RGBA")
    # Crops retain actual app pixels and show the current dashboard and chart treatments.
    add_ui_crop(canvas, RAW / "01-dashboard.png", (66, 550, 1280, 1110), (604, 35), (356, 139))
    add_ui_crop(canvas, RAW / "02-income-summary.png", (66, 1660, 1280, 2510), (604, 205), (356, 248))

    icon = Image.open(ICON).convert("RGBA").resize((58, 58), Image.Resampling.LANCZOS)
    canvas.alpha_composite(icon, (60, 55))
    draw = ImageDraw.Draw(canvas)
    draw.text((133, 57), "Solo Class HQ", font=ImageFont.truetype(str(MONTSERRAT), 28), fill="#FFFFFF")
    draw.text((134, 91), "TEACH. TRACK. EARN.", font=ImageFont.truetype(str(MONTSERRAT), 13), fill="#C8C4DA")
    draw.rounded_rectangle((60, 169, 131, 175), radius=3, fill="#F06432")
    headline = ImageFont.truetype(str(POPPINS), 43)
    draw.text((56, 188), "Manage your", font=headline, fill="#FFFFFF")
    draw.text((56, 242), "classes and", font=headline, fill="#FFFFFF")
    draw.text((56, 296), "payments", font=headline, fill="#FFFFFF")
    draw.text((60, 382), "Sessions  ·  Income  ·  Offline", font=ImageFont.truetype(str(OUTFIT), 22), fill="#E5E1F0")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(args.output, format="PNG", optimize=True)
    print(f"Created {args.output.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
