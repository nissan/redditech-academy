#!/usr/bin/env bash
# render-and-stitch.sh — Build demo video from slides + narration audio
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

SLIDES_DIR="$SCRIPT_DIR/slides"
AUDIO_DIR="$SCRIPT_DIR/tts/audio"
SCENES_DIR="$SCRIPT_DIR/dist/scenes"
DIST_DIR="$SCRIPT_DIR/dist"
MANIFEST="$SCRIPT_DIR/tts/manifest.csv"
OUTPUT="$DIST_DIR/solana-academy-demo.mp4"

KOKORO_PYTHON="/Users/loki/.kokoro-venv/bin/python3"
KOKORO_VOICE="${KOKORO_VOICE:-af_heart}"
KOKORO_SPEED="${KOKORO_SPEED:-1.0}"
WIDTH=1280
HEIGHT=800
FPS=30
CROSSFADE=0.5

SKIP_SCREENSHOTS=false
SKIP_TTS=false
for arg in "$@"; do
  case $arg in
    --skip-screenshots) SKIP_SCREENSHOTS=true ;;
    --skip-tts) SKIP_TTS=true ;;
  esac
done

mkdir -p "$SLIDES_DIR" "$AUDIO_DIR" "$SCENES_DIR" "$DIST_DIR"

log() { echo "▶ $*"; }

# ── Step 1: Playwright screenshots ───────────────────────────────────────────
if [ "$SKIP_SCREENSHOTS" = false ]; then
  log "Step 1 — Capturing screenshots with Playwright..."
  cd "$REPO_ROOT"
  DEMO_BASE_URL="${DEMO_BASE_URL:-http://localhost:3001}" npx tsx demo-video/capture-screenshots.ts
else
  log "Step 1 — Skipping screenshots (--skip-screenshots)"
fi

for i in 01 02 03 04 05 06 07; do
  ls "$SLIDES_DIR/${i}-"*.png >/dev/null 2>&1 || { echo "❌ Missing slide ${i}"; exit 1; }
done
log "  All 7 slides present ✓"

# ── Step 2: TTS ───────────────────────────────────────────────────────────────
if [ "$SKIP_TTS" = false ]; then
  log "Step 2 — Generating narration with Kokoro ($KOKORO_VOICE @ ${KOKORO_SPEED}x)..."
  "$KOKORO_PYTHON" "$SCRIPT_DIR/generate-tts.py" "$KOKORO_VOICE" "$KOKORO_SPEED" 2>&1 \
    | grep -v "UserWarning\|FutureWarning\|super().__init__\|WeightNorm\|dropout" || true
else
  log "Step 2 — Skipping TTS (--skip-tts)"
fi

for i in 01 02 03 04 05 06 07; do
  [ -f "$AUDIO_DIR/${i}.mp3" ] || { echo "❌ Missing audio ${i}.mp3"; exit 1; }
done
log "  All 7 audio files present ✓"

# ── Step 3: Build per-scene clips ─────────────────────────────────────────────
log "Step 3 — Building scene clips..."

SCENE_NUMS=(01 02 03 04 05 06 07)

for scene in "${SCENE_NUMS[@]}"; do
  SLIDE=$(ls "$SLIDES_DIR/${scene}-"*.png 2>/dev/null | head -1)
  AUDIO="$AUDIO_DIR/${scene}.mp3"
  SCENE_OUT="$SCENES_DIR/${scene}.mp4"

  # Get actual audio duration + 0.4s tail
  AUDIO_DUR=$(ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$AUDIO" 2>/dev/null || echo "10")
  # Use python for float arithmetic (bash can't)
  TOTAL_DUR=$(python3 -c "print(round(float('$AUDIO_DUR') + 0.4, 2))")
  FRAMES=$(python3 -c "print(int(round(float('$TOTAL_DUR') * $FPS)))")

  log "  Scene $scene — ${TOTAL_DUR}s ($FRAMES frames)"

  # Simple approach: pad + gentle zoom using scale filter with pts
  # Much more reliable than zoompan for long durations
  ffmpeg -y -loglevel error \
    -loop 1 -framerate $FPS -i "$SLIDE" \
    -i "$AUDIO" \
    -filter_complex \
      "[0:v]scale='if(gt(a,${WIDTH}/${HEIGHT}),${WIDTH},-2)':'if(gt(a,${WIDTH}/${HEIGHT}),-2,${HEIGHT})',
       pad=${WIDTH}:${HEIGHT}:(ow-iw)/2:(oh-ih)/2:black,
       scale=iw*'1+0.04*min(t/${TOTAL_DUR},1)':ih*'1+0.04*min(t/${TOTAL_DUR},1)',
       crop=${WIDTH}:${HEIGHT},
       setsar=1,fps=${FPS}[v];
       [1:a]apad=pad_dur=0.4[a]" \
    -map "[v]" -map "[a]" \
    -c:v libx264 -preset fast -crf 22 \
    -c:a aac -b:a 128k \
    -t "$TOTAL_DUR" \
    "$SCENE_OUT"
done

log "  All 7 scene clips built ✓"

# ── Step 4: Stitch with crossfades ────────────────────────────────────────────
log "Step 4 — Stitching scenes..."

# Write concat manifest (no crossfades — simpler and avoids filter_complex limits)
CONCAT_LIST="$DIST_DIR/concat.txt"
> "$CONCAT_LIST"
for scene in "${SCENE_NUMS[@]}"; do
  echo "file '$SCENES_DIR/${scene}.mp4'" >> "$CONCAT_LIST"
done

# First pass: concat
CONCAT_OUT="$DIST_DIR/concat-raw.mp4"
ffmpeg -y -loglevel error \
  -f concat -safe 0 -i "$CONCAT_LIST" \
  -c:v libx264 -preset medium -crf 20 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  "$CONCAT_OUT"

# Second pass: add crossfades via xfade (build filter programmatically)
log "  Adding crossfade transitions..."

# Get durations for offset calculation
OFFSETS=()
CUMULATIVE=0
for i in "${!SCENE_NUMS[@]}"; do
  scene="${SCENE_NUMS[$i]}"
  DUR=$(ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1:nokey=1 "$SCENES_DIR/${scene}.mp4")
  OFFSETS+=("$CUMULATIVE")
  CUMULATIVE=$(python3 -c "print(round($CUMULATIVE + float('$DUR') - $CROSSFADE, 4))")
done

# Build xfade + acrossfade filter
NUM=${#SCENE_NUMS[@]}
INPUTS=""
for scene in "${SCENE_NUMS[@]}"; do
  INPUTS+="-i $SCENES_DIR/${scene}.mp4 "
done

# Build filter chain
VFILTER=""
AFILTER=""
for i in $(seq 0 $((NUM - 2))); do
  j=$((i + 1))
  OFF="${OFFSETS[$j]}"
  if [ "$i" -eq 0 ]; then
    VI="[0:v]"; AI="[0:a]"
  else
    VI="[xv${i}]"; AI="[xa${i}]"
  fi
  NVI="[$j:v]"; NAI="[$j:a]"
  VFILTER+="${VI}${NVI}xfade=transition=fade:duration=${CROSSFADE}:offset=${OFF}[xv${j}];"
  AFILTER+="${AI}${NAI}acrossfade=d=${CROSSFADE}[xa${j}];"
done

LAST=$((NUM - 1))

eval ffmpeg -y -loglevel error \
  $INPUTS \
  -filter_complex "\"${VFILTER}${AFILTER}\"" \
  -map "\"[xv${LAST}]\"" -map "\"[xa${LAST}]\"" \
  -c:v libx264 -preset medium -crf 20 \
  -c:a aac -b:a 192k \
  -movflags +faststart \
  "$OUTPUT" || {
    # Fallback: use concat without crossfades if xfade filter fails
    log "  ⚠ xfade failed — using simple concat (no crossfades)"
    cp "$CONCAT_OUT" "$OUTPUT"
  }

FINAL_DUR=$(ffprobe -v error -show_entries format=duration \
  -of default=noprint_wrappers=1:nokey=1 "$OUTPUT" 2>/dev/null || echo "?")
FINAL_SIZE=$(du -sh "$OUTPUT" | cut -f1)

log ""
log "✅ Done! → $OUTPUT"
log "   Duration: ${FINAL_DUR}s  |  Size: ${FINAL_SIZE}"
