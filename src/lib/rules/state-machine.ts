import { caseStates, type CaseStatus, type Case } from "../db/schema";
import { db, sqlite } from "../db/client";
import { stateTransitions, cases } from "../db/schema";
import { eq } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* CBN-aligned case state machine                                     */
/*                                                                     */
/* DRAFT → EVIDENCE_INCOMPLETE → READY_FOR_BANK →                      */
/* BANK_COMPLAINT_SUBMITTED → BANK_REFERENCE_RECORDED →                */
/* WAITING_FOR_CCMS_UPLOAD → BANK_RESOLUTION_WINDOW →                  */
/* ELIGIBLE_FOR_CBN_ESCALATION → CBN_ESCALATION_PREPARED →             */
/* RESOLVED / DISPUTED                                                 */
/*                                                                     */
/* Bank-first: the app must not offer CBN escalation before the        */
/* two-week bank resolution window.                                    */
/* ------------------------------------------------------------------ */

export type StateMachineContext = {
  caseId: string;
  toStatus: CaseStatus;
  actor?: "system" | "user" | "kane";
  reason?: string;
  nowMs?: number; // for test clock / time travel
};

/* Allowed transitions: from -> set of allowed to */
const ALLOWED: Record<CaseStatus, Set<CaseStatus>> = {
  DRAFT: new Set(["EVIDENCE_INCOMPLETE"]),
  EVIDENCE_INCOMPLETE: new Set(["READY_FOR_BANK", "DRAFT"]),
  READY_FOR_BANK: new Set(["BANK_COMPLAINT_SUBMITTED", "EVIDENCE_INCOMPLETE"]),
  BANK_COMPLAINT_SUBMITTED: new Set(["BANK_REFERENCE_RECORDED", "READY_FOR_BANK"]),
  BANK_REFERENCE_RECORDED: new Set(["WAITING_FOR_CCMS_UPLOAD", "BANK_COMPLAINT_SUBMITTED"]),
  WAITING_FOR_CCMS_UPLOAD: new Set(["BANK_RESOLUTION_WINDOW", "BANK_REFERENCE_RECORDED"]),
  BANK_RESOLUTION_WINDOW: new Set(["ELIGIBLE_FOR_CBN_ESCALATION", "WAITING_FOR_CCMS_UPLOAD", "RESOLVED"]),
  ELIGIBLE_FOR_CBN_ESCALATION: new Set(["CBN_ESCALATION_PREPARED", "BANK_RESOLUTION_WINDOW", "RESOLVED", "DISPUTED"]),
  CBN_ESCALATION_PREPARED: new Set(["RESOLVED", "DISPUTED"]),
  RESOLVED: new Set([]),
  DISPUTED: new Set([]),
};

/* ------------------------------------------------------------------ */
/* Transition                                                         */
/* ------------------------------------------------------------------ */

export async function transition(ctx: StateMachineContext): Promise<{
  ok: boolean;
  caseStatus?: CaseStatus;
  error?: string;
}> {
  const actor = ctx.actor ?? "system";
  const nowMs = ctx.nowMs ?? Date.now();

  const current = await db.query.cases.findFirst({ where: eq(cases.id, ctx.caseId) });
  if (!current) {
    return { ok: false, error: "case not found" };
  }
  const from = current.status as CaseStatus;
  const to = ctx.toStatus;

  if (from === to) {
    return { ok: true, caseStatus: from }; // idempotent no-op
  }

  const allowedTos = ALLOWED[from];
  if (!allowedTos || !allowedTos.has(to)) {
    return { ok: false, error: `transition ${from} → ${to} is not allowed` };
  }

  // Preconditions for target state
  if (to === "READY_FOR_BANK") {
    if (!(await isEvidenceComplete(current))) {
      return { ok: false, error: `precondition failed for ${to}: evidence incomplete` };
    }
  }
  if (to === "ELIGIBLE_FOR_CBN_ESCALATION") {
    if (!twoWeeksElapsedFor(current, nowMs)) {
      return { ok: false, error: `precondition failed for ${to}: two-week bank window not elapsed` };
    }
  }

  // Persist transition + update case in one transaction
  const transitionId = crypto.randomUUID();
  sqlite.exec("BEGIN");
  try {
    sqlite
      .prepare(
        `INSERT INTO state_transitions (id, case_id, from_status, to_status, reason, actor, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(transitionId, ctx.caseId, from, to, ctx.reason ?? null, actor, nowMs);

    sqlite
      .prepare(`UPDATE cases SET status = ?, updated_at = ? WHERE id = ?`)
      .run(to, nowMs, ctx.caseId);
    sqlite.exec("COMMIT");
  } catch (e) {
    sqlite.exec("ROLLBACK");
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  return { ok: true, caseStatus: to };
}

/* ------------------------------------------------------------------ */
/* Eligibility helpers (time-based, DST-independent, UTC internally)   */
/* ------------------------------------------------------------------ */

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
const CCMS_UPLOAD_DELAY_MS = 24 * 60 * 60 * 1000;

export function twoWeeksElapsedFor(c: Case, nowMs?: number): boolean {
  const now = nowMs ?? Date.now();
  const referenceTime = Number(c.updatedAt ?? c.createdAt);
  return now - referenceTime >= TWO_WEEKS_MS;
}

export function ccmsUploadReadyFor(c: Case, nowMs?: number): boolean {
  const now = nowMs ?? Date.now();
  const referenceTime = Number(c.updatedAt ?? c.createdAt);
  return now - referenceTime >= CCMS_UPLOAD_DELAY_MS;
}

/* ------------------------------------------------------------------ */
/* Can the case advance to CBN escalation right now?                   */
/* ------------------------------------------------------------------ */

export function canEscalateToCBN(c: Case, nowMs?: number): boolean {
  if (c.status !== "BANK_RESOLUTION_WINDOW" && c.status !== "ELIGIBLE_FOR_CBN_ESCALATION") {
    return false;
  }
  return twoWeeksElapsedFor(c, nowMs);
}

/* ------------------------------------------------------------------ */
/* All next actions for a case (used by the timeline UI)              */
/* ------------------------------------------------------------------ */

export function nextActions(c: Case, nowMs?: number): Array<{
  action: string;
  dueMs?: number;
  blocked?: boolean;
  reason?: string;
}> {
  const now = nowMs ?? Date.now();
  const actions: Array<{ action: string; dueMs?: number; blocked?: boolean; reason?: string }> = [];

  switch (c.status) {
    case "DRAFT":
      actions.push({ action: "Enter incident facts", blocked: false });
      break;
    case "EVIDENCE_INCOMPLETE":
      actions.push({ action: "Add missing evidence", blocked: false });
      break;
    case "READY_FOR_BANK":
      actions.push({ action: "Lodge complaint with your bank and get a reference", blocked: false });
      break;
    case "BANK_COMPLAINT_SUBMITTED":
      actions.push({ action: "Record the bank complaint reference", blocked: false });
      break;
    case "BANK_REFERENCE_RECORDED":
      actions.push({ action: "Wait 24h for bank to upload to CCMS, then check status", blocked: false });
      break;
    case "WAITING_FOR_CCMS_UPLOAD":
      actions.push({
        action: "Check CCMS portal status with your bank reference",
        blocked: true,
        reason: "24-hour upload delay not yet elapsed",
      });
      break;
    case "BANK_RESOLUTION_WINDOW":
      actions.push({
        action: "Wait for bank resolution (two-week window)",
        blocked: true,
        reason: "Two-week bank window not yet elapsed",
      });
      break;
    case "ELIGIBLE_FOR_CBN_ESCALATION":
      actions.push({ action: "Prepare CBN escalation packet with bank reference", blocked: false });
      break;
    case "CBN_ESCALATION_PREPARED":
      actions.push({ action: "Submit escalation to CBN Consumer Protection Department", blocked: false });
      break;
    default:
      break;
  }
  return actions;
}

/* ------------------------------------------------------------------ */
/* Evidence completeness engine                                       */
/* ------------------------------------------------------------------ */

export function missingEvidence(c: Case): Array<string> {
  const missing: Array<string> = [];
  if (!c.evidenceAlertUrl) missing.push("Transaction alert or statement excerpt");
  if (!c.transactionReference && !c.terminalId) missing.push("Transaction reference or terminal ID");
  if (!c.atmLocation) missing.push("ATM location");
  return missing;
}

export function isEvidenceComplete(c: Case): boolean {
  return missingEvidence(c).length === 0;
}

/* ------------------------------------------------------------------ */
/* Amount claimed (debited minus dispensed)                           */
/* ------------------------------------------------------------------ */

export function amountClaimed(c: Case): number {
  return Math.max(0, c.amountDebited - c.amountDispensed);
}

/* ------------------------------------------------------------------ */
/* Case classification (own-bank vs other-bank)                       */
/* ------------------------------------------------------------------ */

export function caseClassification(c: Case): "own-bank" | "other-bank" {
  return c.atmType === "own" ? "own-bank" : "other-bank";
}
