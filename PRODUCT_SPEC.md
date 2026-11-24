# CashCase — Product Spec

## One sentence
When an ATM debits a customer's account but dispenses no cash, CashCase turns the incident into a complete, evidence-checked bank complaint and a correctly timed escalation path — then independently verifies that each browser submission actually became a case.

## Problem
A customer withdraws ₦20,000 from an ATM. The account is debited. The ATM dispenses nothing (or partial cash). The customer is standing there, stressed, and does not know which details or proof to preserve, what to send the bank, or when CBN escalation becomes available.

## Target user & moment
Nigerian bank customers at the ATM, in the first minutes after a failed dispense. Guided incident intake in under two minutes. Mobile-first.

## Regulatory basis (CBN, Nigeria)
- Customer must first lodge the complaint with their financial institution and obtain a reference/tracking number.
- Wait two weeks before escalating to the CBN Consumer Protection Department if unresolved.
- CBN CCMS portal: allow 24 hours for the bank to upload the complaint after a reference is issued, then check the portal.
- CCMS categories include ATM cash-dispense errors (own-bank and other-bank).
Sources:
- https://www.cbn.gov.ng/FinInc/FinLit/LodgeComplaint.html
- https://www.cbn.gov.ng/supervision/cpdcomgt.html
- https://complaintsportal.cbn.gov.ng/
- https://complaintsportal.cbn.gov.ng/Categories

## What we are NOT
- Not replacing the CBN CCMS portal or a bank's own channel.
- Not a GuardianKane-style "agent says done, Kane checks it" dev extension.
- Not a demo recorder, escape room, or generic website test runner.
- Not claiming there are no alternatives. Differentiate on the consumer's evidence-complete, bank-first, status-verified path for the specific ATM "debited/no cash" event.
- Never send a real complaint to a bank or CBN. Sandbox sites are clearly labelled mock/local.

## Scope

### A. Incident intake (mobile-first)
Collect only:
1. Own-bank ATM or other-bank ATM.
2. Customer's bank name.
3. Transaction date/time and timezone.
4. Amount debited and amount actually dispensed (default zero; allow partial dispense).
5. ATM location, operator/bank if known, terminal ID if available.
6. Transaction reference if available.
7. Bank complaint reference after the customer has lodged it.
8. Evidence attachment: transaction alert or statement excerpt; optional receipt/photo.

Security: Never request/store PIN, token, OTP, password, BVN, full card number, or online banking credentials. Mask account numbers. Evidence files stored locally; hash each original attachment; never expose private uploads to public paths.

### B. Evidence completeness engine
- Show the precise missing items before a case is marked ready.
- Do not infer terminal ID or transaction reference from thin air.
- Allow manual corrections to OCR/extracted values.
- Every extracted field retains its source attachment and page/region.

### C. CBN-aligned case state machine
DRAFT → EVIDENCE_INCOMPLETE → READY_FOR_BANK → BANK_COMPLAINT_SUBMITTED → BANK_REFERENCE_RECORDED → WAITING_FOR_CCMS_UPLOAD → BANK_RESOLUTION_WINDOW → ELIGIBLE_FOR_CBN_ESCALATION → CBN_ESCALATION_PREPARED → RESOLVED / DISPUTED.

- A success toast without a persisted case + reference is NOT accepted.
- Bank-first: must not escalate to CBN prematurely.
- Two-week guidance used exactly as written; 24-hour CCMS upload check as a separate step.
- No universal 72-hour ATM resolution rule unless independently verified from an official source.

### D. Complaint packet
Concise, editable complaint document: date/time, amount, ATM location/terminal, transaction reference, cash dispensed/not dispensed, requested remedy, evidence index. Source links + bank-first instructions. Copy/export + official bank-channel link.

### E. Browser-verifiable sandbox
Two clearly labelled local sandbox sites:
1. MockBankDesk — bank complaint portal with form, required fields, duplicate detection, persisted case/reference.
2. MockCCMS — regulator status lookup that only exposes a complaint after the bank-upload delay (24h simulated) and requires the original bank reference.
Demo uses synthetic data only. Real CBN/bank links are informational.

### F. Kane CLI closed loop
1. Agent implements a milestone.
2. Agent invokes Kane CLI with a natural-language E2E journey on the real browser.
3. Kane returns evidence + pass/fail.
4. Agent reads failure, changes implementation, reruns Kane.
5. Passing result tied to build/revision, stored with run evidence.
Official syntax: `kane-cli run "objective" --url <url>` (JSON stdout, exit codes 0/1/2/3). No invented flags.

### G. Killer demonstration: deliberately deceptive success
Seed a bug where MockBankDesk frontend shows "Complaint submitted" but backend fails before creating the case. Kane reopens reference/status journey and fails because no case exists. Agent fixes persistence, reruns same journey, Kane verifies a real persisted case/reference.

Then demonstrate:
- Bank-first route selected.
- Missing evidence blocks submission.
- One completed bank complaint persists and returns a reference.
- Duplicate clicks are idempotent (one case).
- CBN lookup shows no case before 24h upload simulation.
- CBN escalation not enabled before two-week bank window.
- Once eligible, escalation packet includes bank reference + proof of initial complaint.

## Technical design
- TypeScript + Next.js App Router, mobile-first responsive UI.
- SQLite + Drizzle ORM (simplest reliable local choice).
- Zod schemas for all inputs and state transitions.
- Deterministic deadline/eligibility rules. Timestamps in UTC, displayed in WAT (UTC+1).
- Evidence files stored locally, hashed, metadata recorded.
- Local test clock / time-travel switch (demo moves forward 24h and 14 days without waiting).
- Rule/source registry: URL, title, retrieved date, exact excerpt, applicability. No LLM-invented regulations.
- Optional local-model extraction adapter (user confirms); product works with no model running.
- No paid API, no bank API, no external sending, no real customer info.

## Visual product bar
One strong incident screen:
- Top: "ATM debited you, but no cash came out?"
- Left/primary: incident facts + evidence checklist.
- Right/timeline: next required action, deadline, reference, status.
- Obvious "What happens next?" summary.
- Accessible contrast, excellent mobile layout, no decorative charts.

## Required tests (unit/integration)
- Own-bank vs other-bank case classification.
- Partial dispense amount and amount claimed.
- Missing transaction reference/evidence prevents READY state.
- Duplicate submission is idempotent.
- Success toast without persisted case is not accepted.
- 24-hour CCMS check and two-week escalation boundaries, timezone/DST-independent.
- No CBN escalation before allowed window.
- Uploaded evidence hash persists; replaced files create new evidence version.
- No PIN/OTP/BVN/full card number accepted in schemas/logs.

## Kane browser tests
1. Full successful case creation and status lookup.
2. Deliberately false success-toast bug must fail.
3. Duplicate submit must still yield one case.
4. Premature CBN escalation must be blocked.
5. Missing evidence must block submission.
6. Refresh/reopen must show same persisted state.

## Submission assets
- Public README: 5-min setup, architecture, threat model, official-source links, known limitations, exact Kane use.
- DEMO_SCRIPT.md: 3–5 minute walkthrough.
- Test report with real command output + Kane evidence; no invented pass counts.
- Public GitHub repo (created on/after 12 Nov 2026).
- At least two genuinely different public posts.