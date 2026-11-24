import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Cases                                                              */
/* ------------------------------------------------------------------ */

export const cases = sqliteTable("cases", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),

  // Incident facts
  atmType: text("atm_type", { enum: ["own", "other"] }).notNull(), // own-bank or other-bank ATM
  bankName: text("bank_name").notNull(),
  transactionDateTime: text("transaction_date_time").notNull(), // ISO string
  timezone: text("timezone").notNull().default("Africa/Lagos"),
  amountDebited: real("amount_debited").notNull(),
  amountDispensed: real("amount_dispensed").notNull().default(0),
  atmLocation: text("atm_location").notNull(),
  atmOperator: text("atm_operator"),
  terminalId: text("terminal_id"),
  transactionReference: text("transaction_reference"),

  // Complaint references
  bankComplaintReference: text("bank_complaint_reference"), // reference issued by the bank after lodging
  ccmsReference: text("ccms_reference"),

  // Evidence
  evidenceAlertUrl: text("evidence_alert_url"), // local path/hash reference
  evidenceReceiptUrl: text("evidence_receipt_url"), // optional
  evidenceHash: text("evidence_hash"), // sha256 of primary attachment
  evidenceVersion: integer("evidence_version").notNull().default(1),

  // State machine
  status: text("status").notNull().default("DRAFT"),

  // Time-travel / demo clock overrides (stored as epoch ms; null = use real time)
  demoClockOverride: integer("demo_clock_override"),

  // Security: explicitly null — we never store these
  // pin, otp, bvn, fullCardNumber are intentionally absent from this schema
});

export const caseStates = [
  "DRAFT",
  "EVIDENCE_INCOMPLETE",
  "READY_FOR_BANK",
  "BANK_COMPLAINT_SUBMITTED",
  "BANK_REFERENCE_RECORDED",
  "WAITING_FOR_CCMS_UPLOAD",
  "BANK_RESOLUTION_WINDOW",
  "ELIGIBLE_FOR_CBN_ESCALATION",
  "CBN_ESCALATION_PREPARED",
  "RESOLVED",
  "DISPUTED",
] as const;

export type CaseStatus = (typeof caseStates)[number];

/* ------------------------------------------------------------------ */
/* Evidence versions                                                  */
/* ------------------------------------------------------------------ */

export const evidenceVersions = sqliteTable("evidence_versions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  caseId: text("case_id").notNull().references(() => cases.id),
  version: integer("version").notNull(),
  field: text("field").notNull(), // e.g. "evidence_alert", "evidence_receipt"
  sourceUrl: text("source_url").notNull(), // local storage path
  hash: text("hash").notNull(), // sha256 of the stored file
  size: integer("size").notNull(),
  page: text("page"), // source page if available
  region: text("region"), // source region if available
  extractedValue: text("extracted_value"), // user-confirmed or suggested value
  createdAt: integer("created_at").notNull(),
});

/* ------------------------------------------------------------------ */
/* State transitions (audit trail)                                    */
/* ------------------------------------------------------------------ */

export const stateTransitions = sqliteTable("state_transitions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  caseId: text("case_id").notNull().references(() => cases.id),
  fromStatus: text("from_status").notNull(),
  toStatus: text("to_status").notNull(),
  reason: text("reason"),
  actor: text("actor").notNull().default("system"), // system | user | kane
  createdAt: integer("created_at").notNull(),
});

/* ------------------------------------------------------------------ */
/* Zod schemas                                                        */
/* ------------------------------------------------------------------ */

export const insertCaseSchema = z
  .object({
    atmType: z.enum(["own", "other"]),
    bankName: z.string().min(1, "Bank name is required"),
    transactionDateTime: z.string().min(1, "Transaction date/time is required"),
    timezone: z.string().min(1),
    amountDebited: z.coerce.number().positive("Amount debited must be positive"),
    amountDispensed: z.coerce.number().nonnegative("Amount dispensed cannot be negative").default(0),
    atmLocation: z.string().min(1, "ATM location is required"),
    atmOperator: z.string().optional(),
    terminalId: z.string().optional(),
    transactionReference: z.string().optional(),
    evidenceVersion: z.coerce.number().int().nonnegative().default(1),
  })
  .strict();

export const selectCaseSchema = createSelectSchema(cases);

export const transitionSchema = z.object({
  caseId: z.string().uuid(),
  toStatus: z.enum(caseStates),
  reason: z.string().optional(),
  actor: z.enum(["system", "user", "kane"]).default("system"),
});

export const evidenceUploadSchema = z.object({
  caseId: z.string().uuid(),
  field: z.enum(["evidence_alert", "evidence_receipt"]),
  sourceUrl: z.string(),
  hash: z.string(),
  size: z.number().int().nonnegative(),
  page: z.string().optional(),
  region: z.string().optional(),
  extractedValue: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/* Security: fields that must NEVER be accepted or logged             */
/* ------------------------------------------------------------------ */

export const FORBIDDEN_FIELDS = [
  "pin",
  "otp",
  "bvn",
  "fullCardNumber",
  "password",
  "token",
] as const;

export type ForbiddenField = (typeof FORBIDDEN_FIELDS)[number];

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type NewCase = typeof cases.$inferInsert;
export type Case = typeof cases.$inferSelect;
export type NewEvidenceVersion = typeof evidenceVersions.$inferInsert;
export type NewStateTransition = typeof stateTransitions.$inferInsert;
