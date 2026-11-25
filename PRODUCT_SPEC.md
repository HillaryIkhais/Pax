# PAX — Product Spec

## One sentence
When a flight is booked through a travel agent, PAX checks whether the airline's booking record contains the passenger's own verified contact details for operational updates — and helps correct the record when it does not.

## Problem (documented, real)
A passenger books through a travel agent. The agent puts their own phone/email in the PNR. Airline operational updates (delay, cancellation, schedule change) reach the agent, not the passenger. The passenger arrives at the airport unaware of the disruption.

On 27 May 2026, Nigeria's civil aviation authority warned passengers had missed operational updates because travel agents used their own contact details; passengers arrived at Abuja airport unaware their flights were disrupted.
Sources:
- https://www.premiumtimesng.com/business/business-news/883203-how-poor-communication-from-travel-agents-leaves-air-passengers-stranded-official.html
- https://portal.iata.org/faq/articles/en_US/FAQ/Are-airlines-storing-the-passengers-contacts-1448977354286/

## What we are NOT
- Not a flight tracker (TripIt, CheckMyTrip monitor/display itineraries; they don't audit or repair PNR contact details).
- Not a generic itinerary manager, booking verifier, chatbot, airline complaint portal, or QA dashboard.
- Not claiming live airline coverage unless tested. Carrier Sandbox is clearly labelled local simulation.
- Not claiming guaranteed delivery of future airline messages — only that the record contains the right passenger contact.

## Target user & moment
Passenger who booked via an agent, before/during travel, wants to confirm the airline can reach THEM directly. Guided flow in under two minutes.

## Core primitive (non-negotiable)
Verify passenger identity → verify contact association → obtain consent → correct the record → independently read it back.

## Airline standard contact SSR fields
- CTCE — email
- CTCM — mobile
- CTCR — passenger declined to provide contact
Sources: IATA passenger contacts FAQ; carrier reservations policies (e.g. Airlink, Iberia agency guidance).

## Scope

### A. Deterministic contact audit
Normalised SSR representation: type, passengerRef, segmentRef (optional), value, sourceRecordId, rawSourceText, observedAt.
Never infer a contact is the passenger's from the name or mere presence in the PNR. Compare actual CTCE/CTCM values to the passenger's separately verified values and check passenger association. Phone normalised to E.164 (libphonenumber-js); email lowercased/trimmed.
Verdicts: PASSENGER_CONTACT_MATCH, AGENCY_CONTACT_ONLY, MISSING_EMAIL, MISSING_MOBILE, MISASSIGNED_TO_OTHER_PASSENGER, MALFORMED_CONTACT, PASSENGER_DECLINED, RECORD_NOT_EXPOSED, UNKNOWN.

### B. Consent and contact ownership
Passenger enters their own email/phone and proves control of each channel (demo uses clearly labelled local OTP, no paid SMS/email API).
Plain-language consent statement before writing: passenger authorises sharing contact with the airline for operational notifications only. Not for marketing.

### C. Repair and verification loop
1. Retrieve PNR record in carrier portal/sandbox.
2. Read + normalise passenger/contact records.
3. Compare each adult passenger's expected contact vs CTCE/CTCM/CTCR.
4. Show exact discrepancy + proposed correction.
5. Require explicit user approval before writing.
6. Apply only approved correction.
7. Reload PNR in fresh browser session.
8. Re-read PNR. Mark verified ONLY if persisted contact fields match verified details + correct passenger association.
9. If fields masked/not exposed → UNVERIFIABLE; never infer success from a green toast.
10. Generate evidence receipt: before/after digest, timestamp, masked contacts, passenger association, source page, screenshots, Kane evidence reference.

### D. Carrier Sandbox (clearly labelled local sandbox)
Stateful local site behaving like a third-party airline Manage Booking page. Never presented as a live airline.
Seeded cases:
1. AGENT-ONLY CONTACT: PNR contact is agency email/phone; passenger's own contact absent.
2. WRONG PASSENGER ASSOCIATION: two-adult booking, one passenger's CTCE/CTCM attached to the other passenger ref.
3. EXPLICIT REFUSAL: CTCR for one passenger; preserve refusal, never auto-write.
4. ALREADY CORRECT: passenger contact correctly attached; no unnecessary write.
Plus deliberate false-save scenario: portal shows green "Saved" toast but backend does not persist. Kane must catch on fresh reload.

### E. Kane CLI closed loop (non-negotiable)
Agent implements milestone → invokes Kane CLI with natural-language E2E journey on real browser → Kane returns evidence + pass/fail → agent reads failure, changes implementation, reruns Kane → passing result tied to build/revision, stored with run evidence.
Official syntax: `kane-cli run "..." --url <url> --variables-file ... --agent --final-validation on --mode action` (NDJSON, exit codes 0/1/2/3). No invented flags.
Kane must verify the business outcome (contact persisted + correct association), not just page load.

### F. Deliberate false-save demonstration (the Drey moment)
Seeded bug: green "Saved" toast, no persistence. Kane reloads, finds contact absent → FAILS. Agent fixes persistence, reruns same journey, Kane verifies real persisted contact → PASSES.

### G. UI
Mobile-first, warm/calm editorial styling. One sharp question at top: "Your flight is booked. Can the airline reach YOU?" Passenger identity + flight summary, contact state per passenger, clear discrepancy reason, two-step correction preview + approval, before/after diff, verification receipt. Accessible contrast, no decorative charts.

## Technical design
- TypeScript + Next.js 16 App Router
- SQLite + Drizzle ORM (local reproducibility)
- Zod for input/state validation
- libphonenumber-js for phone normalisation
- Pure deterministic SSR parser/auditor module with unit tests
- Kane CLI invoked from Node spawn with argument array (no shell interpolation of user input)
- No paid LLM API; optional local model only for unstructured itinerary text, never decides reachability
- No paid API, no real airline integration claimed

## Tests (unit)
1. Agent email/phone only => AGENCY_CONTACT_ONLY
2. Passenger contact on wrong passenger ref => MISASSIGNED_TO_OTHER_PASSENGER
3. Missing one channel => flag only missing channel
4. CTCR refusal => PASSENGER_DECLINED; never auto-write
5. Unverified email/phone => no write action
6. Correct details present => no-op; retain PASS
7. Approved correction => write, reload, compare exact values + association
8. Green toast with no persistence => fail verification
9. Contact masked/not exposed => UNVERIFIABLE, never pass
10. Multi-passenger => no cross-assignment
11. Prompt-injected booking note cannot override consent or request unrelated data
12. No PNR/surname/phone/email/access token in logs or Git

## Kane browser tests
`docs/kane-scenarios.md` (5 scenarios incl. false-save fail-then-pass).

## Submission assets
- README (5-min setup, architecture, threat model, official sources, limitations, exact Kane use)
- DEMO_SCRIPT.md (3–5 min walkthrough)
- TEST_REPORT.md (real command output + Kane evidence; no invented pass counts)
- Public GitHub repo initialised on/after 12 Nov 2026
- TestMu AI account registered (same email as event registration), 10k credits claimed, ≥1 Kane CLI flow run
- 3–5 minute YouTube demo
- ≥2 genuinely different public posts
