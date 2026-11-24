# PAXREACH — Demo Script (3–5 minutes)

**YouTube demo:** 3–5 minutes. Walk through one complete "can the airline reach you?" contact assurance flow.

**Presenter setup:** `npm run dev` → `http://localhost:3000`. Carrier Sandbox is clearly labelled as a local simulation, not a live airline.

---

## 0:00–0:20 — The real failure (the problem)

**Say:** "You book a flight through a travel agent. The agent puts their own phone and email in the airline booking record. The airline sends a delay or cancellation notice — it reaches the agent, not you. You arrive at the airport unaware of the disruption."

**Show:** Premium Times headline (27 May 2026): Nigerian aviation authority warned passengers arrived at Abuja airport unaware their flights were disrupted because agents used their own contact details.

**Say:** "The airline has a way to contact someone. It may not be the passenger."

---

## 0:20–0:55 — The failure (seeded two-passenger booking)

**Open:** `http://localhost:3000`. Choose "BY5678 · ADEBAYO — Contact on wrong passenger (two adults)".

**Show:** PAXREACH loads the booking. The reachability audit shows:
- Passenger P1 (Funke): reachable — her email/phone are on P1.
- Passenger P2 (Bola): NOT reachable — P2's record shows Funke's contact (misassigned to the wrong passenger).

**Say:** "The contact exists in the PNR, but it's attached to the wrong passenger. The airline can reach Funke. It cannot reach Bola directly."

---

## 0:55–1:45 — The repair (consent + correction)

**Show:** Bola enters her own email and phone, verifies control of each channel (clearly labelled local demo verification). PAXREACH shows the discrepancy: "A contact matching yours is attached to a different passenger."

**Consent statement (plain language):** "You authorise these contact details to be shared with the airline for operational flight notifications only. Not for marketing." Bola approves.

**Show:** PAXREACH applies the correction — writes Bola's email/phone to P2's CTCE/CTCM.

---

## 1:45–2:30 — The Drey moment (Kane catches the false save)

**Switch to FS7777 (false-save bug demo, `NEXT_PUBLIC_FALSE_SAVE_PNR=true`).**

**Say:** "Here's the moment that makes this a KaneCLI entry. The portal shows a green 'Saved' toast — but a deliberately injected backend bug never writes the contact."

**Show:**
1. Apply an approved correction on FS7777 → green "Saved" toast appears.
2. **But** Kane reloads the booking in a fresh page and reads the contact afresh → still the OLD value.
3. Kane returns **FAILURE**. The deception is caught.

**Then the fix:**
- Coding agent reads Kane's failure evidence, fixes the persistence path.
- Rerun the same journey → Kane reloads, finds the new contact persisted → **PASS**.

**Say:** "No green toast accepted as proof. Kane verifies the business outcome, not just that a page loaded."

---

## 2:30–3:00 — Independent proof (read-back)

**Return to BY5678 after the fix.** Kane reopens the booking. P1 has P1's contact, P2 has P2's contact. No cross-assignment. PAXREACH issues the evidence receipt: before/after digest, timestamp, masked contacts, passenger association, Kane evidence reference.

**Say:** "The booking record now contains each passenger's own contact. Independently verified."

---

## 3:00–3:30 — Refusal handling (CTCR)

**Open:** CZ9012 · IBRAHIM (passenger declined contact).

**Show:** PAXREACH shows CTCR — passenger declined. PAXREACH preserves the refusal and does NOT write any contact. Explains the consequence (passenger relies on the agent for updates).

**Say:** "A passenger's refusal is respected. We never override it."

---

## 3:30–4:00 — Honest boundary

**Show:** The "already correct" booking (DX3456) — no unnecessary write, PASS retained.

**Say:** "This prototype proves the booking contact record in a reproducible, clearly labelled sandbox. We do not claim live airline integration or guaranteed delivery of future messages. Live carrier coverage requires a tested adapter."

---

## Timing checklist

| Segment | Time |
|---|---|
| The real failure / problem | 0:20 |
| The failure (misassigned contact) | 0:35 |
| The repair (consent + correction) | 0:50 |
| Drey moment: false save caught by Kane | 0:45 |
| Independent proof / receipt | 0:30 |
| Refusal handling (CTCR) | 0:30 |
| Honest boundary / close | 0:30 |
| **Total** | **~4:00** |
