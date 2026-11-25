# PAX — Production Master Directive

**Role:** Coding Agent executing Phase 4 (Present) of the enoch-mode hackathon system  
**Project:** PAX — Can the airline reach you?  
**Repo:** https://github.com/HillaryIkhais/Pax.git  
**Deadline:** November 26, 2026, 7:29 PM WAT  
**Goal:** Produce a 2–3 minute product demonstration video that makes judges understand, appreciate, and remember PAX.

---

## 1. Your Mission

You are responsible for the complete creative direction, storytelling, product preparation, voiceover, screen recording, editing, sound design, and final production of PAX's product demonstration video.

**Not a technical explainer. Not a screen recording of coding.** A product demonstration film — compelling, human, memorable.

## 2. Deliverables (in `production/`)

| File | Status | Description |
|------|--------|-------------|
| `captions/captions.srt` | ✅ Complete | Synchronized captions, 33 entries |
| `motion/kinetic-typography.html` | ✅ Complete | Animated text reveals for key moments |
| `motion/interface-choreography.html` | ✅ Complete | PAX interface interaction sequence |
| `motion/drey-moment.html` | ✅ Complete | Terminal + browser false-save detection |
| `voiceover-script.md` | ✅ Complete | Full narration with delivery notes |
| `storyboard.md` | ✅ Complete | Scene-by-scene visual directions |
| `production-report.md` | ✅ Complete | Production status and limitations |
| `PRODUCTION_MASTER_DIRECTIVE.md` | ✅ Complete | This document |
| `product-demo.mp4` | ❌ To record | Final exported video |
| `voiceover/*.mp3/.wav` | ❌ To record | Narrator audio |
| `captions.srt` | ✅ Complete | Synchronized subtitles |

## 3. Before You Touch Video: Discover the Product

**Do not assume what PAX does.** Inspect the repository:

- `src/app/page.tsx` — the customer interface
- `src/app/api/sandbox/pnr/[id]/contact/route.ts` — the contact update API (with the false-save bug)
- `src/lib/audit/engine.ts` — the deterministic contact audit
- `src/lib/db/seed.ts` — 5 seeded PNRs (AX1234, BY5678, CZ9012, DX3456, FS7777)
- `tests/kane/*.test.md` — 5 Kane CLI scenarios
- `README.md` — the human-first product pitch
- `voiceover-script.md` — the narration

**Establish:**
1. What PAX does (audits PNR contact details, helps correct them)
2. Who uses it (passengers who booked through travel agents)
3. What problem it solves (agents putting their own contact in the PNR)
4. The strongest end-to-end journey (audit → consent → correct → verify → receipt)

**Find the intersection:** PAX's strongest technical capability (independent browser verification of contact persistence) + the user's most meaningful benefit (knowing the airline can reach them).

## 4. Creative Concept

**Human-first product story.** Open with the real failure (Abuja airport, May 27, 2026), introduce PAX as the answer, walk through the mechanism, land on the Drey moment (Kane catches false-save), close with honesty about the sandbox.

**Tone:** Conversational, confident, human. Not corporate. Not motivational. Not AI-generated. Like someone explaining something they genuinely believe is worth paying attention to.

**Runtime target:** 120–150 seconds (2–3 minutes)

## 5. The Six Acts (from `storyboard.md`)

| Act | Time | Purpose |
|-----|------|---------|
| 1. The dangerous default | 0:00–0:25 | Show the failure with numbers |
| 2. What PAX is | 0:25–0:50 | Introduce the product |
| 3. The mechanism | 0:50–1:30 | Show consent, correction, verify |
| 4. The Drey moment | 1:30–2:00 | Kane catches false-save (RED → GREEN) |
| 5. The honesty | 2:00–2:20 | Sandbox disclosure, limitations |
| 6. Close | 2:20–2:40 | Call to action, GitHub URL |

**Rule:** The video's numbers must equal the README's numbers. Re-record if they drift.

## 6. Recording Setup

### Prerequisites
- PAX dev server running: `npm run dev` (http://localhost:3000)
- Carrier Sandbox seeded: `npx tsx src/scripts/seed.ts`
- False-save bug active: `NEXT_PUBLIC_FALSE_SAVE_PNR=FS7777 npm run dev`
- Chrome browser for screen recording
- Microphone for voiceover (or synthetic voice if no human narrator available)

### Demo Environment Checklist
- [ ] PAX builds cleanly (`npx next build`)
- [ ] 9 vitest tests pass
- [ ] All 5 seeded PNRs load correctly
- [ ] No credentials, secrets, or personal info visible
- [ ] No developer tooling in frame
- [ ] Demo data is consistent across scenes

## 7. Motion Design Assets (already created)

Three HTML files in `production/motion/` that can be opened in a browser and screen-recorded:

| File | Purpose |
|------|---------|
| `kinetic-typography.html` | Animated text reveals: "Your flight is booked. But can the airline reach YOU?", "Nothing was saved. The green toast was a lie.", etc. |
| `interface-choreography.html` | Full PAX interface sequence: load booking → verify contacts → consent → verify → receipt |
| `drey-moment.html` | Terminal + browser false-save detection (RED exit 1 → GREEN exit 0) |

**Motion design rules:**
- Use intentional easing curves. No linear movement.
- Give motion anticipation and follow-through.
- Keep transitions consistent.
- Synchronize important movements with narration and sound.
- Preview and refine each animation before final rendering.
- Every animation must explain something or direct attention. No decorative motion.

## 8. Voiceover (from `voiceover-script.md`)

**Delivery requirements:**
- Conversational, not corporate
- Natural contractions, varied sentence lengths
- Pauses where they matter (after "It just wasn't you" and after the Kane FAIL)
- Emphasis on: "your own," "your email, your phone," "never saved," "really there"
- No hype words: no "revolutionary," "seamless," "game-changing"
- Human voice preferred. If synthetic, reject synthetic-sounding results.

**Generate narration in manageable sections** so delivery, pauses, and emphasis can be controlled. Listen to the finished voiceover before approving it.

## 9. Editing & Post-Production

### Tools
- **Capture:** Screen recording (Reelbird or equivalent), actual product interaction
- **Create:** Motion Canvas / Cavalry for custom animations
- **Composite & finish:** DaVinci Resolve 21 (final editing, compositing, color grading, sound)

### Workflow
1. Record screen footage of PAX against seeded sandbox PNRs
2. Record voiceover per `voiceover-script.md`
3. Edit in DaVinci Resolve
4. Add captions from `captions/captions.srt`
5. Add sound design (restrained ambient texture, key moment effects)
6. Export MP4, 1920×1080, 16:9, 30 FPS
7. Full playback quality inspection

### Sound rules
- Voiceover is the primary audio element
- Restrained music, ambient texture, occasional sound effects
- Sound reinforces important visual moments, not constant noise
- Clean dialogue, appropriate dynamic range, consistent loudness

## 10. Quality Control Checklist

Watch the complete exported video as a first-time viewer. **Reject if:**

- [ ] The opening is forgettable
- [ ] The product is difficult to understand
- [ ] The narration sounds AI-generated
- [ ] The presentation feels like a technical experiment
- [ ] The interface looks unfinished
- [ ] The story has no meaningful progression
- [ ] The video contains unnecessary dead time
- [ ] The product's most important capability is buried
- [ ] The outcome is unconvincing
- [ ] The ending is abrupt or generic

**Numbers audit:** Every number in the video must match the README. Re-record if they drift.

## 11. Final Output

Place in `production/exports/`:
- `product-demo.mp4` — final exported demonstration
- `voiceover-script.md` — already complete
- `storyboard.md` — already complete
- `captions.srt` — already complete in `production/captions/`

Then update `production/production-report.md` with final specs and commit everything.

---

## 12. What I Cannot Do Without You

**Kane CLI requires TestMu AI authentication.** The Drey moment (ACT 4) shows real Kane CLI runs with exit codes. To capture genuine RED→GREEN evidence:

```bash
kane-cli login --oauth          # Register on TestMu AI first, claim 10k credits
node scripts/kane-verify.mjs falseSave   # expect exit 1 (bug present)
# → fix persistence →
node scripts/kane-verify.mjs falseSave   # expect exit 0 (real persisted contact)
```

This evidence should be captured on screen for ACT 4 of the video. Without it, ACT 4 cannot show real Kane exit codes.

**Voice recording** also requires a microphone — I cannot generate audio in this environment.

---

**The creative standard:** Do not make this look like someone trying to prove they can build software. Make it look like someone introducing a product that deserves to exist. Make judges understand its usefulness, appreciate its execution, and become interested in what it could become.

**No generic AI slop. No recycled storytelling. No lifeless narration. No pointless cinematic effects. No feature-dumping.**
