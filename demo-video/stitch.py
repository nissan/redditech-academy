"""
stitch.py — Concat scene clips into final demo video with crossfades.

Usage:
    python3 demo-video/stitch.py
"""

import subprocess
import os
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
SCENES_DIR = SCRIPT_DIR / "dist" / "scenes"
DIST_DIR   = SCRIPT_DIR / "dist"
OUTPUT     = DIST_DIR / "solana-academy-demo.mp4"
CROSSFADE  = 0.5

SCENES = ["01", "02", "03", "04", "05", "06", "07"]

def get_duration(path: str) -> float:
    result = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=noprint_wrappers=1:nokey=1", path],
        capture_output=True, text=True
    )
    return float(result.stdout.strip() or "10")

scene_paths = [str(SCENES_DIR / f"{s}.mp4") for s in SCENES]

# Verify all exist
for p in scene_paths:
    if not os.path.exists(p):
        print(f"❌ Missing: {p}")
        exit(1)

# Get durations for xfade offset calculation
durations = [get_duration(p) for p in scene_paths]
print("Scene durations:", [f"{d:.2f}s" for d in durations])

# Calculate xfade offsets
offsets = []
cumulative = 0.0
for i, dur in enumerate(durations[:-1]):
    cumulative += dur - CROSSFADE
    offsets.append(round(cumulative, 4))

print("Crossfade offsets:", offsets)

# Build ffmpeg inputs
inputs = []
for p in scene_paths:
    inputs += ["-i", p]

# Build filter_complex
n = len(SCENES)
vf_parts = []
af_parts = []

for i in range(n - 1):
    vi = f"[{i}:v]" if i == 0 else f"[xv{i}]"
    ai = f"[{i}:a]" if i == 0 else f"[xa{i}]"
    vf_parts.append(
        f"{vi}[{i+1}:v]xfade=transition=fade:duration={CROSSFADE}:offset={offsets[i]}[xv{i+1}]"
    )
    af_parts.append(
        f"{ai}[{i+1}:a]acrossfade=d={CROSSFADE}[xa{i+1}]"
    )

filter_complex = ";".join(vf_parts + af_parts)
final_v = f"[xv{n-1}]"
final_a = f"[xa{n-1}]"

print("Stitching with crossfades...")

cmd = (
    ["ffmpeg", "-y", "-loglevel", "error"]
    + inputs
    + [
        "-filter_complex", filter_complex,
        "-map", final_v,
        "-map", final_a,
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        str(OUTPUT),
    ]
)

result = subprocess.run(cmd, capture_output=True, text=True)

if result.returncode != 0:
    print(f"⚠ xfade stitch failed: {result.stderr[:300]}")
    print("Falling back to simple concat (no crossfades)...")

    # Concat fallback
    concat_list = DIST_DIR / "concat.txt"
    with open(concat_list, "w") as f:
        for p in scene_paths:
            f.write(f"file '{p}'\n")

    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(concat_list),
        "-c:v", "libx264", "-preset", "medium", "-crf", "20",
        "-c:a", "aac", "-b:a", "192k",
        "-movflags", "+faststart",
        str(OUTPUT),
    ], check=True)

dur = get_duration(str(OUTPUT))
size = os.path.getsize(str(OUTPUT)) // 1024

print(f"\n✅ {OUTPUT}")
print(f"   Duration: {dur:.1f}s  |  Size: {size}KB")
