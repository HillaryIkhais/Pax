import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

/* ------------------------------------------------------------------ */
/* PNR records (sandbox carrier records)                              */
/* ------------------------------------------------------------------ */

export const pnrs = sqliteTable("pnrs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pnr: text("pnr").notNull().unique(), // booking reference
  surname: text("surname").notNull(),
  airline: text("airline").notNull(),
  flightDate: text("flight_date"),
  sourceRecordId: text("source_record_id"), // carrier system record id
  rawPayload: text("raw_payload"), // verbatim JSON/text observed
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/* ------------------------------------------------------------------ */
/* Contact SSRs observed on a PNR                                     */
/* ------------------------------------------------------------------ */

export const contactSsrs = sqliteTable("contact_ssrs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pnrId: text("pnr_id").notNull().references(() => pnrs.id),
  type: text("type", { enum: ["CTCE", "CTCM", "CTCR"] }).notNull(),
  passengerRef: text("passenger_ref").notNull(), // P1, P2 ...
  segmentRef: text("segment_ref"),
  value: text("value"), // email / phone; null for CTCR
  sourceRecordId: text("source_record_id"),
  rawSourceText: text("raw_source_text").notNull(),
  observedAt: integer("observed_at").notNull(),
});

/* ------------------------------------------------------------------ */
/* Passenger verified contacts (entered by passenger, local only)     */
/* ------------------------------------------------------------------ */

export const verifiedContacts = sqliteTable("verified_contacts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull(),
  passengerRef: text("passenger_ref").notNull(),
  email: text("email"), // normalised
  phone: text("phone"), // normalised E.164
  declined: integer("declined", { mode: "boolean" }).notNull().default(false),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  phoneVerified: integer("phone_verified", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/* ------------------------------------------------------------------ */
/* Audit results                                                      */
/* ------------------------------------------------------------------ */

export const auditResults = sqliteTable("audit_results", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull(),
  pnr: text("pnr").notNull(),
  surname: text("surname").notNull(),
  overall: text("overall").notNull(), // REACHABLE | NOT_REACHABLE | UNVERIFIABLE | DECLINED
  rawSsrs: text("raw_ssrs").notNull(), // JSON
  passengers: text("passengers").notNull(), // JSON
  createdAt: integer("created_at").notNull(),
});

/* ------------------------------------------------------------------ */
/* Repair / consent records                                           */
/* ------------------------------------------------------------------ */

export const repairs = sqliteTable("repairs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull(),
  pnr: text("pnr").notNull(),
  passengerRef: text("passenger_ref").notNull(),
  ssrType: text("ssr_type", { enum: ["CTCE", "CTCM", "CTCR"] }).notNull(),
  value: text("value"),
  approved: integer("approved", { mode: "boolean" }).notNull().default(false),
  persisted: integer("persisted", { mode: "boolean" }).notNull().default(false),
  beforeDigest: text("before_digest"),
  afterDigest: text("after_digest"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

/* ------------------------------------------------------------------ */
/* Zod schemas                                                        */
/* ------------------------------------------------------------------ */

export const insertPnrSchema = createInsertSchema(pnrs, {
  pnr: z.string().min(1),
  surname: z.string().min(1),
  airline: z.string().min(1),
}).omit({ id: true, createdAt: true, updatedAt: true });

export const insertSsrSchema = createInsertSchema(contactSsrs, {
  type: z.enum(["CTCE", "CTCM", "CTCR"]),
  passengerRef: z.string().min(1),
  value: z.string().optional(),
  rawSourceText: z.string().min(1),
}).omit({ id: true, pnrId: true, observedAt: true });

export const verifiedContactSchema = z.object({
  sessionId: z.string().min(1),
  passengerRef: z.string().min(1),
  email: z.string().email().optional().nullable(),
  phone: z.string().min(1).optional().nullable(),
  declined: z.boolean().default(false),
  emailVerified: z.boolean().default(false),
  phoneVerified: z.boolean().default(false),
});

export const repairSchema = z.object({
  sessionId: z.string().min(1),
  pnr: z.string().min(1),
  passengerRef: z.string().min(1),
  ssrType: z.enum(["CTCE", "CTCM", "CTCR"]),
  value: z.string().optional().nullable(),
  approved: z.boolean().default(false),
});

export type NewPnr = typeof pnrs.$inferInsert;
export type Pnr = typeof pnrs.$inferSelect;
export type NewSsr = typeof contactSsrs.$inferInsert;
export type Ssr = typeof contactSsrs.$inferSelect;
export type NewAuditResult = typeof auditResults.$inferInsert;
export type NewRepair = typeof repairs.$inferInsert;
