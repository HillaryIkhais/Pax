# PAX — Agent instructions (enoch-mode Phase 1)

Non-discoverable invariants, honesty rules, and task-level definition of done.
Every agent working on this repo must read this first.

## Invariants (must never be false — enforced in one place, attacked by tests)

1. **Contact belongs to the passenger, not the agent.** `auditPnrContact` never infers a contact is the passenger's from the name or mere presence in the PNR. It compares actual CTCE/CTCM values to the passenger's separately verified values and checks `passengerRef` association. `src/lib/audit/engine.ts` owns this; no other module re-implements contact-ownership logic.
2. **No write without consent + explicit approval.** The contact-update API (`/api/sandbox/pnr/[id]/contact`) requires `approved: true`. Nothing is written on a page load, a toast, or a model suggestion.
3. **CTCR refusal is preserved.** A passenger with `CTCR` (declined) never gets a contact written, never gets a repair proposal, and `needsRepair` is `false`.
4. **No green toast as proof.** A `saved: true` response is not accepted as verification. Kane must reload the booking in a fresh read and confirm persisted values match the passenger's verified details and correct passenger association.
5. **Deterministic code decides; the model proposes.** The audit engine is a pure function with injected time. No LLM decides reachability, coverage, or pass/fail. The model never states a number not in the record.
6. **No real customer data, no PIN/OTP/BVN/full card number.** The schema has no such fields; `FORBIDDEN_FIELDS` is enforced at the API layer. Contact values are masked in UI and receipts.

## Honesty rules

- Label REAL / DEMO / FIXTURE everywhere. The Carrier Sandbox is a FIXTURE (clearly labelled local simulation, not a live airline). Say so in the UI, README, and demo.
- Never fake a number, mode, or result. Test counts are written only after `npx vitest run` prints them. Kane exit codes are real; do not fabricate pass/fail.
- Ship an honesty table (`REAL_VS_MOCKED.md`) with `Real / Real but simplified / Fixture / Not built`. Candor buys more than polish.

## Definition of done (binary, per task)

A task is done only when:
- [ ] `npx next build` passes cleanly (TypeScript + turbopack)
- [ ] `npx vitest run` passes; the count is the actual printed count
- [ ] The behavior is exercised through a real endpoint (curl or browser), not just asserted in a unit test
- [ ] If it's a Kane-facing behavior, a Kane run was attempted and the exit code + evidence were saved to `.testmuai/evidence/`
- [ ] `REAL_VS_MOCKED.md` was updated if the claim's reality changed
- [ ] `node scripts/kane-gate.mjs` exits 0 (all Kane flows green) — the involuntary gate
- [ ] `scripts/kane-guard.mjs` protects test flows and evidence from writes

## Stop conditions

- Do not build the differentiator until M1–M3 exist (real integration identifier, attack lab, race test).
- Do not polish the UI before the mechanism is verified.
- Do not commit after the internal cutoff (6–10 hours before the Nov 26, 7:29 PM WAT deadline).

## Video production invariants (Phase 4 — Present)

1. **The video's numbers equal the README's numbers.** Every statistic, test count, and Kane exit code shown on screen must match `README.md` and `TEST_REPORT.md`. Re-record if they drift.
2. **No fake cursor, no edited results.** All product interaction is real. No post-production numbers.
3. **Captions for every claim.** Judges watch muted. All 33 caption entries in `production/captions/captions.srt` must be synchronized.
4. **The Drey moment is uncut.** ACT 4 (false-save RED → GREEN) shows real Kane CLI exit codes. No faking.
5. **Human voiceover, not AI-rigid.** Conversational pacing. See `voiceover-script.md` for delivery notes.
6. **Honesty first.** The sandbox limitation is stated explicitly in the video, not hidden.

## Video definition of done

- [ ] `product-demo.mp4` exported (1920×1080, 16:9, 30 FPS, ~120–150 seconds)
- [ ] `captions.srt` synchronized and verified
- [ ] Voiceover recorded and approved (human delivery, not robotic)
- [ ] ACT 4 shows real Kane CLI exit codes (RED exit 1 → GREEN exit 0)
- [ ] Every on-screen number matches `README.md` and `TEST_REPORT.md`
- [ ] Video uploaded to YouTube, link tested in incognito
- [ ] Video linked from README and submission form

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
