# CashCase: full successful case creation and status lookup

## Objective
On the CashCase incident page, complete a full ATM "debited/no cash" incident end to end:
1. Open http://localhost:3000
2. Select "Own-bank ATM", enter bank name "FirstBank", transaction date/time, amount debited ₦20,000, amount dispensed ₦0, ATM location "Lagos Island", terminal ID "T123".
3. Submit to create the incident draft.
4. Confirm the case status is DRAFT then EVIDENCE_INCOMPLETE.
5. Confirm the evidence checklist shows missing items.
6. Mark the case ready for bank.
7. Confirm status is READY_FOR_BANK.
8. Note the bank-first instruction: lodge with the bank, get a reference, wait two weeks before CBN.
9. Confirm CBN escalation is NOT enabled (two-week window not elapsed).
10. Confirm the persisted case record exists (refresh the page, same status/reference).

## Expected result
The incident case is created and persisted. Status advances DRAFT → EVIDENCE_INCOMPLETE → READY_FOR_BANK. Missing evidence blocks premature advancement. CBN escalation is not offered before the two-week window. Refreshing the page shows the same persisted state.
