# CashCase: refresh/reopen must show the same persisted state

## Objective
On the CashCase incident page (http://localhost:3000):
1. Create an incident and record a bank complaint reference (e.g. "REF-123456").
2. Advance to BANK_REFERENCE_RECORDED.
3. Note the case ID, bank reference, and status.
4. Refresh/reopen the page.
5. Assert the same case ID, bank reference, and status are shown (persisted state survives reload).
6. Confirm the timeline still shows the same next action.

## Expected result
The persisted case record survives refresh. Same case ID, reference, and status are displayed after reopen.
