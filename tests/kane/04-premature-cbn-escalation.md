# CashCase: premature CBN escalation must be blocked

## Objective
On the CashCase incident page (http://localhost:3000):
1. Create an incident and advance it through the bank-first states to BANK_RESOLUTION_WINDOW.
2. Confirm the status is BANK_RESOLUTION_WINDOW (two-week bank window not elapsed).
3. Attempt to advance to ELIGIBLE_FOR_CBN_ESCALATION.
4. Assert the transition is BLOCKED: the two-week bank window has not elapsed.
5. Confirm the UI does not offer a CBN escalation button/action.
6. Confirm the next action says "Wait two-week bank window (not yet elapsed)".

## Expected result
CBN escalation is not enabled before the two-week bank resolution window. The transition to ELIGIBLE_FOR_CBN_ESCALATION fails. No premature escalation is possible.
