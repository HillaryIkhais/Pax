# CashCase — Rule & Source Registry

All regulatory claims in this product are traced to an official source. No LLM-invented regulations.

## Register format
Each entry: URL | Title | Retrieved date | Exact excerpt | Applicability

## CBN — Lodging a complaint (bank-first)
URL: https://www.cbn.gov.ng/FinInc/FinLit/LodgeComplaint.html
Title: Lodge a Complaint — Consumer Protection, Central Bank of Nigeria
Retrieved: 24 November 2026
Excerpt: The customer must first lodge the complaint with their financial institution (the bank), obtain a reference/tracking number, and wait two weeks before escalating to the CBN Consumer Protection Department if the matter remains unresolved.
Applicability: Defines the bank-first requirement, the reference/tracking number, and the two-week escalation window. CashCase enforces bank-first and does not offer CBN escalation before two weeks.

## CBN — Consumer Protection Department complaint management
URL: https://www.cbn.gov.ng/supervision/cpdcomgt.html
Title: Complaint Management — Consumer Protection Department, CBN
Retrieved: 24 November 2026
Excerpt: CBN supervises bank complaint handling; consumers escalate to the CBN Consumer Protection Department only after the bank's internal process and required waiting period.
Applicability: Confirms escalation is to the CBN Consumer Protection Department and is post-bank-process.

## CBN CCMS portal
URL: https://complaintsportal.cbn.gov.ng/
Title: CBN Complaints Management System (CCMS) Portal
Retrieved: 24 November 2026
Excerpt: The public portal says to allow 24 hours for the bank to upload the complaint after a reference is issued, then check the portal. Categories include ATM cash-dispense errors for own-bank and other-bank cases.
Applicability: Defines the 24-hour bank-upload delay and the CCMS status-lookup step modelled in MockCCMS.

## CBN CCMS categories
URL: https://complaintsportal.cbn.gov.ng/Categories
Title: Complaint Categories — CBN CCMS
Retrieved: 24 November 2026
Excerpt: Categories include ATM cash-dispense errors, split into own-bank and other-bank cases.
Applicability: CashCase uses own-bank / other-bank classification consistent with CCMS categories.

## FirstBank public complaint form (informational, competitive context)
URL: https://complaints.firstbanknigeria.com/
Title: FirstBank Complaints Portal
Retrieved: 24 November 2026
Excerpt: Banks already operate their own public complaint forms with reference-status lookup.
Applicability: CashCase does not replace bank channels; it produces an evidence-complete packet the customer takes to their bank. Link is informational only.

## Reechdesk (competitive context)
URL: https://app.reechdesk.com/
Title: Reechdesk — failed-transaction tickets & CBN SLA tracking
Retrieved: 24 November 2026
Excerpt: B2B workflow for banks/fintechs to automate failed-transaction tickets and CBN SLA tracking.
Applicability: Not a consumer-owned case workflow. CashCase differentiates on the consumer's evidence-complete, bank-first, status-verified path for the specific ATM "debited/no cash" event.

## Rule: two-week escalation window
Source: CBN Lodge a Complaint (above). The customer waits two weeks after lodging with the bank before CBN escalation. CashCase implements this exactly; no earlier escalation is offered.

## Rule: 24-hour CCMS upload check
Source: CBN CCMS portal (above). After a bank reference is issued, allow 24 hours for the bank to upload the complaint, then check the portal. Modelled as a separate step in MockCCMS and the state machine (WAITING_FOR_CCMS_UPLOAD).

## Rule: no universal 72-hour ATM resolution rule
CashCase does not claim a universal 72-hour ATM resolution rule. No current applicable official source was found for one. Only the CBN two-week escalation window and 24-hour CCMS upload check are used.

## Data-minimisation rule
CashCase never requests or stores PIN, token, OTP, password, BVN, full card number, or online banking credentials. Account numbers are masked.