import { describe, it, expect } from "vitest";
import { auditPnrContact } from "@/lib/audit/engine";
import type { SsrContact, VerifiedContact } from "@/lib/rules/ssr-types";

const baseSsrs: SsrContact[] = [];

function ssr(overrides: {
  type: SsrContact["type"];
  passengerRef: string;
  value?: string | null;
  sourceRecordId?: string;
  rawSourceText?: string;
}): SsrContact {
  return {
    type: overrides.type,
    passengerRef: overrides.passengerRef,
    value: overrides.value ?? null,
    sourceRecordId: overrides.sourceRecordId ?? "sr-" + Math.random().toString(36).slice(2, 8),
    rawSourceText: overrides.rawSourceText ?? `${overrides.type} ${overrides.value ?? ""}`,
    observedAt: Date.now(),
  };
}

const vc = (overrides: Partial<VerifiedContact> & { passengerRef: string }): VerifiedContact => ({
  email: undefined,
  phone: undefined,
  declined: false,
  ...overrides,
});

/* ------------------------------------------------------------------ */
/* 1. Agent email/phone only => AGENCY_CONTACT_ONLY                   */
/* ------------------------------------------------------------------ */

describe("AGENCY_CONTACT_ONLY", () => {
  it("flags agency contact when verified passenger contact differs", () => {
    const result = auditPnrContact({
      pnr: "AX1234",
      surname: "OKONKWO",
      airline: "MockAir",
      ssrs: [
        ssr({ type: "CTCE", passengerRef: "P1", value: "bookings@agency.ng" }),
        ssr({ type: "CTCM", passengerRef: "P1", value: "+2348000000000" }),
      ],
      verifiedContacts: [vc({ passengerRef: "P1", email: "chima@example.com", phone: "+2348012345678" })],
    });
    const v = result.passengers[0];
    const codes = v.verdicts.map((x) => x.verdict);
    expect(codes).toContain("AGENCY_CONTACT_ONLY");
    expect(result.overall).not.toBe("REACHABLE");
  });
});

/* ------------------------------------------------------------------ */
/* 2. Passenger contact on wrong passenger reference => MISASSIGNED   */
/* ------------------------------------------------------------------ */

describe("MISASSIGNED_TO_OTHER_PASSENGER", () => {
  it("flags contact attached to the wrong passenger in a two-adult booking", () => {
    const result = auditPnrContact({
      pnr: "BY5678",
      surname: "ADEBAYO",
      airline: "MockAir",
      ssrs: [
        ssr({ type: "CTCE", passengerRef: "P1", value: "funke@example.com" }),
        ssr({ type: "CTCM", passengerRef: "P1", value: "+2348012345678" }),
        ssr({ type: "CTCE", passengerRef: "P2", value: "funke@example.com" }),
        ssr({ type: "CTCM", passengerRef: "P2", value: "+2348012345678" }),
      ],
      verifiedContacts: [
        vc({ passengerRef: "P1", email: "funke@example.com", phone: "+2348012345678" }),
        vc({ passengerRef: "P2", email: "bola@example.com", phone: "+2348098765432" }),
      ],
    });
    const p2 = result.passengers.find((p) => p.passengerRef === "P2")!;
    const codes = p2.verdicts.map((x) => x.verdict);
    expect(codes).toContain("MISASSIGNED_TO_OTHER_PASSENGER");
  });
});

/* ------------------------------------------------------------------ */
/* 3. Missing one channel => flag only the missing channel            */
/* ------------------------------------------------------------------ */

describe("Missing one channel", () => {
  it("flags MISSING_EMAIL only when email missing but phone present", () => {
    const result = auditPnrContact({
      pnr: "X1",
      surname: "T",
      airline: "MockAir",
      ssrs: [ssr({ type: "CTCM", passengerRef: "P1", value: "+2348012345678" })],
      verifiedContacts: [vc({ passengerRef: "P1", email: "a@example.com", phone: "+2348012345678" })],
    });
    const codes = result.passengers[0].verdicts.map((x) => x.verdict);
    expect(codes).toContain("MISSING_EMAIL");
    expect(codes).not.toContain("MISSING_MOBILE");
  });
  it("flags MISSING_MOBILE only when phone missing but email present", () => {
    const result = auditPnrContact({
      pnr: "X2",
      surname: "T",
      airline: "MockAir",
      ssrs: [ssr({ type: "CTCE", passengerRef: "P1", value: "a@example.com" })],
      verifiedContacts: [vc({ passengerRef: "P1", email: "a@example.com", phone: "+2348012345678" })],
    });
    const codes = result.passengers[0].verdicts.map((x) => x.verdict);
    expect(codes).toContain("MISSING_MOBILE");
    expect(codes).not.toContain("MISSING_EMAIL");
  });
});

/* ------------------------------------------------------------------ */
/* 4. CTCR refusal => PASSENGER_DECLINED; never auto-write            */
/* ------------------------------------------------------------------ */

describe("CTCR refusal", () => {
  it("returns PASSENGER_DECLINED and does not suggest repair", () => {
    const result = auditPnrContact({
      pnr: "CZ9012",
      surname: "IBRAHIM",
      airline: "MockAir",
      ssrs: [ssr({ type: "CTCR", passengerRef: "P1", value: null })],
      verifiedContacts: [vc({ passengerRef: "P1" })],
    });
    const v = result.passengers[0];
    expect(v.verdicts.map((x) => x.verdict)).toContain("PASSENGER_DECLINED");
    expect(v.needsRepair).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* 5. Unverified passenger email/phone => no write action             */
/* ------------------------------------------------------------------ */

describe("Unverified contact => no write", () => {
  it("does not propose repair when contact not verified", () => {
    const result = auditPnrContact({
      pnr: "X3",
      surname: "T",
      airline: "MockAir",
      ssrs: [],
      verifiedContacts: [vc({ passengerRef: "P1" })], // no email/phone
    });
    expect(result.passengers[0].needsRepair).toBe(false);
    expect(result.passengers[0].verdicts.map((x) => x.verdict)).toContain("UNKNOWN");
  });
});

/* ------------------------------------------------------------------ */
/* 6. Correct details already present => no-op; retain PASS           */
/* ------------------------------------------------------------------ */

describe("Already correct", () => {
  it("returns PASSENGER_CONTACT_MATCH and no repair needed", () => {
    const result = auditPnrContact({
      pnr: "DX3456",
      surname: "SANUSI",
      airline: "MockAir",
      ssrs: [
        ssr({ type: "CTCE", passengerRef: "P1", value: "halima.sanusi@example.com" }),
        ssr({ type: "CTCM", passengerRef: "P1", value: "+2348098765432" }),
      ],
      verifiedContacts: [vc({ passengerRef: "P1", email: "halima.sanusi@example.com", phone: "+2348098765432" })],
    });
    const v = result.passengers[0];
    expect(result.overall).toBe("REACHABLE");
    expect(v.reachable).toBe(true);
    expect(v.needsRepair).toBe(false);
    expect(v.verdicts.some((x) => x.verdict === "PASSENGER_CONTACT_MATCH")).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* 10. Multi-passenger booking => no cross-assignment                 */
/* ------------------------------------------------------------------ */

describe("Multi-passenger no cross-assignment", () => {
  it("keeps each passenger's audit independent", () => {
    const result = auditPnrContact({
      pnr: "BY5678",
      surname: "ADEBAYO",
      airline: "MockAir",
      ssrs: [
        ssr({ type: "CTCE", passengerRef: "P1", value: "funke@example.com" }),
        ssr({ type: "CTCM", passengerRef: "P1", value: "+2348012345678" }),
        ssr({ type: "CTCE", passengerRef: "P2", value: "bola@example.com" }),
        ssr({ type: "CTCM", passengerRef: "P2", value: "+2348098765432" }),
      ],
      verifiedContacts: [
        vc({ passengerRef: "P1", email: "funke@example.com", phone: "+2348012345678" }),
        vc({ passengerRef: "P2", email: "bola@example.com", phone: "+2348098765432" }),
      ],
    });
    expect(result.overall).toBe("REACHABLE");
    for (const p of result.passengers) {
      expect(p.reachable).toBe(true);
    }
  });
});

/* ------------------------------------------------------------------ */
/* 9. Record not exposed => UNVERIFIABLE                              */
/* ------------------------------------------------------------------ */

describe("UNVERIFIABLE", () => {
  it("returns UNVERIFIABLE when no contact exposed and nothing verified", () => {
    const result = auditPnrContact({
      pnr: "X4",
      surname: "T",
      airline: "MockAir",
      ssrs: [],
      verifiedContacts: [vc({ passengerRef: "P1" })],
    });
    expect(result.overall).toBe("UNVERIFIABLE");
  });
});
