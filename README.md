# CashCase

When an ATM debits your account but dispenses no cash, CashCase turns the incident into a complete, evidence-checked bank complaint and a correctly timed CBN escalation path — then verifies each browser submission actually became a case.

**Nigerian consumer problem.** You withdraw ₦20,000. Your account is debited. The ATM dispenses nothing (or partial cash). CashCase guides you through one guided incident in under two minutes: what details to preserve, what to send your bank, and exactly when CBN escalation becomes available.

**Bank-first, per CBN guidance.** Lodge with your financial institution first, get a reference/tracking number, wait two weeks before CBN escalation. Allow 24 hours for the bank to upload to CCMS, then check the portal.

## Screenshots / one screen

- **Top:** "ATM debited you, but no cash came out?"
- **Left/primary:** incident facts + evidence checklist
- **Right/timeline:** next required action, deadline, reference, status
- **"What happens next?"** summary

## Official sources (never LLM-invented)

- CBN Lodge a Complaint: https://www.cbn.gov.ng/FinInc/FinLit/LodgeComplaint.html
- CBN Complaint Management: https://www.cbn.gov.ng/supervision/cpdcomgt.html
- CBN CCMS Portal: https://complaintsportal.cbn.gov.ng/
- CBN CCMS Categories: https://complaintsportal.cbn.gov.ng/Categories
- FirstBank complaints (informational): https://complaints.firstbanknigeria.com/

See `SOURCES.md` for the full rule/source registry with excerpts and applicability.

## What we do NOT do

- Do not replace the CBN CCMS portal or any bank channel.
- Do not send real complaints to a bank or CBN (sandbox only).
- Do not collect PIN, OTP, BVN, full card number, password, or online-banking credentials.
- Do not claim a universal 72-hour ATM resolution rule (no official source).
- Not a GuardianKane-style dev extension, escape room, demo recorder, or generic test runner.

## Quick start (5 minutes or less)

### Prerequisites
- Node.js 18+
- Google Chrome (required for Kane CLI)

### 1. Install dependencies

```bash
npm install
```

### 2. Run the dev server

```bash
npm run dev
# open http://localhost:3000
```

### 3. Run unit tests

```bash
npx vitest run
# 21 passed, 0 failed
```

### 4. Run the app

- `http://localhost:3000` — CashCase incident intake (mobile-first)
- `http://localhost:3000/sandbox/bankdesk` — MockBankDesk sandbox bank portal
- `http://localhost:3000/sandbox/ccms` — MockCCMS sandbox regulator lookup

### 5. Build

```bash
npm run build
```

## Demo clock / time-travel

On both the incident page and MockCCMS you can advance the demo clock by days (+1 day = CCMS 24h upload; +14 days = CBN two-week window) without waiting. This is for demo only.

## Kane CLI verification

Kane CLI (TestMu AI) runs real-browser end-to-end flows and returns pass/fail.

**Install:**
```bash
npm install -g @testmuai/kane-cli
kane-cli --version   # 0.10.8
```

**Authenticate (required):**
```bash
kane-cli login --oauth      # or --username <user> --access-key <key>
kane-cli whoami
```

**Run a flow:**
```bash
kane-cli run "<objective>" --url http://localhost:3000 --headless
```

Exit codes: 0 = passed, 1 = failed, 2 = error, 3 = timeout/cancelled.

Structured NDJSON for AI coding agents: add `--agent`.

### Kane test files

`tests/kane/*.md` — natural-language browser test objectives:

| File | What it verifies |
|---|---|
| `01-full-case-creation.md` | Full case creation → status → bank-first → no premature CBN |
| `02-false-success-bug.md` | Seeded deceptive-success bug — Kane FAILS (no case persisted) |
| `03-duplicate-submit.md` | Duplicate submit → one case (idempotent) |
| `04-premature-cbn-escalation.md` | CBN escalation blocked before two-week window |
| `05-missing-evidence-blocks.md` | Missing evidence blocks READY_FOR_BANK |
| `06-refresh-persisted-state.md` | Refresh/reopen shows same persisted state |

### Closed loop (agent → Kane → agent)

1. Agent implements a milestone.
2. Agent invokes `kane-cli run "..." --url ...` on the real browser.
3. Kane returns evidence + pass/fail.
4. Agent reads the failure, changes the implementation, reruns Kane.
5. Passing result tied to build/revision, stored with run evidence.

### Seeded bug (killer demonstration)

MockBankDesk has `NEXT_PUBLIC_SEED_BUG`:
- `true` — frontend shows "Complaint submitted" but backend never creates the case. Kane reopens the reference/status journey, finds no case → **FAIL**.
- `false` (after fix) — backend persists a real case + reference. Kane verifies → **PASS**.

This is the moment: Kane catches the deception, the agent fixes persistence, Kane re-verifies.

## Tech stack

- TypeScript + Next.js 16 App Router
- Tailwind CSS (mobile-first, accessible contrast)
- SQLite + Drizzle ORM (local reproducibility)
- Zod schemas for all inputs and state transitions
- lucide-react icons

## Data model (state machine)

```
DRAFT → EVIDENCE_INCOMPLETE → READY_FOR_BANK → BANK_COMPLAINT_SUBMITTED →
BANK_REFERENCE_RECORDED → WAITING_FOR_CCMS_UPLOAD → BANK_RESOLUTION_WINDOW →
ELIGIBLE_FOR_CBN_ESCALATION → CBN_ESCALATION_PREPARED → RESOLVED / DISPUTED
```

Timestamps stored in UTC (epoch ms), displayed in WAT (UTC+1). All deadline math is DST-independent.

## Evidence handling

- Evidence files stored under `data/evidence/<caseId>/` (not public paths).
- Each attachment hashed (SHA-256); hash + metadata recorded.
- Replaced files create a new evidence version (incrementing version number).
- Never expose private uploads to public paths.

## Threat model

| Threat | Mitigation |
|---|---|
| Real customer data collected | No PIN/OTP/BVN/full card/password fields; account numbers masked |
| Evidence tampering | SHA-256 hash recorded per version; originals retained |
| Premature CBN escalation | State machine blocks transition before two-week window |
| False success claims | Submission requires persisted case + reference; Kane verifies |
| Duplicate complaints | MockBankDesk duplicate detection by bank+amount+datetime |

## Known limitations

- Kane CLI browser flows require TestMu AI authentication (register on TestMu AI, claim credits, run `kane-cli login`).
- Sandbox sites (MockBankDesk, MockCCMS) are clearly labelled local simulations, not connected to any bank or CBN.
- No real complaints are sent to any bank or CBN.

## Submission assets

- `PRODUCT_SPEC.md` — product specification
- `SOURCES.md` — rule/source registry
- `DEMO_SCRIPT.md` — 3–5 minute demo walkthrough
- `TEST_REPORT.md` — real test + Kane evidence
- `tests/kane/*.md` — Kane browser test objectives
