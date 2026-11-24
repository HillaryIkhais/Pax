# PAXREACH — Can the airline reach you?

When a flight is booked through a travel agent, the agent sometimes puts their own phone number and email into the airline booking record (PNR). The airline's operational updates (delay, cancellation, schedule change) reach the agent — **not the passenger**. The passenger arrives at the airport unaware of the disruption.

PAXREACH checks whether the airline's booking record actually contains the **passenger's own** verified contact details — and helps correct the record when it does not.

## One-line promise

Passenger identity → verify contact association → obtain consent → correct the record → independently read it back. PAXREACH proves the booking record contains the right passenger contact, independently verified with Kane CLI.

## The problem (real, documented)

On 27 May 2026, Nigeria's civil aviation authority warned that passengers arrived at Abuja airport unaware their flights had been disrupted because travel agents used their own contact details in PNRs.

Sources:
- https://www.premiumtimesng.com/business/business-news/883203-how-poor-communication-from-travel-agents-leaves-air-passengers-stranded-official.html
- https://portal.iata.org/faq/articles/en_US/FAQ/Are-airlines-storing-the-passengers-contacts-1448977354286/

## What PAXREACH does

1. Retrieve a PNR booking record (Carrier Sandbox for reproducible demos).
2. Read and normalise the contact SSRs: **CTCE** (email), **CTCM** (mobile), **CTCR** (declined).
3. Compare each adult passenger's verified contact against the SSR attached to **that passenger's reference** — never infer ownership from name or mere presence.
4. Show the exact discrepancy (agent-only contact, misassigned contact, missing channel, declined).
5. Require explicit passenger consent before writing any contact detail.
6. Apply the approved correction, reload the PNR in a fresh read, and verify the values persisted.
7. Issue an evidence receipt (before/after digest, timestamps, masked contacts, Kane evidence reference).

## This is not a flight tracker

TripIt and CheckMyTrip monitor/display itineraries. Neither audits or repairs the passenger contact details stored in the airline PNR. PAXREACH's missing primitive is passenger-level PNR contact assurance.

## The Drey moment (Kane CLI closed loop)

1. Kane opens a booking with the wrong passenger contact.
2. PAXREACH proposes a correction; the passenger approves it.
3. The portal shows a green `Saved` toast — but a deliberately injected backend bug prevents persistence.
4. Kane reloads the booking and discovers the contact was **never saved**.
5. The coding agent reads Kane's actual failure evidence, fixes the persistence path, reruns Kane.
6. Kane reopens the booking and verifies the corrected contact against the right passenger.

No green toast accepted as proof. No LLM declaring itself successful.

## Stack

- Next.js 16 + TypeScript (App Router)
- SQLite (local demo state, no managed DB)
- Drizzle ORM + Zod (schema/validation)
- libphonenumber-js (phone normalisation, E.164)
- Tailwind CSS (mobile-first, accessible contrast)
- Kane CLI (independent real-browser verifier)

No paid APIs, no frontier model required, no real airline integration claimed.

## Quick start

### Prerequisites
- Node.js 18+
- Google Chrome (required for Kane CLI)

### Install & run

```bash
npm install
npx tsx src/scripts/seed.ts     # seed the Carrier Sandbox (5 demo PNRs)
npm run dev                     # open http://localhost:3000
```

### Seeded demo bookings (Carrier Sandbox — clearly labelled, not a live airline)

| PNR | Surname | Scenario |
|-----|---------|----------|
| AX1234 | OKONKWO | Agent-only contact (agency email/phone) |
| BY5678 | ADEBAYO | Contact on wrong passenger (two adults) |
| CZ9012 | IBRAHIM | Passenger declined contact (CTCR) |
| DX3456 | SANUSI | Already correct (no change needed) |
| FS7777 | FALSE | False-save bug demo (Kane catches it) |

### Run unit tests

```bash
npx vitest run   # 9 passed, 0 failed
```

### Build

```bash
npm run build
```

## Kane CLI verification

Kane CLI (TestMu AI) runs real-browser flows and returns pass/fail. It is central to PAXREACH, not an afterthought.

### Install

```bash
npm install -g @testmuai/kane-cli
kane-cli --version   # 0.10.8
```

### Authenticate (required for scored runs)

```bash
kane-cli login --oauth          # or --username <user> --access-key <key>
kane-cli whoami
```

Register on TestMu AI with the same email used for event registration and claim the 10,000 free credits. Running at least one Kane CLI flow is required to be scored.

### Run a flow

```bash
kane-cli run "<objective>" --url http://localhost:3000 --headless
```

Exit codes: 0 = passed, 1 = failed, 2 = error, 3 = timeout/cancelled.

Structured NDJSON for AI coding agents: add `--agent`.

### Verification script

```bash
node scripts/kane-verify.mjs agencyOnly
# Scenarios: agencyOnly, misassigned, declined, alreadyCorrect, falseSave
```

The script:
1. Writes seeded PNR variables to `.testmuai/variables/paxreach-demo.json`
2. Runs `kane-cli run "..." --url ... --variables-file ... --agent --final-validation on --mode action --headless`
3. Captures NDJSON + exit code, saves raw evidence to `.testmuai/evidence/`
4. On `falseSave`, Kane returns failure (contact absent after reload)

### Kane test objectives (docs)

`docs/kane-scenarios.md` documents the natural-language objectives for each seeded scenario.

## Data model

Normalised SSR representation:
- `type`: CTCE | CTCM | CTCR
- `passengerRef`: P1, P2, ...
- `segmentRef` (optional)
- `value`, `sourceRecordId`, `rawSourceText`, `observedAt`

Audit verdicts: PASSENGER_CONTACT_MATCH, AGENCY_CONTACT_ONLY, MISSING_EMAIL, MISSING_MOBILE, MISASSIGNED_TO_OTHER_PASSENGER, MALFORMED_CONTACT, PASSENGER_DECLINED, RECORD_NOT_EXPOSED, UNKNOWN.

## Evidence & data minimisation

- Verified contacts are held in memory for the session; never emailed/SMS'd via a paid API.
- Contact values are masked in the UI and receipts (e.g. `b•••••s@okonkwo-travels.ng`, `••••0000`).
- No PNR, surname, phone, email, or access token is written to application logs or Git.
- The demo OTP/verification is clearly labelled local simulation — not a production identity service.

## Known limitations

- The reproducible demo uses a clearly labelled Carrier Sandbox. We do not claim live airline integration or guaranteed delivery of future airline messages.
- Kane CLI browser flows require TestMu AI authentication (`kane-cli login`).
- Automated updates to a real carrier Manage Booking page require a tested carrier adapter; otherwise the official Manage Booking link is provided and automated update is marked unsupported.

## Submission assets

- `PRODUCT_SPEC.md` — full product specification
- `SOURCES.md` — rule/source registry
- `DEMO_SCRIPT.md` — 3–5 minute demo walkthrough
- `TEST_REPORT.md` — real test + Kane evidence
- `docs/kane-scenarios.md` — Kane scenario objectives
