# CashCase — Demo Script (3–5 minutes)

**YouTube demo:** 3–5 minutes. Walk through one complete ATM "debited/no cash" incident end to end.

**Presenter setup:** `npm run dev` → `http://localhost:3000`. Have the demo clock visible.

---

## Minute 0–0:30 — The moment

**Say:** "You withdraw ₦20,000 from an ATM. Your account is debited. The ATM dispenses nothing. You're stressed. What do you preserve? Who do you complain to? When can you escalate to CBN?"

**Show:** CashCase incident page opens on: "ATM debited you, but no cash came out?"

**Key point:** No long FAQ. One guided flow, under two minutes.

---

## Minute 0:30–1:30 — Incident intake (mobile-first)

**Actions (click through):**
1. ATM type: Own-bank ATM
2. Your bank: FirstBank
3. Transaction date/time: today
4. Amount debited: ₦20,000
5. Amount dispensed: ₦0 (default)
6. ATM location: Lagos Island
7. Terminal ID: T123 (optional)
8. Click "Start incident"

**Show:** Case created, status DRAFT → EVIDENCE_INCOMPLETE.

**Evidence checklist (show missing):**
- ✗ Transaction alert or statement excerpt
- ✗ Transaction reference or terminal ID (we have terminal ID)
- ✓ ATM location

**Say:** "Nothing is inferred. The checklist tells you exactly what's missing. You can't mark it ready for the bank until evidence is complete."

---

## Minute 1:30–2:30 — Bank-first route

**Say:** "Per CBN, you must complain to your bank first and get a reference. CashCase does not let you escalate to CBN prematurely."

**Show:**
- Timeline: "Lodge complaint with your bank and get a reference"
- Amount claimed: ₦20,000 (debited − dispensed)
- "What happens next?" panel lists the bank-first steps

**Key point:** Bank-first. No CBN escalation button yet. Two-week window not elapsed.

---

## Minute 2:30–3:00 — MockBankDesk sandbox (simulated bank portal)

**Open:** `http://localhost:3000/sandbox/bankdesk`

**Say:** "This is a clearly labelled sandbox — not a real bank. It simulates the bank's complaint portal."

**Actions:**
1. Submit a complaint (same facts)
2. Show: "Complaint registered — Reference BD-XXXX-XXXX"
3. Submit the SAME complaint again → shows "Duplicate — existing case returned, same reference" (idempotent)
4. Look up by reference → case found

**Say:** "One complaint, one reference, no duplicates. Idempotent."

---

## Minute 3:00–3:45 — Killer demo: deceptive success caught by Kane

**Open:** `http://localhost:3000/sandbox/bankdesk` with `NEXT_PUBLIC_SEED_BUG=true`

**Say:** "Here's the killer demo. We seed a bug: the frontend shows 'Complaint submitted' but the backend never creates the case."

**Actions:**
1. Submit a complaint → green "Complaint submitted" toast appears
2. **But** Kane reopens the reference/status journey → looks up the reference → finds NO case
3. Kane FAILS. The deception is caught.

**Then (the fix):**
- Switch `NEXT_PUBLIC_SEED_BUG=false`, rebuild
- Resubmit → real case persisted, real reference issued
- Kane re-verifies → PASSES

**Say:** "This is the agent → Kane → agent closed loop. Kane catches the bug. The agent fixes persistence. Kane re-verifies a real persisted case."

---

## Minute 3:45–4:30 — CCMS 24-hour check and CBN two-week window

**Open:** `http://localhost:3000/sandbox/ccms`

**Actions:**
1. Look up the bank reference BEFORE 24h → "Complaint not yet uploaded by bank" (24h delay)
2. Advance demo clock +1 day → "Complaint uploaded to CCMS. Status available."

**Back on incident page:**
1. Advance demo clock +14 days
2. Status reaches ELIGIBLE_FOR_CBN_ESCALATION
3. CBN escalation button now enabled
4. Escalation packet includes bank reference + proof of initial complaint

**Say:** "24-hour CCMS upload check, then two-week bank window. CBN escalation only after both. Exactly as CBN guidance says."

---

## Minute 4:30–5:00 — Closing

**Show:**
- Persisted case record survives refresh
- Official-source links (CBN Lodge a Complaint, CCMS portal)
- "What happens next?" summary
- Data minimisation: no PIN, OTP, BVN, full card number collected

**Say:** "CashCase: evidence-checked bank complaint, correctly timed CBN escalation, independently browser-verified. Bank-first. Consumer-owned."

---

## Timing checklist

| Segment | Time |
|---|---|
| The moment / problem | 0:30 |
| Incident intake + evidence | 1:00 |
| Bank-first route | 1:00 |
| MockBankDesk sandbox + idempotency | 0:30 |
| Deceptive-success killer demo | 0:45 |
| CCMS 24h + CBN 2-week | 0:45 |
| Closing | 0:30 |
| **Total** | **~5:00** |
