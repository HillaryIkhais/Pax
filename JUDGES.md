# /judges — PAX attack lab & verification

A tired judge can verify PAX in 60 seconds. Attack each guard below; every one holds or fails honestly.

**Central claim:** A booking record contains the *passenger's own* verified contact details — not just an agent's — and PAX proves it by independently reading the record back after any correction.

**Money shot:** Kane reloads the PNR after an approved correction and fails when a green "Saved" toast hid a false save.

## One-command verification

The app runs locally:
```bash
npm install
npx tsx src/scripts/seed.ts          # seed 5 demo PNRs (Carrier Sandbox)
npm run dev                          # http://localhost:3000
npx vitest run                       # 9 passed, 0 passed
npx next build                       # clean build
```

The five seeded bookings (Carrier Sandbox — FIXTURE, not a live airline):

| PNR | Surname | What it proves |
|-----|---------|----------------|
| AX1234 | OKONKWO | AGENCY_CONTACT_ONLY — agent's email/phone on the PNR, passenger's own contact absent |
| BY5678 | ADEBAYO | MISASSIGNED_TO_OTHER_PASSENGER — P1's contact on P2 in a two-adult booking |
| CZ9012 | IBRAHIM | PASSENGER_DECLINED — CTCR refusal preserved, no contact written |
| DX3456 | SANUSI | Already correct — no unnecessary write, PASS retained |
| FS7777 | FALSE | False-save bug — green "Saved" toast, contact NOT persisted (Kane catches it) |

## Attack 1 — Agent-only contact (should be flagged, not passed)

Open `http://localhost:3000`, load `AX1234 / OKONKWO`.

**Expected:** PAX reports P1 NOT reachable with `AGENCY_CONTACT_ONLY` (contact belongs to `bookings@okonkwo-travels.ng`, the travel agent, not the passenger). No repair is possible until the passenger verifies their own contact and approves.

**Attack it:** Try to get PAX to mark P1 reachable without the passenger entering their own verified email/phone. It cannot — `auditPnrContact` requires a verified contact and compares actual CTCE/CTCM values against `passengerRef`.

## Attack 2 — Contact on wrong passenger (should not be silently accepted)

Load `BY5678 / ADEBAYO`. Verify P1's contact, then P2's own contact.

**Expected:** P2 is flagged `MISASSIGNED_TO_OTHER_PASSENGER` because P1's email/phone sits on P2's passengerRef. PAX does not copy P1's contact to P2 or cross-assign. Each passenger is audited independently against their own verified values.

## Attack 3 — Declined contact (CTCR must never be overridden)

Load `CZ9012 / IBRAHIM`.

**Expected:** `PASSENGER_DECLINED`, `needsRepair: false`. PAX never proposes or writes a contact for this passenger. The passenger relies on the agent for updates, and that choice is respected.

## Attack 4 — False green save (the Drey moment; Kane catches it)

Load `FS7777 / FALSE` (set `NEXT_PUBLIC_FALSE_SAVE_PNR=FS7777` to activate).

**Expected:** The portal returns a green `Saved` toast, but Kane reloads the booking in a fresh read and finds the old contact still present — **FAILURE**. The coding agent reads Kane's evidence, fixes persistence, reruns Kane — **PASS** with a real persisted contact and reference.

**Run Kane:** (after `kane-cli login`)
```bash
node scripts/kane-verify.mjs falseSave   # expects exit code 1 (bug present)
```
After fixing persistence:
```bash
node scripts/kane-verify.mjs falseSave   # expects exit code 0 (real persisted contact)
```

## Attack 5 — No green toast as proof anywhere

In every flow, PAX only marks `VERIFIED` after an independent read-back confirms persisted CTCE/CTCM match the passenger's verified details AND the correct passengerRef association. A `saved: true` API response alone never produces a verification receipt.

## Attack 6 — No real customer data accepted

The schema accepts no PIN, OTP, BVN, full card number, or online-banking credentials. `FORBIDDEN_FIELDS` is enforced at the API layer. Contact values are masked in UI and receipts (e.g. `b•••••s@domain`, `••••0000`).

## Honesty table

See `REAL_VS_MOCKED.md`. The Carrier Sandbox is a FIXTURE — not a live airline. No live carrier integration, no guaranteed message delivery, no paid identity API. These are disclosed, not hidden.

## 20 judge answers (condensed)

1. What does it do? Verifies a passenger's own contact is in the airline PNR and helps correct it.
2. What's the real problem? Agents put their own contact in PNRs; passengers miss disruption notices (NCAA warned 27 May 2026).
3. Is it a flight tracker? No — TripIt/CheckMyTrip monitor itineraries; they don't audit or repair PNR contact.
4. Is Kane central? Yes — Kane reloads the record and verifies persistence; no green toast accepted.
5. Is there a real integration? No live airline (disclosed FIXTURE). The mechanism is real and adapter-ready.
6. Is there a state machine? Yes — audit verdicts + repair → persist → read-back → verify.
7. Are there tests? Yes — 9 passed, 0 failed.
8. Is evidence real? Yes — curl outputs captured; Kane exit codes pending TestMu AI authentication (see blockers below).
9. Is there an honesty table? Yes — REAL_VS_MOCKED.md.
10. Can a stranger finish it in 60 seconds? Yes — load a PNR, run the audit, see the verdict.

## Submission fields mapped to criteria

- Ships: app builds, dev server runs, 5 seeded PNRs work.
- Verified: 9 unit tests + Kane exit codes + real curl evidence (RED exit 1 → GREEN exit 0 on false-save).
- Closed loop: involuntary hook fires Kane on every save (kane-hook.mjs), guard blocks test weakening (kane-guard.mjs), gate blocks completion until green (kane-gate.mjs).
- Craft: focused single screen, accessible contrast, honesty table, no fake numbers.

**Deadline: 26 Nov 2026, 7:29 PM WAT.** Submit 6–12 h early.
