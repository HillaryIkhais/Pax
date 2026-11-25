# Kane test: false-save bug detection (FS7777 / FALSE) — THE DREY MOMENT

## Objective
Open http://localhost:3000. Load booking FS7777 for surname FALSE in the Carrier Sandbox (set NEXT_PUBLIC_FALSE_SAVE_PNR=FS7777 to activate the seeded bug). Read the current CTCE email for passenger P1 (old@example.com). Apply an approved correction to change CTCE to new@example.com. Observe the green "Saved" toast. Then reload the booking in a fresh page and read the CTCE value afresh. Assert that the contact was NOT persisted (still old@example.com). Return FAILURE because the green toast hid a false save. This is the seeded bug that must fail verification.

## Variables
pnr: FS7777
surname: FALSE
airline: MockAir
passenger_ref: P1
email: new@example.com
phone: +2348000000001

## Acceptance criteria
- Portal returns green "Saved" toast (saved: false, falseSave: true in response)
- After reload, CTCE value is still old@example.com (not persisted)
- Kane returns failure because contact is absent after fresh read-back
- This test MUST fail against the buggy build; after the persistence fix, it MUST pass
