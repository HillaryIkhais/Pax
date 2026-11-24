/* ------------------------------------------------------------------ */
/* Rule / source registry                                             */
/*                                                                     */
/* Every regulatory claim is traced to an official source.             */
/* No LLM-invented regulations.                                        */
/* ------------------------------------------------------------------ */

export type RuleSource = {
  id: string;
  url: string;
  title: string;
  retrieved: string; // ISO date
  excerpt: string;
  applicability: string;
};

export const RULE_SOURCES: RuleSource[] = [
  {
    id: "cbn-lodge-complaint",
    url: "https://www.cbn.gov.ng/FinInc/FinLit/LodgeComplaint.html",
    title: "Lodge a Complaint — Consumer Protection, Central Bank of Nigeria",
    retrieved: "2026-11-24",
    excerpt:
      "The customer must first lodge the complaint with their financial institution (the bank), obtain a reference/tracking number, and wait two weeks before escalating to the CBN Consumer Protection Department if the matter remains unresolved.",
    applicability:
      "Defines the bank-first requirement, the reference/tracking number, and the two-week escalation window. CashCase enforces bank-first and does not offer CBN escalation before two weeks.",
  },
  {
    id: "cbn-cpd-complaint-mgmt",
    url: "https://www.cbn.gov.ng/supervision/cpdcomgt.html",
    title: "Complaint Management — Consumer Protection Department, CBN",
    retrieved: "2026-11-24",
    excerpt:
      "CBN supervises bank complaint handling; consumers escalate to the CBN Consumer Protection Department only after the bank's internal process and required waiting period.",
    applicability:
      "Confirms escalation is to the CBN Consumer Protection Department and is post-bank-process.",
  },
  {
    id: "cbn-ccms-portal",
    url: "https://complaintsportal.cbn.gov.ng/",
    title: "CBN Complaints Management System (CCMS) Portal",
    retrieved: "2026-11-24",
    excerpt:
      "The public portal says to allow 24 hours for the bank to upload the complaint after a reference is issued, then check the portal. Categories include ATM cash-dispense errors for own-bank and other-bank cases.",
    applicability:
      "Defines the 24-hour bank-upload delay and the CCMS status-lookup step modelled in MockCCMS.",
  },
  {
    id: "cbn-ccms-categories",
    url: "https://complaintsportal.cbn.gov.ng/Categories",
    title: "Complaint Categories — CBN CCMS",
    retrieved: "2026-11-24",
    excerpt: "Categories include ATM cash-dispense errors, split into own-bank and other-bank cases.",
    applicability:
      "CashCase uses own-bank / other-bank classification consistent with CCMS categories.",
  },
  {
    id: "firstbank-complaints",
    url: "https://complaints.firstbanknigeria.com/",
    title: "FirstBank Complaints Portal",
    retrieved: "2026-11-24",
    excerpt: "Banks already operate their own public complaint forms with reference-status lookup.",
    applicability:
      "CashCase does not replace bank channels; it produces an evidence-complete packet the customer takes to their bank. Link is informational only.",
  },
  {
    id: "reechdesk",
    url: "https://app.reechdesk.com/",
    title: "Reechdesk — failed-transaction tickets & CBN SLA tracking",
    retrieved: "2026-11-24",
    excerpt: "B2B workflow for banks/fintechs to automate failed-transaction tickets and CBN SLA tracking.",
    applicability:
      "Not a consumer-owned case workflow. CashCase differentiates on the consumer's evidence-complete, bank-first, status-verified path for the specific ATM 'debited/no cash' event.",
  },
];

export function getSource(id: string): RuleSource | undefined {
  return RULE_SOURCES.find((s) => s.id === id);
}

export function allSources(): RuleSource[] {
  return RULE_SOURCES;
}
