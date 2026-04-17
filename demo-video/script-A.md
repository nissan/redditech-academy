# Video Script A — Redditech Academy: Solana Walkthrough
**Version:** 1.0
**Target length:** 90 seconds
**Audience:** Developer / technical
**Style:** Walkthrough — second person, show the product in action
**Word count:** ~185 words (≈85s at natural pace + 5s silence buffer)

---

## Scene-by-scene

### Scene 01 — Homepage (0:00–0:10)
**Screen:** `/` — Academy homepage, course grid visible
**Action:** Static hold, slow Ken Burns zoom in on Solana Academy card
**Narration:** "This is Redditech Academy. Every course here ends with a mission — not a multiple choice quiz. Let's walk through the Solana Academy."
**Music:** Fade in — ambient, low energy

---

### Scene 02 — Course Overview (0:10–0:20)
**Screen:** `/courses/solana-academy` — module list, mission count badges
**Action:** Slow scroll down the module list
**Narration:** "The Solana Academy takes you from first principles — accounts, programs, transactions — all the way to validator operations and production deployment."
**Music:** Steady

---

### Scene 03 — Module Overview (0:20–0:30)
**Screen:** `/courses/solana-academy/learn/00-solana-first-principles` — lesson list
**Action:** Click into Module 00 — First Principles. Highlight the interactive lesson badge.
**Narration:** "Module Zero starts with mental models. Click the interactive lesson and you get a split-pane environment — concept on the left, your mission on the right."
**Music:** Slight energy lift

---

### Scene 04 — Interactive Lesson: Narrative pane (0:30–0:43)
**Screen:** Interactive lesson — left pane with lesson content and Mission HUD
**Action:** Slow scroll of the left pane showing the theatre analogy, mission goals, leaderboard
**Narration:** "The left pane gives you the concept. Programs execute, accounts store, transactions bundle instructions. The Mission HUD tracks your points, streak, and rank."
**Music:** Steady

---

### Scene 05 — Interactive Lesson: Sequence Completer (0:43–0:58)
**Screen:** Right pane — SequenceCompleter with shuffled steps
**Action:** Highlight the five scrambled steps. Then animate drag: move one step to correct position.
**Narration:** "On the right — your mission. Five steps of Solana's execution model, shuffled. Drag them into the correct order: account creation, instruction, transaction, signer, runtime."
**Music:** Slight tension

---

### Scene 06 — Submit + Eli Feedback (0:58–1:18)
**Screen:** Right pane after submit — FeedbackPanel with pass state, 100% score, Eli's text
**Action:** Click Check Answer with correct order. Show the green pass state, score bar filling to 100%, Eli's feedback text appearing, points awarded badge.
**Narration:** "Submit. Eli Vasquez — your AI judge — gives you specific feedback immediately. Not just right or wrong. A real explanation. One hundred percent. Mission complete. Points awarded."
**Music:** Resolve — satisfying lift

---

### Scene 07 — Mission Complete / Leaderboard (1:18–1:30)
**Screen:** Back to module overview — lesson marked complete. Leaderboard rank visible.
**Action:** Hold on module overview with completed lesson badge. Cut to Mission HUD showing rank.
**Narration:** "Your rank updates on the leaderboard. Every mission you complete builds toward mastery of Solana development — from mental models to mainnet."
**Music:** Fade out

---

## Full Narration (clean TTS read)

This is Redditech Academy. Every course here ends with a mission — not a multiple choice quiz. Let's walk through the Solana Academy.

The Solana Academy takes you from first principles — accounts, programs, transactions — all the way to validator operations and production deployment.

Module Zero starts with mental models. Click the interactive lesson and you get a split-pane environment — concept on the left, your mission on the right.

The left pane gives you the concept. Programs execute, accounts store, transactions bundle instructions. The Mission HUD tracks your points, streak, and rank.

On the right — your mission. Five steps of Solana's execution model, shuffled. Drag them into the correct order: account creation, instruction, transaction, signer, runtime.

Submit. Eli Vasquez — your AI judge — gives you specific feedback immediately. Not just right or wrong. A real explanation. One hundred percent. Mission complete. Points awarded.

Your rank updates on the leaderboard. Every mission you complete builds toward mastery of Solana development — from mental models to mainnet.

---

## Screenshot Requirements

| Scene | URL | Notes |
|---|---|---|
| 01 | `http://localhost:3001/` | Full viewport, 1280×800 |
| 02 | `http://localhost:3001/courses/solana-academy` | Full viewport, scroll to show modules |
| 03 | `http://localhost:3001/courses/solana-academy/learn/00-solana-first-principles` | Full viewport |
| 04 | `http://localhost:3001/courses/solana-academy/learn/00-solana-first-principles/mental-models-and-vocabulary/interactive` | Left pane focus |
| 05 | Same URL | Right pane — SequenceCompleter (shuffled state) |
| 06 | Same URL | Right pane — FeedbackPanel pass state (needs JS interaction) |
| 07 | `http://localhost:3001/courses/solana-academy/learn/00-solana-first-principles` | With completed badge |

## Notes for Finn

- Scenes 04–06 are the same URL — use separate screenshots at different scroll/state positions
- Scene 06 requires Playwright to click "Check Answer" after setting correct order — see capture script
- Ken Burns: zoom 1.0→1.05 over scene duration, anchor changes per scene (center, left, right alternating)
- Crossfade between scenes: 0.5s
- `amix duration=longest` — not `duration=first`
- Target output: `demo-video/dist/solana-academy-demo.mp4`, 1280×800, h264
