"""
build-scenes.py — Render per-scene mp4 clips from slides + audio.
Uses zoompan for Ken Burns effect. Falls back to static if zoompan fails.

Usage:
    python3 demo-video/build-scenes.py
"""

import subprocess
import os
import glob
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
SLIDES_DIR = SCRIPT_DIR / "slides"
AUDIO_DIR  = SCRIPT_DIR / "tts" / "audio"
SCENES_DIR = SCRIPT_DIR / "dist" / "scenes"
SCENES_DIR.mkdir(parents=True, exist_ok=True)

WIDTH, HEIGHT, FPS = 1280, 800, 30
TAIL = 0.4   # silence tail per scene (seconds)

def get_duration(path: str) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True
    )
    return float(result.stdout.strip() or "10")

def build_scene(scene: str):
    slide = sorted(SLIDES_DIR.glob(f"{scene}-*.png"))
    if not slide:
        print(f"  ⚠ No slide for scene {scene}")
        return

    slide_path = str(slide[0])
    audio_path = str(AUDIO_DIR / f"{scene}.mp3")
    out_path   = str(SCENES_DIR / f"{scene}.mp4")

    if not os.path.exists(audio_path):
        print(f"  ⚠ No audio for scene {scene}")
        return

    audio_dur = get_duration(audio_path)
    total_dur = round(audio_dur + TAIL, 2)
    frames    = int(total_dur * FPS)

    print(f"  Scene {scene} — {total_dur}s ({frames} frames) [{slide[0].name}]")

    # Try Ken Burns zoom with zoompan
    zoom_expr = f"'1+0.04*on/{frames}'"
    x_expr = f"'iw/2-(iw/zoom/2)'"
    y_expr = f"'ih/2-(ih/zoom/2)'"

    cmd = [
        "ffmpeg", "-y", "-loglevel", "error",
        "-loop", "1", "-framerate", str(FPS), "-i", slide_path,
        "-i", audio_path,
        "-filter_complex",
        f"[0:v]scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,"
        f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,"
        f"zoompan=z={zoom_expr}:x={x_expr}:y={y_expr}"
        f":d={frames}:s={WIDTH}x{HEIGHT}:fps={FPS}[v];"
        f"[1:a]apad=pad_dur={TAIL}[a]",
        "-map", "[v]", "-map", "[a]",
        "-c:v", "libx264", "-preset", "fast", "-crf", "22",
        "-c:a", "aac", "-b:a", "128k",
        "-t", str(total_dur),
        out_path
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    if result.returncode != 0:
        print(f"    ⚠ zoompan failed, using static fallback")
        # Fallback: static slide, no zoom
        cmd_static = [
            "ffmpeg", "-y", "-loglevel", "error",
            "-loop", "1", "-framerate", str(FPS), "-i", slide_path,
            "-i", audio_path,
            "-filter_complex",
            f"[0:v]scale={WIDTH}:{HEIGHT}:force_original_aspect_ratio=decrease,"
            f"pad={WIDTH}:{HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,"
            f"setsar=1[v];"
            f"[1:a]apad=pad_dur={TAIL}[a]",
            "-map", "[v]", "-map", "[a]",
            "-c:v", "libx264", "-preset", "fast", "-crf", "22",
            "-c:a", "aac", "-b:a", "128k",
            "-t", str(total_dur),
            out_path
        ]
        subprocess.run(cmd_static, check=True)

    print(f"    ✓ {Path(out_path).name}")

SCENES = ["01", "02", "03", "04", "05", "06", "07"]
for s in SCENES:
    build_scene(s)

print("\n✅ All scene clips built")
