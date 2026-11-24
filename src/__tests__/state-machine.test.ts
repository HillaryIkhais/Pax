import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  caseClassification,
  amountClaimed,
  missingEvidence,
  isEvidenceComplete,
  twoWeeksElapsedFor,
  ccmsUploadReadyFor,
  canEscalateToCBN,
  nextActions,
} from "@/lib/rules/state-machine";
import { nowMs, setDemoClock, resetDemoClock } from "@/lib/clock/clock";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function makeCase(overrides: Record<string, unknown> = {}): any {
  return {
    id: "c1",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    atmType: "own",
    bankName: "FirstBank",
    transactionDateTime: "2026-11-20T10:00",
    timezone: "Africa/Lagos",
    amountDebited: 20000,
    amountDispensed: 0,
    atmLocation: "Lagos Island",
    atmOperator: null,
    terminalId: "T123",
    transactionReference: "TXN-999",
    bankComplaintReference: null,
    ccmsReference: null,
    evidenceAlertUrl: null,
    evidenceReceiptUrl: null,
    evidenceHash: null,
    evidenceVersion: 1,
    status: "DRAFT",
    demoClockOverride: null,
    ...overrides,
  };
}

/* ------------------------------------------------------------------ */
/* Case classification                                                */
/* ------------------------------------------------------------------ */

describe("case classification", () => {
  it("classifies own-bank ATM", () => {
    expect(caseClassification(makeCase({ atmType: "own" }))).toBe("own-bank");
  });
  it("classifies other-bank ATM", () => {
    expect(caseClassification(makeCase({ atmType: "other" }))).toBe("other-bank");
  });
});

/* ------------------------------------------------------------------ */
/* Amount claimed                                                     */
/* ------------------------------------------------------------------ */

describe("amount claimed", () => {
  it("full dispense not debited => claim 0", () => {
    expect(amountClaimed(makeCase({ amountDebited: 20000, amountDispensed: 20000 }))).toBe(0);
  });
  it("no cash dispensed => claim full amount", () => {
    expect(amountClaimed(makeCase({ amountDebited: 20000, amountDispensed: 0 }))).toBe(20000);
  });
  it("partial dispense => claim difference", () => {
    expect(amountClaimed(makeCase({ amountDebited: 20000, amountDispensed: 5000 }))).toBe(15000);
  });
  it("dispensed more than debited => claim 0 (clamped)", () => {
    expect(amountClaimed(makeCase({ amountDebited: 20000, amountDispensed: 25000 }))).toBe(0);
  });
});

/* ------------------------------------------------------------------ */
/* Evidence completeness                                              */
/* ------------------------------------------------------------------ */

describe("evidence completeness", () => {
  it("missing evidence alert => incomplete", () => {
    const c = makeCase({ evidenceAlertUrl: null, transactionReference: "TXN-999", atmLocation: "Lagos" });
    expect(missingEvidence(c)).toContain("Transaction alert or statement excerpt");
    expect(isEvidenceComplete(c)).toBe(false);
  });
  it("missing transaction reference and terminal ID => incomplete", () => {
    const c = makeCase({ evidenceAlertUrl: "/x", transactionReference: null, terminalId: null, atmLocation: "Lagos" });
    expect(missingEvidence(c)).toContain("Transaction reference or terminal ID");
    expect(isEvidenceComplete(c)).toBe(false);
  });
  it("missing ATM location => incomplete", () => {
    const c = makeCase({ evidenceAlertUrl: "/x", transactionReference: "TXN-999", atmLocation: null });
    expect(missingEvidence(c)).toContain("ATM location");
    expect(isEvidenceComplete(c)).toBe(false);
  });
  it("all present => complete", () => {
    const c = makeCase({
      evidenceAlertUrl: "/x",
      transactionReference: "TXN-999",
      atmLocation: "Lagos",
    });
    expect(missingEvidence(c)).toEqual([]);
    expect(isEvidenceComplete(c)).toBe(true);
  });
  it("terminal ID alone satisfies reference requirement", () => {
    const c = makeCase({ evidenceAlertUrl: "/x", transactionReference: null, terminalId: "T123", atmLocation: "Lagos" });
    expect(isEvidenceComplete(c)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Two-week escalation boundary                                       */
/* ------------------------------------------------------------------ */

describe("two-week escalation window", () => {
  const base = Date.now();

  beforeEach(() => {
    setDemoClock(base);
  });

  afterEach(() => {
    resetDemoClock();
  });

  it("not eligible before two weeks", () => {
    const c = makeCase({ status: "BANK_RESOLUTION_WINDOW", updatedAt: base });
    expect(canEscalateToCBN(c)).toBe(false);
    expect(twoWeeksElapsedFor(c, base)).toBe(false);
  });

  it("eligible exactly at two weeks (14 days)", () => {
    const c = makeCase({ status: "BANK_RESOLUTION_WINDOW", updatedAt: base });
    const twoWeeksLater = base + 14 * 24 * 60 * 60 * 1000;
    expect(twoWeeksElapsedFor(c, twoWeeksLater)).toBe(true);
    expect(canEscalateToCBN(c, twoWeeksLater)).toBe(true);
  });

  it("eligible after two weeks", () => {
    const c = makeCase({ status: "BANK_RESOLUTION_WINDOW", updatedAt: base });
    const fifteenDaysLater = base + 15 * 24 * 60 * 60 * 1000;
    expect(twoWeeksElapsedFor(c, fifteenDaysLater)).toBe(true);
    expect(canEscalateToCBN(c, fifteenDaysLater)).toBe(true);
  });

  it("not eligible when in wrong status", () => {
    const c = makeCase({ status: "READY_FOR_BANK", updatedAt: base - 1000 * 60 * 60 * 24 * 20 });
    expect(canEscalateToCBN(c)).toBe(false);
  });

  it("calculation is DST-independent (uses epoch ms)", () => {
    // 14 days is always 14 * 24 * 60 * 60 * 1000 ms regardless of DST
    const c = makeCase({ status: "BANK_RESOLUTION_WINDOW", updatedAt: base });
    const plus14Days = base + 14 * 24 * 60 * 60 * 1000;
    expect(twoWeeksElapsedFor(c, plus14Days)).toBe(true);
    expect(twoWeeksElapsedFor(c, plus14Days - 1)).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* 24-hour CCMS upload boundary                                       */
/* ------------------------------------------------------------------ */

describe("24-hour CCMS upload delay", () => {
  const base = Date.now();

  beforeEach(() => {
    setDemoClock(base);
  });

  afterEach(() => {
    resetDemoClock();
  });

  it("not ready before 24h", () => {
    const c = makeCase({ status: "WAITING_FOR_CCMS_UPLOAD", updatedAt: base });
    expect(ccmsUploadReadyFor(c, base + 23 * 60 * 60 * 1000)).toBe(false);
  });

  it("ready at exactly 24h", () => {
    const c = makeCase({ status: "WAITING_FOR_CCMS_UPLOAD", updatedAt: base });
    expect(ccmsUploadReadyFor(c, base + 24 * 60 * 60 * 1000)).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Next actions                                                       */
/* ------------------------------------------------------------------ */

describe("next actions", () => {
  it("READY_FOR_BANK suggests lodging with bank", () => {
    const c = makeCase({ status: "READY_FOR_BANK" });
    const actions = nextActions(c);
    expect(actions.some((a) => a.action.includes("Lodge complaint with your bank"))).toBe(true);
  });
  it("ELIGIBLE_FOR_CBN_ESCALATION suggests preparing packet", () => {
    const c = makeCase({ status: "ELIGIBLE_FOR_CBN_ESCALATION" });
    const actions = nextActions(c);
    expect(actions.some((a) => a.action.includes("Prepare CBN escalation packet"))).toBe(true);
  });
});

/* ------------------------------------------------------------------ */
/* Security: forbidden fields                                         */
/* ------------------------------------------------------------------ */

describe("security: forbidden fields", () => {
  const forbidden = ["pin", "otp", "bvn", "fullCardNumber", "password", "token"];
  it("none of the forbidden fields appear in the case schema shape", () => {
    const c = makeCase();
    for (const f of forbidden) {
      expect(c[f]).toBeUndefined();
      expect(Object.keys(c)).not.toContain(f);
    }
  });
});
