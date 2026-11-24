/* ------------------------------------------------------------------ */
/* PNR / SSR contact types                                            */
/*                                                                     */
/* Airline standard contact SSR fields:                               */
/*   CTCE - email                                                      */
/*   CTCM - mobile                                                     */
/*   CTCR - passenger declined to provide contact information          */
/*                                                                     */
/* Source: IATA passenger contacts FAQ + carrier reservations policies */
/* ------------------------------------------------------------------ */

export type SsrType = "CTCE" | "CTCM" | "CTCR";

export const SSR_TYPES: SsrType[] = ["CTCE", "CTCM", "CTCR"];

export interface SsrContact {
  type: SsrType;
  passengerRef: string; // e.g. "P1", "P2"
  segmentRef?: string;
  value: string | null; // email or phone; null for CTCR
  sourceRecordId: string; // id of the PNR/contact record in the carrier system
  rawSourceText: string; // verbatim text observed in the carrier page
  observedAt: number; // epoch ms
}

/* ------------------------------------------------------------------ */
/* Normalised contact (what the passenger verifies)                   */
/* ------------------------------------------------------------------ */

export interface VerifiedContact {
  passengerRef: string;
  email?: string; // normalised
  phone?: string; // normalised (E.164 with country code)
  declined: boolean; // CTCR present for this passenger
}

/* ------------------------------------------------------------------ */
/* Audit verdict types                                                */
/* ------------------------------------------------------------------ */

export type AuditVerdict =
  | "PASSENGER_CONTACT_MATCH"
  | "AGENCY_CONTACT_ONLY"
  | "MISSING_EMAIL"
  | "MISSING_MOBILE"
  | "MISASSIGNED_TO_OTHER_PASSENGER"
  | "MALFORMED_CONTACT"
  | "PASSENGER_DECLINED"
  | "RECORD_NOT_EXPOSED"
  | "UNKNOWN";

export interface AuditIssue {
  verdict: AuditVerdict;
  passengerRef: string;
  ssrType?: SsrType;
  observedValue?: string;
  expectedValue?: string;
  message: string;
  canRepair: boolean;
}

export interface PassengerAudit {
  passengerRef: string;
  name?: string;
  verdicts: AuditIssue[];
  reachable: boolean; // true only when PASSENGER_CONTACT_MATCH for both email & phone (or declined)
  needsRepair: boolean;
}

export interface PnrAuditResult {
  pnr: string;
  surname: string;
  airline: string;
  flightDate?: string;
  passengers: PassengerAudit[];
  overall: "REACHABLE" | "NOT_REACHABLE" | "UNVERIFIABLE" | "DECLINED";
  rawSsrs: SsrContact[];
  auditedAt: number;
}

/* ------------------------------------------------------------------ */
/* Repair proposal                                                    */
/* ------------------------------------------------------------------ */

export interface RepairProposal {
  passengerRef: string;
  ssrType: SsrType;
  value: string;
  reason: string; // plain-language explanation
  requiresConsent: boolean;
}
