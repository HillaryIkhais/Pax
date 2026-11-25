# WEDGE.md — Phase 0 Choose (enoch-mode)

Deadline: 26 Nov 2026, 7:29 PM WAT (~30 hours remaining). This is a 48-hour hackathon in its final stretch. Scope must freeze now.

## Event scoring

| Criterion | Score | Notes |
|---|---|---|
| Track fit (web + Kane verification) | High | Kane CLI v0.10.8 installed, Chrome available, app is Next.js |
| Sponsor surface (TestMu AI / Kane) | Medium-High | Kane CLI is the verifier; requires TestMu AI auth (not yet done — blocked) |
| Judgable depth | High | Deterministic audit + false-save bug Kane can catch on real browser |
| Demo reliability | High | Seeded sandbox PNRs; no live integration needed |
| Field size | Unknown | 69 teams in previous edition; 4 equally weighted dims, tie-breaks Verified then Closed loop |
| Time realism | Medium | ~30h left; must freeze scope and not start a new idea |

## Candidate ideas

### Candidate A — CashCase (ATM debited/no cash → CBN bank-first complaint)
Archetype: Verification gate / evidence-provenance.
- Real CBN bank-first process, 24h CCMS upload, 2-week escalation — all documented.
- False-success bug: MockBankDesk shows "Complaint submitted" but persists no case; Kane reloads reference/status and finds nothing → FAIL.
- State machine DRAFT→…→RESOLVED gives many verifiable states.
- Risk: User previously ruled out "GuardianKane-style: agent says done, Kane checks it" developer extension / complaint portal. CashCase is "agent builds complaint, Kane verifies bank submission" — structurally close to GuardianKane (2nd place previous edition). Generic complaint-portal risk.

### Candidate B — PAX (airline passenger contact assurance in PNR)
Archetype: Missing trust layer.
- Documented real problem: NCAA warned 27 May 2026 that agents put their own contact in PNRs; passengers arrive unaware of disruptions (Premium Times).
- SSR fields CTCE (email), CTCM (mobile), CTCR (declined) — IATA / carrier policy documented.
- False-save bug: portal shows green "Saved" but doesn't persist contact; Kane reloads PNR, finds old value → FAIL. Agent fixes persistence, Kane re-verifies → PASS.
- Multi-passenger misassignment (contact on wrong passengerRef) is a juicy verifiable bug.
- Not close to any previous winner (demo.studio, GuardianKane, KANE vs. ABLE).
- Risk: Must honestly disclose sandbox-only (no live airline integration).

### Candidate C — New idea (fresh)
Archetype: TBD.
- Risk: ~30h left is too little to spec + build + Kane-verify + demo + post from scratch. Starting over likely fails the Ships gate.

## Wedge test (kill anything needing 3+ integrations to mean something)

| Candidate | Integrations needed to mean something | Kill? |
|---|---|---|
| CashCase | Own app + Kane CLI (2) | No |
| PAX | Own app + Kane CLI (2) | No |
| Candidate C | TBD ≥3 likely | Yes (kill) |

## Nearest neighbors (why we're not them)

- demo.studio (1st): Kane as browser performer generating product demos. We are not a demo recorder.
- GuardianKane (2nd): agent claims done, Kane gates via real-browser test / PRD verification. We do not gate an agent's "done" claim; we verify a consumer outcome (contact in PNR / complaint persisted).
- KANE vs. ABLE (3rd): AI-generated escape room Kane plays. We are not a game/escape room.

## Failure story (with numbers)

Passenger books via agent. Agent enters their OWN email/phone in the PNR. Airline sends delay/cancellation notice → reaches agent, not passenger. NCAA (Nigeria) warned 27 May 2026: passengers arrived at Abuja airport unaware flights were disrupted. Two passengers, one booking: P1's contact attached to P2, or agency contact only. PAX proves whether the record contains the passenger's OWN contact — not just "an email somewhere."

## Invariant (one sentence, enforced in one place, attacked by a test)

**The airline booking record must contain the passenger's own verified contact attached to that passenger's PNR reference — never the agent's, never another passenger's, and never nothing when the passenger provided one.** Enforced in `src/lib/audit/engine.ts` (`auditPnrContact`), attacked by tests `MISASSIGNED_TO_OTHER_PASSENGER`, `AGENCY_CONTACT_ONLY`, `PASSENGER_DECLINED`, and Kane false-save scenario.

## Sponsor dependency

Kane CLI (TestMu AI) is load-bearing: it reloads the PNR in a real browser after an approved correction and verifies the contact persisted — the closed loop. Without Kane, there's no independent verification. Requires TestMu AI authentication (blocked until user logs in).

## Kill-check

- [x] Can state the invariant in one sentence
- [x] One real integration identifier (Kane session / evidence pack) will be displayed
- [x] One complete workflow a stranger finishes in under 60 seconds (load PNR → audit → see verdict)
- [x] Kane catches something meaningful (false-save: green toast, no persistence)
- [x] Agent → Kane → agent closed loop wired (scripts/kane-verify.mjs)
- [x] Not close to a previous winner
- [x] Does not need 3+ integrations

## Decision

**Build PAX.** It scores highest on the judging tie-breaks (Verified then Closed loop): the false-save Drey moment is clean and browser-verifiable, and it is not close to any previous winner. CashCase is killed because it is structurally too close to GuardianKane (complaint-portal verification gate). Candidate C is killed due to time.

Scope frozen. No new features after this point except hardening the false-save Kane loop and the demo.
