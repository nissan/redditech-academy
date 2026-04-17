"""
generate-tts.py — Generate all narration audio in one Kokoro session.
Loads the model once, processes every scene from tts/manifest.csv.

Usage:
    /Users/loki/.kokoro-venv/bin/python3 demo-video/generate-tts.py [voice] [speed]

Outputs: demo-video/tts/audio/NN.mp3 for each scene row.
"""

import sys
import csv
import os
import numpy as np
import soundfile as sf
from pathlib import Path
from kokoro import KPipeline

SCRIPT_DIR = Path(__file__).parent
MANIFEST = SCRIPT_DIR / "tts" / "manifest.csv"
AUDIO_DIR = SCRIPT_DIR / "tts" / "audio"
AUDIO_DIR.mkdir(parents=True, exist_ok=True)

VOICE = sys.argv[1] if len(sys.argv) > 1 else "af_heart"
SPEED = float(sys.argv[2]) if len(sys.argv) > 2 else 1.0
SAMPLE_RATE = 24000

print(f"Loading Kokoro pipeline (voice={VOICE}, speed={SPEED})...")
pipeline = KPipeline(lang_code="a")

with open(MANIFEST, newline="") as f:
    reader = csv.DictReader(f)
    rows = list(reader)

for row in rows:
    scene = row["scene"].strip()
    narration = row["narration"].strip().strip('"')
    out_path = AUDIO_DIR / f"{scene}.mp3"

    if out_path.exists():
        print(f"  Scene {scene} — exists, skipping")
        continue

    print(f"  Scene {scene} — synthesising ({len(narration)} chars)...")
    samples = []
    for _, _, audio in pipeline(narration, voice=VOICE, speed=SPEED, split_pattern=r"\n+"):
        chunk = audio.numpy() if hasattr(audio, "numpy") else audio
        samples.append(chunk)

    if samples:
        combined = np.concatenate(samples)
        sf.write(str(out_path), combined, SAMPLE_RATE)
        duration = len(combined) / SAMPLE_RATE
        print(f"    → {out_path.name} ({duration:.1f}s)")
    else:
        print(f"    ⚠ No audio generated for scene {scene}")

print("\n✅ TTS complete")
