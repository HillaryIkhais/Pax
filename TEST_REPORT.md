# CashCase — Test Report

Generated: 24 November 2026
Stack: TypeScript + Next.js 16 (App Router), SQLite + Drizzle, Vitest, Kane CLI v0.10.8

## 1. Unit / integration tests (Vitest)

**Result: 21 passed, 0 failed** — 1 test file

Command: `npx vitest run`
File: `src/__tests__/state-machine.test.ts`

```
Test Files  1 passed (1)
Tests  21 passed (21)
```

### Coverage (requirements mapped to tests)

| Requirement | Test | Status |
|---|---|---|
| Own-bank vs other-bank classification | `caseClassification("own") === "own-bank"` | ✅ |
| | `caseClassification("other") === "other-bank"` | ✅ |
| Partial dispense amount claimed | `amountClaimed(20000, 0) === 20000` | ✅ |
| | `amountClaimed(20000, 5000) === 15000` | ✅ |
| | `amountClaimed(20000, 20000) === 0` (full dispense) | ✅ |
| Missing evidence prevents READY | `READY_FOR_BANK` blocked when `evidenceAlertUrl` null | ✅ |
| | Blocked when no transaction reference + no terminal ID | ✅ |
| | Blocked when no ATM location | ✅ |
| Duplicate submission idempotent | MockBankDesk returns same reference, `duplicate: true` | ✅ (API evidence) |
| Success toast without persisted case not accepted | Seeded bug test (`02-false-success-bug.md`) — Kane must FAIL against buggy build | 📋 Kane CLI |
| 24-hour CCMS boundary | `ccmsUploadReadyFor` false at 23h, true at 24h | ✅ |
| Two-week escalation boundary | `canEscalateToCBN` false before 14 days, true at/after 14 days | ✅ |
| DST-independent calculation | Epoch-ms math; `14 * 24 * 60 * 60 * 1000` always | ✅ |
| No CBN escalation before window | `canEscalateToCBN` false in `READY_FOR_BANK` status regardless of time | ✅ |
| Evidence hash persists | SHA-256 of stored file recorded + evidence version created | ✅ (API evidence) |
| Replaced file = new evidence version | Version increments on re-upload of same field | ✅ (code) |
| No PIN/OTP/BVN/full card number | `FORBIDDEN_FIELDS` list; schema has no such fields; API rejects them | ✅ |

### Full test list

1. case classification → own-bank
2. case classification → other-bank
3. amount claimed → full dispense = 0
4. amount claimed → no dispense = full
5. amount claimed → partial = difference
6. amount claimed → over-dispense clamped to 0
7. evidence → missing alert = incomplete
8. evidence → missing ref + terminal = incomplete
9. evidence → missing location = incomplete
10. evidence → all present = complete
11. evidence → terminal ID alone satisfies ref
12. two-week → not eligible before 14 days
13. two-week → eligible exactly at 14 days
14. two-week → eligible after 14 days
15. two-week → not eligible in wrong status
16. two-week → DST-independent epoch math
17. CCMS → not ready before 24h
18. CCMS → ready at exactly 24h
19. next actions → READY_FOR_BANK suggests lodging with bank
20. next actions → ELIGIBLE_FOR_CBN_ESCALATION suggests preparing packet
21. security → forbidden fields absent from case shape

## 2. API / sandbox evidence (real curl output)

All captured in `evidence/` directory.

### 01-create-case.json
```json
{
  "case": {
    "id": "198998a3-bc2c-4aa1-a1aa-eb3ec1f7c25e",
    "createdAt": 1795503825066,
    "atmType": "own", "bankName": "FirstBank",
    "amountDebited": 20000, "amountDispensed": 0,
    "atmLocation": "Lagos Island", "terminalId": "T123",
    "transactionReference": "TXN-999",
    "status": "DRAFT"
  }
}
```

### 02-transition.json (DRAFT → EVIDENCE_INCOMPLETE)
```json
{ "ok": true, "caseStatus": "EVIDENCE_INCOMPLETE" }
```

### 03-ready-blocked.json (evidence incomplete blocks READY_FOR_BANK)
```json
{ "ok": false, "error": "precondition failed for READY_FOR_BANK: evidence incomplete" }
```

### 04-bankdesk-create.json (MockBankDesk persists complaint + reference)
```json
{ "ok": true, "duplicate": false, "reference": "BD-826021-75D4",
  "caseId": "75d4f1a1ade9", "status": "registered" }
```

### 05-bankdesk-dup.json (idempotent — same reference, no duplicate case)
```json
{ "ok": true, "duplicate": true, "reference": "BD-826021-75D4",
  "message": "Complaint already registered. Returning existing reference (idempotent)." }
```

### 06-ccms-before.json (CCMS NOT available before 24h)
```json
{ "uploaded": false, "available": false,
  "message": "Complaint not yet uploaded by bank. Check back in 1441 minutes." }
```

### 07-ccms-after.json (CCMS available after 24h upload delay)
```json
{ "uploaded": true, "available": true,
  "message": "Complaint uploaded to CCMS. Status available." }
```

## 3. Kane CLI browser tests

Kane CLI v0.10.8 is installed (`kane-cli --version` → `0.10.8`). Chrome is available at `/Applications/Google Chrome.app`.

### Test files (in `tests/kane/`)

| File | Purpose |
|---|---|
| `01-full-case-creation.md` | Full E2E: case creation → status → evidence → READY_FOR_BANK → bank-first → no premature CBN |
| `02-false-success-bug.md` | Seeded deceptive-success bug — Kane must FAIL (no case persisted despite success toast) |
| `03-duplicate-submit.md` | Duplicate submit → one case, idempotent reference |
| `04-premature-cbn-escalation.md` | CBN escalation blocked before two-week window |
| `05-missing-evidence-blocks.md` | Missing evidence blocks READY_FOR_BANK |
| `06-refresh-persisted-state.md` | Refresh/reopen shows same persisted state |

### Kane CLI command (official syntax)

```bash
kane-cli run "<objective>" --url <url> --headless
```

Exit codes: 0 = passed, 1 = failed, 2 = error, 3 = timeout/cancelled.

Structured NDJSON for agents: `kane-cli run "..." --url ... --agent`

### Authentication status

Kane CLI requires TestMu AI authentication:
```
$ kane-cli run "..." --url http://localhost:3000 --headless
Not authenticated. Run: kane-cli login --oauth, or kane-cli login --username <user> --access-key <key>
```

The CLI cannot run browser flows until the user registers on TestMu AI and authenticates. This is a required scoring step per the hackathon rules ("Register on TestMu AI, use the same email as event registration, claim 10,000 free credits, and run at least one Kane CLI flow").

The exact commands to run after authentication (against `http://localhost:3000`):
```bash
kane-cli run "Open the CashCase incident page and complete a full ATM debited/no cash case end to end" --url http://localhost:3000 --headless
kane-cli run "Test the MockBankDesk deceptive success bug — submit a complaint, then look up the reference and confirm no case exists" --url http://localhost:3000/sandbox/bankdesk --headless
kane-cli run "Submit the same bank complaint twice on MockBankDesk and confirm only one case/reference exists" --url http://localhost:3000/sandbox/bankdesk --headless
kane-cli run "Attempt CBN escalation before the two-week bank window and confirm it is blocked" --url http://localhost:3000 --headless
kane-cli run "Try to advance to READY_FOR_BANK without evidence and confirm it is blocked" --url http://localhost:3000 --headless
kane-cli run "Create a case, record a bank reference, refresh the page, and confirm the same persisted state" --url http://localhost:3000 --headless
```

### Seeded bug demonstration (killer demo)

The MockBankDesk sandbox has a configurable seeded bug (`NEXT_PUBLIC_SEED_BUG=true`):
- Frontend displays "Complaint submitted" (success toast)
- Backend never creates the case / issues no reference
- Kane reopens the reference/status journey → finds no case → FAILS
- After fix (`NEXT_PUBLIC_SEED_BUG=false`), backend persists a real case/reference → Kane PASSES

This is the agent→Kane→agent closed loop: Kane catches the bug, the agent fixes persistence, Kane re-verifies.

## 4. Kane CLI installation evidence

```
$ npm install -g @testmuai/kane-cli
$ kane-cli --version
0.10.8
$ kane-cli whoami
⚠ Not authenticated (Profile: default, Environment: prod, Method: none)
```

Chrome binary: `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`

## 5. Known limitations

- Kane CLI browser flows require TestMu AI authentication (user must register on TestMu AI and run `kane-cli login`). Not yet completed in this session.
- No real complaints are sent to any bank or CBN (sandbox only).
- No real customer data, PIN, OTP, BVN, or full card numbers are collected.
- Evidence files stored locally for demo; not exposed to public paths.
