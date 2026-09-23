# Solo Class HQ 1.5.0 preview-video source

The candidate is built from the real, fictional-data emulator clips in
`assets/store/raw-preview-video/v1.5.0/`, the approved production icon, the
Play Store violet background, and repository fonts. Regenerate with:

```bash
python3 scripts/compose-store-preview-video.py
```

The script writes the editable 1920 × 1080 PNG composition frames here and
exports `assets/store/video/solo-class-hq-play-preview-v1.5.0-candidate.mp4`.
It requires Pillow, FFmpeg, and FFprobe. The original
`assets/store/video/fitdesk-play-preview-final.mp4` is unchanged.

Sequence: 0.8-second brand opening; Income Summary month-to-year chart;
Payments overview and pending-only filter; Calendar session-date transition;
0.7-second brand close. The finished candidate is 1920 × 1080, 30 fps H.264,
and 13.63 seconds. Actual app footage occupies about 89% of runtime.
The raw Android clips are variable-frame-rate and 672 × 1496, so the export
normalizes them to 30 fps without inventing screen content.

At the owner's request, the script takes the first 13.63 seconds of stereo
audio from `assets/store/video/fitdesk-play-preview-final.mp4`, applies a short
fade-in and fade-out, and encodes it as AAC. The soundtrack's rights cannot be
verified from the MP4; confirm it is licensed for YouTube and Play Store use
before uploading. The visual captions also work during muted autoplay.

The owner approved the candidate on 2026-09-21. The release copy is
`assets/store/video/solo-class-hq-play-preview-v1.5.0.mp4`. The owner uploaded
it to YouTube on 2026-09-23 at `https://youtu.be/nrov5kK3_mI`. Set this URL in
the Play Console preview-video field during the 1.5.0 listing update.
