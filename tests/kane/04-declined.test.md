# Kane test: declined contact refusal preserved (CZ9012 / IBRAHIM)

## Objective
Open http://localhost:3000. Load booking CZ9012 for surname IBRAHIM in the Carrier Sandbox. Read the CTCR declined contact SSR for passenger P1. Confirm PAX reports PASSENGER_DECLINED and needsRepair is false. Confirm no contact write is proposed or executed for this passenger. The passenger relies on the agent for updates; that choice is respected.

## Variables
pnr: CZ9012
surname: IBRAHIM
airline: MockAir
passenger_ref: P1

## Acceptance criteria
- Overall audit result is DECLINED
- PASSENGER_DECLINED verdict is present for P1
- needsRepair is false
- No contact write action is proposed or available
