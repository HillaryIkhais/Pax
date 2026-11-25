# Kane test: already correct contact (DX3456 / SANUSI)

## Objective
Open http://localhost:3000. Load booking DX3456 for surname SANUSI in the Carrier Sandbox. Read CTCE/CTCM for passenger P1. Confirm the contact already matches the passenger's verified details (halima.sanusi@example.com, +2348098765432). Confirm no unnecessary write occurs — no-op, PASS retained.

## Variables
pnr: DX3456
surname: SANUSI
airline: MockAir
passenger_ref: P1
email: halima.sanusi@example.com
phone: +2348098765432

## Acceptance criteria
- Overall audit result is REACHABLE
- PASSENGER_CONTACT_MATCH verdicts present for both CTCE and CTCM
- needsRepair is false
- No contact write is proposed or executed
