<div align="center">
  <img src="https://github.com/HillaryIkhais/Pax/raw/main/public/pax-icon.svg" width="160" alt="PAX" />
  # PAX
  ### Your flight is booked. But can the airline reach **you**?
  <br/>
  <sub>A passenger-level PNR contact assurance tool, independently browser-verified with Kane CLI.</sub>
</div>

---

## The moment that made this necessary

You book a flight through a travel agent. The agent types their own phone number and email into the airline's booking record — not yours. The airline sends a delay, a schedule change, a cancellation. It lands in the agent's inbox. You show up at the airport unaware your flight has been disrupted.

This isn't hypothetical. On **May 27, 2026**, Nigeria's civil aviation authority warned that passengers arrived at Abuja airport having no idea their flights were disrupted — because travel agents had used their own contact details in the PNR.

The airline had a way to contact someone. It just wasn't the passenger.

---

## What PAX does

PAX checks whether the airline's booking record actually contains **your own** verified contact details — and helps correct the record when it does not.

It reads the contact fields airlines actually use: **CTCE** (email), **CTCM** (mobile), **CTCR** (declined). Then it compares what's on the record against what you've verified as your own — checking that the contact is attached to **your** passenger reference, not the agent's, and not another passenger's.

If something is wrong or missing, PAX shows you the exact discrepancy, asks for your consent, applies only the correction you approve — then reloads the booking in a fresh read to prove the change actually persisted. No green toast accepted as proof.

---

## Verify it in 60 seconds

```bash
# 1. Install and seed the demo (Carrier Sandbox — clearly labelled, not a live airline)
npm install
npx tsx src/scripts/seed.ts

# 2. Start the app
npm run dev

# 3. Open http://localhost:3000 and try these in order:
#   AX1234 / OKONKWO   → agent's contact on your PNR (flagged)
#   BY5678 / ADEBAYO   → your contact on the wrong passenger (flagged)
#   CZ9012 / IBRAHIM   → you declined contact (preserved, never written)
#   DX3456 / SANUSI    → already correct (no unnecessary write)
#   FS7777 / FALSE     → the Drey moment: Kane catches a green "Saved" toast that hid no persistence
```

**Expected:** PAX tells you exactly what's wrong, lets you approve a correction, then reloads the booking to verify it stuck. Every claim above is reproducible with one command.

---

## The Drey moment (the Kane CLI closed loop)

PAX is built to be verified, not just demonstrated.

1. Kane opens a booking with the wrong passenger contact.
2. PAX proposes a correction; you approve it.
3. The portal shows a green `Saved` toast — but a deliberately injected backend bug prevents persistence.
4. Kane reloads the booking in a fresh browser read and discovers the contact was **never saved**. Kane returns failure.
5. The coding agent reads Kane's actual failure evidence, fixes the persistence path, reruns Kane.
6. Kane reopens the booking and verifies the corrected contact against the right passenger.

No green toast accepted as proof. No LLM declaring itself successful.

**Kane CLI** is not a logo tacked on at the end. It's the verification layer that closes the loop: agent builds → Kane verifies → agent re-prompts from Kane's failure evidence → Kane re-verifies. That's the loop this submission is scored on.

---

## What's real vs what's simulated

| Claim | Status | Evidence |
|-------|--------|----------|
| Deterministic contact audit (CTCE/CTCM/CTCR) | Real | `src/lib/audit/engine.ts`, 9 unit tests pass |
| Consent-gated contact write | Real | API requires `approved: true`; never writes without it |
| CTCR refusal preserved | Real | `PASSENGER_DECLINED`, `needsRepair: false` |
| False-save bug caught by Kane | Fixture (sandbox) | `FS7777` seeded scenario; Kane run required (see below) |
| Live airline integration | **Not built** | Disclosed. Carrier Sandbox is a local simulation, not a live airline |
| Guaranteed message delivery | **Not claimed** | PAX proves the record contains your contact; it does not guarantee future airline SMS/email |

---

## Sponsor integration: Kane CLI (load-bearing)

| Primitive | Role in PAX | File |
|-----------|-------------|------|
| `kane-cli run --agent --final-validation on --mode action` | Real-browser reload-and-verify of the corrected contact | `scripts/kane-hook.mjs`, `tests/kane/*.test.md` |
| NDJSON `run_end` verdict + exit codes | Parsed programmatically; drives agent re-prompt | `scripts/kane-hook.mjs` |
| Sealed evidence pack | Saved per flow to `.testmuai/evidence/` | `scripts/kane-hook.mjs` |

Kane CLI is load-bearing, not decorative. Without it, there is no independent verification of whether a contact actually persisted.

---

## Engineering decisions (the bugs we actually found)

1. **Check-then-act on contact writes** — Early draft read the PNR, then wrote the correction. Race condition: two corrections could overwrite each other. Fixed with an atomic upsert keyed on `(pnr, passengerRef, ssrType)`.
2. **Green toast ≠ persistence** — The false-save scenario (FS7777) shows "Saved" but never writes. This is the seeded bug Kane is designed to catch. It demonstrates why PAX reloads the booking in a fresh read instead of trusting the frontend response.
3. **Agent contact ownership** — Never infer that a contact is the passenger's from the name or mere presence in the PNR. `auditPnrContact` compares actual CTCE/CTCM values to your separately verified values and checks `passengerRef` association.

---

## What the model does / never does

- **Does:** Helps draft objectives, explains discrepancies in plain language.
- **Never:** Decides reachability, computes pass/fail, states a number not in the record, or writes to the booking without explicit consent. The audit engine is a pure function with injected time; code decides, the model proposes.

---

## Known limits

- The reproducible demo uses a clearly labelled **Carrier Sandbox** (MockAir). No live airline integration exists or is claimed.
- Kane CLI browser flows require TestMu AI authentication (`kane-cli login`). You must register and run at least one Kane CLI flow to be scored.
- No real customer data: contact values are masked in UI and receipts (e.g. `b•••••s@domain`, `••••0000`).

---

## Run it locally

```bash
git clone https://github.com/HillaryIkhais/Pax.git
cd Pax
npm install
npx tsx src/scripts/seed.ts     # seeds 5 demo PNRs
npm run dev                     # http://localhost:3000
npx vitest run                  # 9 passed, 0 failed
npx next build                  # clean build
```

**Live demo / Kane verification:** Requires TestMu AI authentication. Register, claim credits, run `kane-cli login --oauth`, then execute the scenarios in `tests/kane/*.test.md`.

---

## Submission assets

- `PRODUCT_SPEC.md` — full product specification
- `SOURCES.md` — rule/source registry (NCAA warning, IATA PNR contacts, Airlink policy)
- `DEMO_SCRIPT.md` — 3–5 minute demo walkthrough
- `TEST_REPORT.md` — real test + Kane evidence
- `JUDGES.md` — attack lab + 20 judge answers
- `REAL_VS_MOCKED.md` — honesty table
- `tests/kane/*.test.md` — 5 Kane CLI scenario objectives
- `scripts/kane-hook.mjs` / `kane-guard.mjs` / `kane-gate.mjs` — involuntary closed loop

---

**Deadline:** November 26, 2026, 7:29 PM WAT.

**Repo:** https://github.com/HillaryIkhais/Pax.git

**Built for:** Kane CLI Online Hackathon by TestMu AI — Build it with any agent. Verify it with Kane. Ship in two weeks.

---

<p align="center">
  <b>Your flight is booked. Can the airline reach you?</b>
</p>
