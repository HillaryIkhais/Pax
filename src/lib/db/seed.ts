/* ------------------------------------------------------------------ */
/* Carrier Sandbox seed data                                          */
/*                                                                     */
/* Clearly labelled local sandbox. Not a live airline. Four seeded     */
/* cases plus a deliberate false-save scenario for Kane verification. */
/* ------------------------------------------------------------------ */

import type { NewPnr, NewSsr } from "./schema";

const NOW = Date.now();

export const SEED_PNRS: NewPnr[] = [
  {
    pnr: "AX1234",
    surname: "OKONKWO",
    airline: "MockAir",
    flightDate: "2026-12-01",
    sourceRecordId: "sr-agent-only-001",
    rawPayload: JSON.stringify({
      pnr: "AX1234",
      passengers: [
        { ref: "P1", name: "CHIMA OKONKWO", contactSSR: "bookings@okonkwo-travels.ng", contactType: "agency" },
      ],
    }),
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    pnr: "BY5678",
    surname: "ADEBAYO",
    airline: "MockAir",
    flightDate: "2026-12-02",
    sourceRecordId: "sr-misassigned-002",
    rawPayload: JSON.stringify({
      pnr: "BY5678",
      passengers: [
        { ref: "P1", name: "FUNKE ADEBAYO", email: "funke@example.com", phone: "+2348012345678" },
        { ref: "P2", name: "BOLA ADEBAYO", email: "funke@example.com", phone: "+2348012345678" },
      ],
      note: "P1's contact erroneously attached to P2 as well",
    }),
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    pnr: "CZ9012",
    surname: "IBRAHIM",
    airline: "MockAir",
    flightDate: "2026-12-03",
    sourceRecordId: "sr-declined-003",
    rawPayload: JSON.stringify({
      pnr: "CZ9012",
      passengers: [
        { ref: "P1", name: "ZAID IBRAHIM", contactSSR: null, declined: true, ssrType: "CTCR" },
      ],
    }),
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    pnr: "DX3456",
    surname: "SANUSI",
    airline: "MockAir",
    flightDate: "2026-12-04",
    sourceRecordId: "sr-correct-004",
    rawPayload: JSON.stringify({
      pnr: "DX3456",
      passengers: [
        {
          ref: "P1",
          name: "HALIMA SANUSI",
          email: "halima.sanusi@example.com",
          phone: "+2348098765432",
        },
      ],
    }),
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export const SEED_SSRS: Array<Omit<NewSsr, "pnrId"> & { pnr: string }> = [
  /* AX1234 P1: agency-only contact */
  { pnr: "AX1234", type: "CTCE", passengerRef: "P1", value: "bookings@okonkwo-travels.ng", sourceRecordId: "sr-ctce-agency-001", rawSourceText: "CTCE bookings@okonkwo-travels.ng (travel agent)", observedAt: NOW },
  { pnr: "AX1234", type: "CTCM", passengerRef: "P1", value: "+2348000000000", sourceRecordId: "sr-ctcm-agency-001", rawSourceText: "CTCM +2348000000000 (travel agent)", observedAt: NOW },

  /* BY5678 P1: correct contact */
  { pnr: "BY5678", type: "CTCE", passengerRef: "P1", value: "funke@example.com", sourceRecordId: "sr-ctce-p1-002", rawSourceText: "CTCE funke@example.com", observedAt: NOW },
  { pnr: "BY5678", type: "CTCM", passengerRef: "P1", value: "+2348012345678", sourceRecordId: "sr-ctcm-p1-002", rawSourceText: "CTCM +2348012345678", observedAt: NOW },
  /* BY5678 P2: misassigned - P1's contact on P2 */
  { pnr: "BY5678", type: "CTCE", passengerRef: "P2", value: "funke@example.com", sourceRecordId: "sr-ctce-p2-002", rawSourceText: "CTCE funke@example.com (copied from P1)", observedAt: NOW },
  { pnr: "BY5678", type: "CTCM", passengerRef: "P2", value: "+2348012345678", sourceRecordId: "sr-ctcm-p2-002", rawSourceText: "CTCM +2348012345678 (copied from P1)", observedAt: NOW },

  /* CZ9012 P1: declined (CTCR) */
  { pnr: "CZ9012", type: "CTCR", passengerRef: "P1", value: null, sourceRecordId: "sr-ctcr-p1-003", rawSourceText: "CTCR passenger declined contact", observedAt: NOW },

  /* DX3456 P1: already correct */
  { pnr: "DX3456", type: "CTCE", passengerRef: "P1", value: "halima.sanusi@example.com", sourceRecordId: "sr-ctce-p1-004", rawSourceText: "CTCE halima.sanusi@example.com", observedAt: NOW },
  { pnr: "DX3456", type: "CTCM", passengerRef: "P1", value: "+2348098765432", sourceRecordId: "sr-ctcm-p1-004", rawSourceText: "CTCM +2348098765432", observedAt: NOW },
];

/* ------------------------------------------------------------------ */
/* Deliberate false-save scenario                                     */
/*                                                                     */
/* When NEXT_PUBLIC_FALSE_SAVE_PNR is set, the contact update API     */
/* returns a green "Saved" response but does NOT persist the change.   */
/* Kane must catch this after a fresh retrieval.                       */
/* ------------------------------------------------------------------ */

export function isFalseSavePnr(pnr: string): boolean {
  return Boolean(process.env.NEXT_PUBLIC_FALSE_SAVE_PNR) && pnr === process.env.NEXT_PUBLIC_FALSE_SAVE_PNR;
}

export const FALSE_SAVE_PNR = "FS7777";

export const FALSE_SAVE_SEED: NewPnr = {
  pnr: FALSE_SAVE_PNR,
  surname: "FALSE",
  airline: "MockAir",
  flightDate: "2026-12-05",
  sourceRecordId: "sr-false-save-001",
  rawPayload: JSON.stringify({
    pnr: FALSE_SAVE_PNR,
    passengers: [{ ref: "P1", name: "FALSE SAVE TEST", contactSSR: "old@example.com", phone: "+2348000000000" }],
  }),
  createdAt: NOW,
  updatedAt: NOW,
};

export const FALSE_SAVE_SSRS: Array<Omit<NewSsr, "pnrId"> & { pnr: string }> = [
  { pnr: FALSE_SAVE_PNR, type: "CTCE", passengerRef: "P1", value: "old@example.com", sourceRecordId: "sr-ctce-false-001", rawSourceText: "CTCE old@example.com", observedAt: NOW },
  { pnr: FALSE_SAVE_PNR, type: "CTCM", passengerRef: "P1", value: "+2348000000000", sourceRecordId: "sr-ctcm-false-001", rawSourceText: "CTCM +2348000000000", observedAt: NOW },
];
