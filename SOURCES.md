# PAXREACH — Rule & Source Registry

All product claims are traced to an official source. No LLM-invented regulations.

## Register format
Each entry: URL | Title | Retrieved date | Exact excerpt | Applicability

## Nigerian civil aviation authority warning (27 May 2026)
URL: https://www.premiumtimesng.com/business/business-news/883203-how-poor-communication-from-travel-agents-leaves-air-passengers-stranded-official.html
Title: How poor communication from travel agents leaves air passengers stranded — official (Premium Times)
Retrieved: 24 November 2026
Excerpt: Nigeria's aviation regulator warned that many passengers had missed operational updates because travel agents used their own contact details; passengers arrived at Abuja airport unaware their flights had been disrupted.
Applicability: Documents the real-world problem PAXREACH solves — agent contact details in the PNR instead of the passenger's.

## IATA — Are airlines storing the passengers' contacts?
URL: https://portal.iata.org/faq/articles/en_US/FAQ/Are-airlines-storing-the-passengers-contacts-1448977354286/
Title: Are airlines storing the passengers' contacts? (IATA portal FAQ)
Retrieved: 24 November 2026
Excerpt: IATA explains that the airline uses the contact information stored in the PNR for operational notifications.
Applicability: Confirms the PNR contact is what the airline uses for operational notifications — so the passenger's own contact must be in the PNR and attached to the right passenger.

## Airlink — Reservations Policy (V6, AUG 2025)
URL: https://www.flyairlink.com/sites/default/files/images/Airlink%20Reservations%20Policy_V6_AUG_2025compressed2.pdf
Title: Airlink Reservations Policy
Retrieved: 24 November 2026
Excerpt: The adult passenger's own mobile and email must be in the PNR; passengers without the relevant contact SSRs are not notified directly and must rely on the travel agent.
Applicability: Grounds the requirement that the passenger's own mobile + email belong in the PNR.

## Iberia — agency guidance (SSR fields)
URL: https://www.iberia.com (agency guidance, referenced via IATA/contact SSR documentation)
Title: Iberia agency contact SSR guidance
Retrieved: 24 November 2026
Excerpt: Identifies the relevant SSR fields: CTCE for email, CTCM for mobile, and CTCR where the passenger refuses to provide contact details.
Applicability: Defines the contact SSR field names PAXREACH audits (CTCE, CTCM, CTCR).

## Competitive context (informational)
- TripIt Pro (flight alerts): https://help.tripit.com/en/support/solutions/articles/103000063296-flight-alerts ; https://tripit.freshdesk.com/en/support/solutions/articles/103000063368-flight-not-monitored
- CheckMyTrip FAQ: https://checkmytrip.com/frequently-asked-questions/
- Ibom Air ticket change policy (Manage Booking contact change): https://www.ibomair.com/travel-information/ibom-air-ticket-change-policy/
Applicability: Adjacent products monitor/display itineraries but do not audit or repair passenger PNR contact details. PAXREACH fills that gap.

## Data minimisation rule
PAXREACH never requests or stores payment, passport, or credential data. Contact values are masked in UI/receipts. Demo verification uses a clearly labelled local simulation (not a production identity service).

## No universal delivery guarantee
PAXREACH does not claim guaranteed delivery of future airline SMS/email. It proves the booking record contains the right passenger contact at time of verification.
