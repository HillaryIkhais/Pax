# Kane test: agency-only contact detection (AX1234 / OKONKWO)

## Objective
Open http://localhost:3000. Load booking AX1234 for surname OKONKWO in the Carrier Sandbox. Read the CTCE email and CTCM mobile contact SSRs for passenger P1. Confirm the contact belongs to the travel agent (bookings@okonkwo-travels.ng), not the passenger. Verify PAXREACH reports P1 as NOT reachable with AGENCY_CONTACT_ONLY. Then enter the passenger's verified email chima.okonkwo@example.com and phone +2348012345678, approve the correction, reload the booking in a fresh page, and confirm the persisted contact fields match the passenger's verified details and correct passengerRef association. Do not accept a green "Saved" toast as proof — only a fresh read-back counts.

## Variables
pnr: AX1234
surname: OKONKWO
airline: MockAir
passenger_ref: P1
email: chima.okonkwo@example.com
phone: +2348012345678

## Acceptance criteria
- Overall audit result is NOT_REACHABLE before correction
- AGENCY_CONTACT_ONLY verdict is present
- After approved correction + reload, persisted CTCE equals {{email}}
- After approved correction + reload, persisted CTCM equals {{phone}}
- No green toast accepted as proof; fresh read-back required
