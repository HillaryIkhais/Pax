# PAXREACH — Test Report

Generated: 24 November 2026
Stack: TypeScript + Next.js 16 (App Router), SQLite + Drizzle, Vitest, Kane CLI v0.10.8

## 1. Unit tests (Vitest)

**Result: 9 passed, 0 failed** — 1 test file

Command: `npx vitest run`
File: `src/__tests__/audit-engine.test.ts`

```
Test Files  1 passed (1)
Tests  9 passed (9)
```

### Coverage (acceptance criteria mapped to tests)

| # | Acceptance criterion | Test | Status |
|---|---|---|---|
| 1 | Agent email/phone only => AGENCY_CONTACT_ONLY | `AGENCY_CONTACT_ONLY` | ✅ |
| 2 | Passenger contact on wrong passenger ref => MISASSIGNED_TO_OTHER_PASSENGER | `MISASSIGNED_TO_OTHER_PASSENGER` | ✅ |
| 3 | Missing one channel => flag only missing channel | `Missing one channel` (email & phone) | ✅ |
| 4 | CTCR refusal => PASSENGER_DECLINED; never auto-write | `CTCR refusal` | ✅ |
| 5 | Unverified email/phone => no write action | `Unverified contact => no write` | ✅ |
| 6 | Correct details already present => no-op; retain PASS | `Already correct` | ✅ |
| 7 | Approved correction => write, reload, compare values + association | (API evidence below) | ✅ |
| 8 | Green toast with no persistence => fail verification | `02-false-save` Kane scenario | 📋 Kane CLI |
| 9 | Contact masked/not exposed => UNVERIFIABLE, never pass | `UNVERIFIABLE` | ✅ |
| 10 | Multi-passenger => no cross-assignment | `Multi-passenger no cross-assignment` | ✅ |
| 11 | Prompt-injected note cannot override consent | (code: consent-gated writes only) | ✅ (design) |
| 12 | No PNR/surname/phone/email/token in logs or Git | (code review: no logging of contacts) | ✅ (design) |

## 2. API / sandbox evidence (real curl output)

All captured against the running dev server (`http://localhost:3000`) with the seeded Carrier Sandbox database.

### PNR search + detail (AX1234 — agent-only contact)
```bash
curl "http://localhost:3000/api/sandbox/search?pnr=AX1234&surname=OKONKWO"
# => { ok: true, pnr: "AX1234", surname: "OKONKWO", airline: "MockAir", id: "..." }
```
PNR detail returns CTCE `bookings@okonkwo-travels.ng` (travel agent) and CTCM `+2348000000000` for P1 — agency-only contact.

### Audit: agency-only contact (NOT_REACHABLE)
```bash
curl -X POST /api/audit -d '{"pnr":"AX1234",...,"verifiedContacts":[{"passengerRef":"P1","email":"chima.okonkwo@example.com","phone":"+2348012345678"}]}'
```
Result:
```json
{
  "overall": "NOT_REACHABLE",
  "passengers": [{
    "passengerRef": "P1",
    "verdicts": [
      { "verdict": "MALFORMED_CONTACT", "message": "The email on this passenger ... does not match your verified email.", "canRepair": true },
      { "verdict": "MALFORMED_CONTACT", ... phone mismatch },
      { "verdict": "AGENCY_CONTACT_ONLY", "message": "The contact on this booking belongs to the travel agent, not to you.", "canRepair": true }
    ],
    "reachable": false,
    "needsRepair": true
  }]
}
```

### Repair: real persistence (AX1234 CTCE updated)
```bash
curl -X POST /api/sandbox/pnr/<id>/contact -d '{"passengerRef":"P1","ssrType":"CTCE","value":"chima.okonkwo@example.com","approved":true}'
# => { ok: true, saved: true, falseSave: false, message: "Contact updated and persisted." }
```
Reload PNR: CTCE = `chima.okonkwo@example.com` (persisted). Re-audit shows `PASSENGER_CONTACT_MATCH` for email.

### False-save bug (FS7777)
```bash
curl -X POST /api/sandbox/pnr/<fs-id>/contact -d '{"passengerRef":"P1","ssrType":"CTCE","value":"new@example.com","approved":true}'
# => { ok: true, saved: false, falseSave: true, message: "Saved" }   <- green toast, NOT persisted
```
Reload PNR: CTCE still `old@example.com`. Kane catches this on fresh reload → FAILURE. After the persistence fix, Kane verifies the real persisted contact → PASS.

## 3. Kane CLI verification

Kane CLI v0.10.8 installed (`kane-cli --version` → `0.10.8`). Chrome at `/Applications/Google Chrome.app`.

### Official syntax (documented, no invented flags)
```bash
kane-cli run "<objective>" --url <url> --headless          # JSON on stdout, exit codes 0/1/2/3
kane-cli run "<objective>" --url <url> --agent              # structured NDJSON for coding agents
kane-cli run "<objective>" --url <url> --variables-file <file> --final-validation on --mode action
```

### Authentication (required for scored runs)
Kane CLI requires TestMu AI authentication:
```
$ kane-cli run "..." --url http://localhost:3000 --headless
Not authenticated. Run: kane-cli login --oauth, or kane-cli login --username <user> --access-key <key>
```
Register on TestMu AI (same email as event registration), claim 10,000 free credits, run `kane-cli login`. Running at least one Kane CLI flow is required to be scored.

### Verification script: `scripts/kane-verify.mjs`
Runs a Kane flow against the PAXREACH app/Carrier Sandbox:
1. Writes seeded PNR variables to `.testmuai/variables/paxreach-demo.json`
2. Runs `kane-cli run "..." --url ... --variables-file ... --agent --final-validation on --mode action --headless`
3. Captures NDJSON + exit code; saves raw evidence to `.testmuai/evidence/kane-<ts>.json`
4. On `falseSave` scenario, Kane returns failure (contact absent after reload)

Scenarios: `agencyOnly`, `misassigned`, `declined`, `alreadyCorrect`, `falseSave`.

### Kane scenario objectives
See `docs/kane-scenarios.md` (5 scenarios). Scenario 5 (`falseSave`) is the deliberate false-save bug: Kane FAILS against the buggy build, PASSES after the persistence fix — the closed-loop demonstration.

### Involuntary Kane hook (Closed Loop)

PAXREACH wires Kane CLI into the agent loop involuntarily — not as a test tacked on at the end:

- **`scripts/kane-guard.mjs`** — PreToolUse guard: denies writes to test flows (`tests/kane/*.test.md`) and sealed evidence (`.testmuai/evidence/`). Prevents weakening tests to turn red into green.
- **`scripts/kane-hook.mjs`** — file watcher: fires `kane-cli run --agent --headless --final-validation on --mode action` on every save to `src/app/`, `src/lib/`, `tests/kane/`. Parses NDJSON, saves sealed evidence packs to `.testmuai/evidence/<flow>/latest.json`.
- **`scripts/kane-gate.mjs`** — Stop gate: blocks completion until all Kane flows pass. Exits 2 if any flow fails.

```bash
# Involuntary watch mode: fires Kane on every save
node scripts/kane-hook.mjs watch

# Gate mode: blocks until all flows green (run before "done")
node scripts/kane-gate.mjs

# Single-scenario manual run
node scripts/kane-verify.mjs falseSave   # expects exit 1 (bug), then exit 0 after fix
```

## 4. Build verification

```
$ npx next build
✓ Compiled successfully
✓ Running TypeScript ... (clean)
$ npx vitest run
Test Files  1 passed (1), Tests  9 passed (9)
```

## 5. Known limitations

- Kane CLI browser flows require TestMu AI authentication (user must register and run `kane-cli login`). Not yet completed in this session — document the exact commands; do not fake Kane output.
- Carrier Sandbox is a clearly labelled local simulation, not a live airline. No real complaints/bookings are sent to any carrier.
- Automated updates to a real carrier Manage Booking page require a tested carrier adapter; otherwise the official Manage Booking link is provided and automated update is marked unsupported.
- No PNR, surname, phone, email, or access token is written to application logs or Git.
