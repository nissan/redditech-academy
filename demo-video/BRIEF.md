# Demo Video Brief — Redditech Academy (Solana Academy Walkthrough)

**Version:** 1.0
**Date:** 2026-04-18
**Owner:** Loki
**Status:** APPROVED — single variant, walkthrough style

---

## Product Summary

Redditech Academy is a hands-on technical learning platform where every lesson ends with an interactive mission — not a quiz. Learners drag, build, and submit real artefacts. An AI judge (Eli Vasquez) gives immediate, specific feedback. The Solana Academy teaches Solana development from first principles through to production deployment.

## Variant Matrix

Single variant — walkthrough demo, developer audience.

| Label | Audience | Length | Style |
|---|---|---|---|
| A | Developer / technical | 90s | Walkthrough — show the product doing the thing |

## Key Messages (must land)

1. Every lesson has an interactive mission — not passive reading
2. The AI judge gives real feedback, not just right/wrong
3. You learn Solana by building: accounts → instructions → transactions → signers → runtime
4. The drag-to-order quiz tests your mental model, not your memory
5. You can see your score, attempts, and leaderboard rank in real time

## Application Flow (scenes)

| # | URL | What's shown |
|---|---|---|
| 1 | `/` | Academy homepage — course grid, Solana Academy card |
| 2 | `/courses/solana-academy` | Course overview — module list, mission count |
| 3 | `/courses/solana-academy/learn/00-solana-first-principles` | Module overview |
| 4 | `/courses/solana-academy/learn/00-solana-first-principles/mental-models-and-vocabulary/interactive` | Split-pane lesson — narrative left, sequence completer right |
| 5 | Same — drag interaction | User drags steps to correct order |
| 6 | Same — submit + Eli feedback | Pass result: score 100%, Eli's feedback text, points awarded |
| 7 | Back to module / leaderboard | Mission complete state, rank updated |

## Assets Required

- Playwright screenshots of each scene (automated)
- Ken Burns slides from screenshots (ffmpeg zoom filter)
- Kokoro TTS narration audio
- Music bed: `assets/music/ambient-loop.mp3` (or generate)

## Hard Constraints

- Total duration: 85–95 seconds
- No human face, no screen capture with personal info visible
- App must be running at http://localhost:3001 during capture
- Output: `demo-video/dist/solana-academy-demo.mp4`
