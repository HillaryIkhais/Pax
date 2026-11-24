/* ------------------------------------------------------------------ */
/* Deterministic PNR contact audit                                    */
/*                                                                     */
/* Compares passenger-verified contacts against CTCE/CTCM/CTCR SSRs   */
/* observed on a PNR. Never infers that a contact is the passenger's   */
/* from the name or from mere presence in the PNR.                     */
/* ------------------------------------------------------------------ */

import type {
  SsrContact,
  VerifiedContact,
  PnrAuditResult,
  PassengerAudit,
  AuditIssue,
  AuditVerdict,
  RepairProposal,
} from "@/lib/rules/ssr-types";
import { normaliseEmail, normalisePhone, emailsEqual, phonesEqual, maskContact } from "./normalization";

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function issue(
  verdict: AuditVerdict,
  passengerRef: string,
  message: string,
  opts: { ssrType?: SsrContact["type"]; observedValue?: string; expectedValue?: string; canRepair?: boolean } = {}
): AuditIssue {
  return {
    verdict,
    passengerRef,
    ssrType: opts.ssrType,
    observedValue: opts.observedValue,
    expectedValue: opts.expectedValue,
    message,
    canRepair: opts.canRepair ?? false,
  };
}

function ssrsFor(passengerRef: string, ssrs: SsrContact[]): SsrContact[] {
  return ssrs.filter((s) => s.passengerRef === passengerRef);
}

function hasType(ssrs: SsrContact[], type: SsrContact["type"]): boolean {
  return ssrs.some((s) => s.type === type);
}

function getValue(ssrs: SsrContact[], type: SsrContact["type"]): string | undefined {
  const s = ssrs.find((x) => x.type === type);
  return s?.value ?? undefined;
}

/* ------------------------------------------------------------------ */
/* Main audit                                                         */
/* ------------------------------------------------------------------ */

export function auditPnrContact({
  pnr,
  surname,
  airline,
  flightDate,
  ssrs,
  verifiedContacts,
}: {
  pnr: string;
  surname: string;
  airline: string;
  flightDate?: string;
  ssrs: SsrContact[];
  verifiedContacts: VerifiedContact[]; // passenger-verified contacts
}): PnrAuditResult {
  const passengerRefs = [
    ...new Set([...ssrs.map((s) => s.passengerRef), ...verifiedContacts.map((c) => c.passengerRef)]),
  ];

  const passengers: PassengerAudit[] = passengerRefs.map((ref) =>
    auditPassenger(ref, ssrs, verifiedContacts)
  );

  const overall = computeOverall(passengers);

  return {
    pnr,
    surname,
    airline,
    flightDate,
    passengers,
    overall,
    rawSsrs: ssrs,
    auditedAt: Date.now(),
  };
}

function auditPassenger(
  passengerRef: string,
  ssrs: SsrContact[],
  verifiedContacts: VerifiedContact[]
): PassengerAudit {
  const pSsrs = ssrsFor(passengerRef, ssrs);
  const verified = verifiedContacts.find((c) => c.passengerRef === passengerRef);

  const verdicts: AuditIssue[] = [];

  /* --- CTCR: passenger declined ----------------------------------- */
  if (hasType(pSsrs, "CTCR")) {
    verdicts.push(
      issue(
        "PASSENGER_DECLINED",
        passengerRef,
        "This passenger has declined to share contact details (CTCR). No contact will be written.",
        { ssrType: "CTCR", canRepair: false }
      )
    );
    return {
      passengerRef,
      name: undefined,
      verdicts,
      reachable: false,
      needsRepair: false,
    };
  }

  if (!verified) {
    verdicts.push(
      issue(
        "UNKNOWN",
        passengerRef,
        "No verified contact provided for this passenger.",
        { canRepair: false }
      )
    );
    return {
      passengerRef,
      verdicts,
      reachable: false,
      needsRepair: true,
    };
  }

  const { email, phone, declined } = verified;
  if (declined) {
    verdicts.push(
      issue("PASSENGER_DECLINED", passengerRef, "Passenger declined contact sharing.", { canRepair: false })
    );
    return { passengerRef, verdicts, reachable: false, needsRepair: false };
  }

  if (!email && !phone) {
    verdicts.push(
      issue(
        "UNKNOWN",
        passengerRef,
        "No contact channel verified for this passenger, so reachability cannot be confirmed.",
        { canRepair: false }
      )
    );
    return {
      passengerRef,
      verdicts,
      reachable: false,
      needsRepair: false,
    };
  }

  const observedEmail = getValue(pSsrs, "CTCE");
  const observedPhone = getValue(pSsrs, "CTCM");

  /* --- Determine contact ownership --------------------------------- */
  const agencyOnlySignals = pSsrs.some(
    (s) => (s.type === "CTCE" || s.type === "CTCM") && /agency|agent|travel/i.test(s.rawSourceText)
  );

  /* Email checks */
  if (email) {
    if (!observedEmail) {
      verdicts.push(
        issue(
          "MISSING_EMAIL",
          passengerRef,
          "Your verified email is not attached to this passenger in the airline record.",
          { expectedValue: email, canRepair: true }
        )
      );
    } else if (!emailsEqual(observedEmail, email)) {
      verdicts.push(
        issue(
          "MALFORMED_CONTACT",
          passengerRef,
          `The email on this passenger (${maskContact(observedEmail, "email")}) does not match your verified email.`,
          { observedValue: observedEmail, expectedValue: email, canRepair: true }
        )
      );
    } else {
      verdicts.push(
        issue(
          "PASSENGER_CONTACT_MATCH",
          passengerRef,
          "Your verified email is attached to this passenger.",
          { ssrType: "CTCE", observedValue: observedEmail, canRepair: false }
        )
      );
    }
  } else {
    if (!observedEmail) {
      verdicts.push(
        issue("MISSING_EMAIL", passengerRef, "No email found for this passenger.", { canRepair: false })
      );
    }
  }

  /* Phone checks */
  if (phone) {
    if (!observedPhone) {
      verdicts.push(
        issue(
          "MISSING_MOBILE",
          passengerRef,
          "Your verified phone is not attached to this passenger in the airline record.",
          { expectedValue: phone, canRepair: true }
        )
      );
    } else if (!phonesEqual(observedPhone, phone)) {
      verdicts.push(
        issue(
          "MALFORMED_CONTACT",
          passengerRef,
          `The phone on this passenger (${maskContact(observedPhone, "phone")}) does not match your verified phone.`,
          { observedValue: observedPhone, expectedValue: phone, canRepair: true }
        )
      );
    } else {
      verdicts.push(
        issue(
          "PASSENGER_CONTACT_MATCH",
          passengerRef,
          "Your verified phone is attached to this passenger.",
          { ssrType: "CTCM", observedValue: observedPhone, canRepair: false }
        )
      );
    }
  } else {
    if (!observedPhone) {
      verdicts.push(
        issue("MISSING_MOBILE", passengerRef, "No phone found for this passenger.", { canRepair: false })
      );
    }
  }

  /* --- Misassignment detection: contact exists but on wrong ref ----- */
  /* Two directions:                                                    */
  /*   A) this passenger's verified contact appears on another ref      */
  /*   B) this passenger's observed contact matches another ref's       */
  /*      verified contact (this passenger holds someone else's contact) */
  const otherSsrs = ssrs.filter((s) => s.passengerRef !== passengerRef);

  const misassignedA = otherSsrs.some(
    (s) =>
      ((s.type === "CTCE" && email && emailsEqual(s.value, email)) ||
        (s.type === "CTCM" && phone && phonesEqual(s.value, phone)))
  );
  const misassignedB = otherSsrs.some((s) => {
    const otherVc = verifiedContacts.find((vc) => vc.passengerRef === s.passengerRef);
    return (
      (s.type === "CTCE" && observedEmail && otherVc?.email && emailsEqual(observedEmail, otherVc.email)) ||
      (s.type === "CTCM" && observedPhone && otherVc?.phone && phonesEqual(observedPhone, otherVc.phone))
    );
  });
  if ((misassignedA || misassignedB) && !verdicts.some((v) => v.verdict === "PASSENGER_CONTACT_MATCH")) {
    verdicts.push(
      issue(
        "MISASSIGNED_TO_OTHER_PASSENGER",
        passengerRef,
        "A contact matching yours is attached to a different passenger on this booking.",
        { canRepair: true }
      )
    );
  }

  /* --- Agency-only contact ---------------------------------------- */
  if (
    pSsrs.length > 0 &&
    !verdicts.some((v) => v.verdict === "PASSENGER_CONTACT_MATCH") &&
    agencyOnlySignals
  ) {
    verdicts.push(
      issue(
        "AGENCY_CONTACT_ONLY",
        passengerRef,
        "The contact on this booking belongs to the travel agent, not to you.",
        { canRepair: true }
      )
    );
  }

  const reachable = verdicts.some((v) => v.verdict === "PASSENGER_CONTACT_MATCH") && !verdicts.some((v) => v.verdict === "MALFORMED_CONTACT");
  /* Require both email and phone match if both were provided by passenger */
  const wanted = [Boolean(email), Boolean(phone)].filter(Boolean).length;
  const matched = verdicts.filter((v) => v.verdict === "PASSENGER_CONTACT_MATCH").length;
  const fullyReachable = wanted > 0 ? matched >= wanted : false;

  return {
    passengerRef,
    verdicts,
    reachable: fullyReachable,
    needsRepair: verdicts.some((v) => v.canRepair),
  };
}

function computeOverall(passengers: PassengerAudit[]): PnrAuditResult["overall"] {
  if (passengers.length === 0) return "UNVERIFIABLE";
  if (passengers.some((p) => p.verdicts.some((v) => v.verdict === "PASSENGER_DECLINED"))) {
    /* If all declined -> DECLINED; if some declined and others not reachable -> NOT_REACHABLE */
    const nonDeclined = passengers.filter((p) => !p.verdicts.some((v) => v.verdict === "PASSENGER_DECLINED"));
    if (nonDeclined.length === 0) return "DECLINED";
    if (nonDeclined.every((p) => p.reachable)) return "REACHABLE";
    return "NOT_REACHABLE";
  }
  if (passengers.every((p) => p.reachable)) return "REACHABLE";
  if (passengers.some((p) => p.verdicts.some((v) => v.verdict === "UNKNOWN"))) return "UNVERIFIABLE";
  return "NOT_REACHABLE";
}

/* ------------------------------------------------------------------ */
/* Build repair proposals from audit                                  */
/* ------------------------------------------------------------------ */

export function buildRepairProposals(
  pnr: string,
  passenger: PassengerAudit,
  verified: VerifiedContact | undefined
): RepairProposal[] {
  if (!verified || verified.declined) return [];

  const proposals: RepairProposal[] = [];

  const hasEmailMatch = passenger.verdicts.some(
    (v) => v.verdict === "PASSENGER_CONTACT_MATCH" && v.ssrType === "CTCE"
  );
  const hasPhoneMatch = passenger.verdicts.some(
    (v) => v.verdict === "PASSENGER_CONTACT_MATCH" && v.ssrType === "CTCM"
  );

  if (verified.email && !hasEmailMatch) {
    proposals.push({
      passengerRef: passenger.passengerRef,
      ssrType: "CTCE",
      value: verified.email,
      reason: "Your verified email is missing or incorrect on this passenger. Add it so the airline can reach you directly.",
      requiresConsent: true,
    });
  }
  if (verified.phone && !hasPhoneMatch) {
    proposals.push({
      passengerRef: passenger.passengerRef,
      ssrType: "CTCM",
      value: verified.phone,
      reason: "Your verified phone is missing or incorrect on this passenger. Add it so the airline can reach you directly.",
      requiresConsent: true,
    });
  }

  return proposals;
}
