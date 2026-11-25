# PAX — Production Report

## Deliverable
Product demonstration video for the Kane CLI Online Hackathon submission.

## Creative concept
**Human-first product story.** Not a technical explainer. Not a screen recording of coding. The video opens with the real failure (passengers stranded at Abuja airport because agents used their own contact details), introduces PAX as the answer, walks through the mechanism, lands on the Drey moment (Kane catches a false-save bug), closes with honesty about the sandbox limitation, and ends with a call to try it.

## User scenario demonstrated
A traveler books through an agent, the agent's contact is in the PNR instead of theirs, they arrive at the airport unaware of a disruption. PAX audits the PNR, flags the discrepancy, obtains consent, applies a correction, reloads the booking, and verifies the change persisted — then catches a deliberate false-save bug via Kane CLI.

## Key product capabilities shown
- Deterministic PNR contact audit (CTCE/CTCM/CTCR) with passengerRef association
- Consent-gated contact correction
- Independent read-back verification (no green toast accepted as proof)
- Kane CLI real-browser verification of the false-save bug (RED → GREEN closed loop)

## Final video specs (target)
- Format: MP4, 1920×1080, 16:9, 30 FPS
- Runtime: ~120–150 seconds
- Audio: Conversational human voiceover, captions synchronized
- Six acts matching `storyboard.md`

## Production assets
- `README.md` — human-first product pitch (claim → mechanism → evidence)
- `voiceover-script.md` — complete narration with delivery notes
- `storyboard.md` — scene-by-scene visual directions, audio/caption mapping
- `tests/kane/*.test.md` — 5 Kane CLI scenario objectives (the Drey moment is scenario 2)
- `scripts/kane-hook.mjs` / `kane-guard.mjs` / `kane-gate.mjs` — involuntary closed loop

## Limitations (honest)
- Video not yet rendered — requires screen recording of the running PAX app, voiceover recording/generation, and editing in DaVinci Resolve or equivalent
- Voiceover not yet recorded — script is complete, delivery notes included
- Captions not yet generated — storyboard provides the full caption text
- No motion graphics (Motion Canvas / Cavalry / Reelbird) produced yet — storyboard indicates where they would land
- Kane CLI flows not yet executed — requires TestMu AI authentication (`kane-cli login --oauth`)

## Next steps (requires user action)
1. Record screen footage of PAX running against the seeded sandbox PNRs
2. Record voiceover per `voiceover-script.md` (human delivery, not AI-rigid)
3. Edit in DaVinci Resolve, add captions, export MP4
4. Run Kane CLI flows to capture real RED→GREEN evidence for ACT 4
5. Commit `product-demo.mp4`, `captions.srt`, and voiceover audio to repo
