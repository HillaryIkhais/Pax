# CashCase: missing evidence must block submission

## Objective
On the CashCase incident page (http://localhost:3000):
1. Create an incident draft with facts but NO evidence attachment and NO transaction reference/terminal ID.
2. Confirm the status is EVIDENCE_INCOMPLETE.
3. Confirm the evidence checklist shows the missing items (transaction alert/statement excerpt, transaction reference or terminal ID).
4. Attempt to advance to READY_FOR_BANK.
5. Assert the transition is BLOCKED: evidence is incomplete.
6. Confirm the UI does not allow "ready for bank" until evidence is added.

## Expected result
Missing evidence blocks the case from reaching READY_FOR_BANK. The checklist precisely shows what is missing.
