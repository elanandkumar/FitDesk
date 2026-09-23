#!/usr/bin/env python3
"""Compose a Solo Class HQ Play Store preview from real emulator footage."""

from __future__ import annotations

import argparse
import json
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "assets/store/raw-preview-video/v1.5.0"
SOURCE = ROOT / "assets/store/video/source/v1.5.0"
OUTPUT = ROOT / "assets/store/video/solo-class-hq-play-preview-v1.5.0-candidate.mp4"
PREVIOUS_VIDEO = ROOT / "assets/store/video/fitdesk-play-preview-final.mp4"
BACKGROUND = ROOT / "assets/store/source/solo-class-hq-violet-background.png"
ICON = ROOT / "assets/brand/solo-class-hq/approved-icon-master.png"
POPPINS = ROOT / "node_modules/@expo-google-fonts/poppins/700Bold/Poppins_700Bold.ttf"
MONTSERRAT = ROOT / "node_modules/@expo-google-fonts/montserrat/600SemiBold/Montserrat_600SemiBold.ttf"
OUTFIT = ROOT / "node_modules/@expo-google-fonts/outfit/400Regular/Outfit_400Regular.ttf"

SIZE = (1920, 1080)
FPS = 30
PHONE_HEIGHT = 1010
PHONE_WIDTH = 454
PHONE_X = 1280
PHONE_Y = 35
INTRO_SECONDS = 0.8
OUTRO_SECONDS = 0.7
PAYMENTS_SECONDS = 5.2

SCENES = (
    ("income", "01-income-summary.mp4", "Understand your income", "A clear view of every month"),
    ("payments", "02-payments.mp4", "Track what is pending", "Filter organizer payments"),
    ("calendar", "03-calendar.mp4", "Plan every class", "See the sessions ahead"),
)


def run(*args: str) -> None:
    subprocess.run(args, check=True)


def duration(path: Path) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)],
        check=True,
        capture_output=True,
        text=True,
    )
    return float(json.loads(result.stdout)["format"]["duration"])


def background() -> Image.Image:
    original = Image.open(BACKGROUND).convert("RGB")
    scale = SIZE[0] / original.width
    resized = original.resize((SIZE[0], round(original.height * scale)), Image.Resampling.LANCZOS)
    top = (resized.height - SIZE[1]) // 2
    return resized.crop((0, top, SIZE[0], top + SIZE[1])).convert("RGBA")


def draw_brand(draw: ImageDraw.ImageDraw, canvas: Image.Image, *, large: bool) -> None:
    icon_size = 136 if large else 70
    icon_x = 158
    icon_y = 382 if large else 111
    icon = Image.open(ICON).convert("RGBA").resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    canvas.alpha_composite(icon, (icon_x, icon_y))
    if not large:
        font = ImageFont.truetype(str(MONTSERRAT), 36)
        draw.text((icon_x + 92, icon_y + 10), "Solo Class HQ", font=font, fill="#FFFFFF")
        draw.text(
            (icon_x + 92, icon_y + 55),
            "TEACH. TRACK. EARN.",
            font=ImageFont.truetype(str(MONTSERRAT), 18),
            fill="#C8C4DA",
        )


def render_brand_frame(path: Path, *, closing: bool = False) -> None:
    canvas = background()
    draw = ImageDraw.Draw(canvas)
    draw_brand(draw, canvas, large=True)
    title = ImageFont.truetype(str(POPPINS), 94)
    tagline = ImageFont.truetype(str(MONTSERRAT), 49)
    draw.text((330, 378), "Solo Class HQ", font=title, fill="#FFFFFF")
    draw.text((334, 494), "Teach. Track. Earn.", font=tagline, fill="#C8C4DA")
    if not closing:
        draw.rounded_rectangle((334, 580, 440, 588), radius=4, fill="#F06432")
    canvas.convert("RGB").save(path, optimize=True)


def render_footage_frame(path: Path, heading: str, subheading: str) -> None:
    canvas = background()
    draw = ImageDraw.Draw(canvas)
    draw_brand(draw, canvas, large=False)
    draw.rounded_rectangle((158, 347, 252, 355), radius=4, fill="#F06432")
    draw.text((152, 391), heading, font=ImageFont.truetype(str(POPPINS), 66), fill="#FFFFFF")
    draw.text((157, 495), subheading, font=ImageFont.truetype(str(OUTFIT), 40), fill="#C8C4DA")

    shadow = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).rounded_rectangle(
        (PHONE_X - 14, PHONE_Y - 12, PHONE_X + PHONE_WIDTH + 14, PHONE_Y + PHONE_HEIGHT + 12),
        radius=34,
        fill=(0, 0, 0, 155),
    )
    canvas.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(20)))
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle(
        (PHONE_X - 2, PHONE_Y - 2, PHONE_X + PHONE_WIDTH + 1, PHONE_Y + PHONE_HEIGHT + 1),
        radius=10,
        fill="#111018",
        outline="#514B60",
        width=2,
    )
    canvas.convert("RGB").save(path, optimize=True)


def still_segment(frame: Path, output: Path, seconds: float) -> None:
    run(
        "ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", str(FPS),
        "-i", str(frame), "-t", str(seconds), "-c:v", "libx264", "-preset", "medium",
        "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS), str(output),
    )


def footage_segment(frame: Path, clip: Path, output: Path, seconds: float) -> None:
    filters = (
        f"[1:v]fps={FPS},scale={PHONE_WIDTH}:{PHONE_HEIGHT}:flags=lanczos,setsar=1[phone];"
        f"[0:v][phone]overlay={PHONE_X}:{PHONE_Y}:shortest=1,format=yuv420p[out]"
    )
    run(
        "ffmpeg", "-y", "-loglevel", "error", "-loop", "1", "-framerate", str(FPS),
        "-i", str(frame), "-i", str(clip), "-filter_complex", filters, "-map", "[out]",
        "-t", str(seconds), "-an", "-c:v", "libx264", "-preset", "medium",
        "-crf", "18", "-pix_fmt", "yuv420p", "-r", str(FPS), str(output),
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=OUTPUT)
    args = parser.parse_args()
    required = [BACKGROUND, ICON, POPPINS, MONTSERRAT, OUTFIT, PREVIOUS_VIDEO]
    required.extend(RAW / filename for _, filename, _, _ in SCENES)
    missing = [path for path in required if not path.is_file()]
    if missing:
        raise SystemExit("Missing required source files:\n" + "\n".join(map(str, missing)))

    SOURCE.mkdir(parents=True, exist_ok=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    intro = SOURCE / "intro.png"
    outro = SOURCE / "outro.png"
    render_brand_frame(intro)
    render_brand_frame(outro, closing=True)

    with tempfile.TemporaryDirectory(prefix="solo-class-hq-video-") as temporary:
        temp = Path(temporary)
        segments: list[Path] = []
        opening = temp / "00-intro.mp4"
        still_segment(intro, opening, INTRO_SECONDS)
        segments.append(opening)
        for number, (name, filename, heading, subheading) in enumerate(SCENES, start=1):
            frame = SOURCE / f"{name}.png"
            render_footage_frame(frame, heading, subheading)
            clip = RAW / filename
            seconds = min(duration(clip), PAYMENTS_SECONDS) if name == "payments" else duration(clip)
            output = temp / f"{number:02d}-{name}.mp4"
            footage_segment(frame, clip, output, seconds)
            segments.append(output)
        closing = temp / "04-outro.mp4"
        still_segment(outro, closing, OUTRO_SECONDS)
        segments.append(closing)
        concat = temp / "segments.txt"
        concat.write_text("".join(f"file '{path}'\n" for path in segments), encoding="utf-8")
        video_only = temp / "video-only.mp4"
        run(
            "ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0",
            "-i", str(concat), "-c", "copy", str(video_only),
        )
        seconds = duration(video_only)
        audio_filters = (
            f"atrim=0:{seconds:.3f},asetpts=PTS-STARTPTS,volume=0.9,"
            f"afade=t=in:st=0:d=0.25,afade=t=out:st={seconds - 0.8:.3f}:d=0.8"
        )
        run(
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(video_only),
            "-i", str(PREVIOUS_VIDEO), "-map", "0:v:0", "-map", "1:a:0",
            "-c:v", "copy", "-af", audio_filters, "-c:a", "aac", "-b:a", "160k",
            "-ar", "48000", "-ac", "2", "-t", f"{seconds:.3f}",
            "-movflags", "+faststart", str(args.output),
        )
    print(f"Created {args.output.relative_to(ROOT)} ({duration(args.output):.2f} s)")


if __name__ == "__main__":
    main()
