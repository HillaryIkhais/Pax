# CashCase: deliberately false success-toast bug must FAIL

## Objective
This test validates the seeded deceptive-success bug in MockBankDesk.
1. Open http://localhost:3000/sandbox/bankdesk (with NEXT_PUBLIC_SEED_BUG=true).
2. Fill in the complaint form: bank "FirstBank", amount debited ₦20,000, amount dispensed ₦0, ATM location "Lagos Island".
3. Submit the complaint.
4. Observe the frontend displays "Complaint submitted" (a success toast).
5. Reopen the reference/status journey: look up the complaint by reference using the MockBankDesk lookup OR the MockCCMS lookup.
6. Assert that NO case exists / no reference was persisted (because the backend never created the case despite the success toast).

## Expected result
The test FAILS because the frontend shows a false "Complaint submitted" while the backend did not persist any case. Kane reopens the reference/status journey and finds no case. This is the seeded bug that the coding agent must fix.

## Notes
Run against the buggy build first (NEXT_PUBLIC_SEED_BUG=true). Kane must return exit code 1 (failed).
After the fix (NEXT_PUBLIC_SEED_BUG=false), rerun — Kane must return exit code 0 (passed) with a real persisted case/reference.
