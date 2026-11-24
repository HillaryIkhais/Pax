# CashCase: duplicate submit must yield one case (idempotency)

## Objective
On MockBankDesk (http://localhost:3000/sandbox/bankdesk):
1. Submit a complaint: bank "FirstBank", amount debited ₦20,000, amount dispensed ₦0, ATM location "Lagos Island", transaction date/time "2026-11-20T10:00".
2. Record the reference returned.
3. Submit the SAME complaint again (same bank, amount, date/time).
4. Assert the response is a duplicate, returns the SAME reference, and does NOT create a new case.
5. Look up the reference and confirm exactly one case exists.

## Expected result
Duplicate clicks are idempotent: one complaint, one reference, one persisted case. No duplicate cases are created.
