# Kane test: misassigned contact detection (BY5678 / ADEBAYO)

## Objective
Open http://localhost:3000. Load booking BY5678 for surname ADEBAYO in the Carrier Sandbox. Read CTCE/CTCM for passenger P1 (funke@example.com, +2348012345678) and passenger P2. Confirm P2's contact is actually P1's contact misassigned to P2's passengerRef. Propose P2's own verified contact (bola@example.com, +2348098765432) for P2. Require explicit approval. Apply the correction. Reload the booking in a fresh page. Verify P2 now has P2's contact and P1 retains P1's — no cross-assignment.

## Variables
pnr: BY5678
surname: ADEBAYO
airline: MockAir
passenger_ref: P2
email: bola@example.com
phone: +2348098765432

## Acceptance criteria
- P2 audit verdict includes MISASSIGNED_TO_OTHER_PASSENGER before correction
- After approved correction + reload, P2 CTCE equals {{email}} and P2 CTCM equals {{phone}}
- After reload, P1 CTCE still equals funke@example.com (no cross-assignment)
- Fresh read-back required; green toast not accepted as proof
