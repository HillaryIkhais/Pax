import { NextResponse } from "next/server";
import { db, sqlite } from "@/lib/db/client";
import { pnrs, contactSsrs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

const bodySchema = z.object({
  passengerRef: z.string().min(1),
  ssrType: z.enum(["CTCE", "CTCM", "CTCR"]),
  value: z.string().optional().nullable(),
  approved: z.boolean(),
});

const FALSE_SAVE_PNR = process.env.NEXT_PUBLIC_FALSE_SAVE_PNR || "FS7777";

/* ------------------------------------------------------------------ */
/* POST /api/sandbox/pnr/[id]/contact                                 */
/* Apply an approved contact correction.                              */
/*                                                                     */
/* Deliberate false-save scenario: when the PNR equals                */
/* NEXT_PUBLIC_FALSE_SAVE_PNR (default FS7777), the API returns a     */
/* green "Saved" response but does NOT persist the change. Kane must  */
/* catch this on fresh retrieval.                                      */
/* ------------------------------------------------------------------ */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const pnrRow = await db.query.pnrs.findFirst({ where: eq(pnrs.id, id) });
  if (!pnrRow) return NextResponse.json({ error: "PNR not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { passengerRef, ssrType, value, approved } = parsed.data;

  if (!approved) {
    return NextResponse.json(
      { error: "contact update not approved by passenger" },
      { status: 400 }
    );
  }

  /* Persist: upsert the SSR for this passenger/type.                 */
  const now = Date.now();
  const existing = await db
    .select()
    .from(contactSsrs)
    .where(
      and(
        eq(contactSsrs.pnrId, id),
        eq(contactSsrs.passengerRef, passengerRef),
        eq(contactSsrs.type, ssrType)
      )
    );

  const target = existing[0];

  if (ssrType === "CTCR") {
    /* Declined: remove email/phone SSRs for this passenger, add CTCR */
    await sqlite.exec("BEGIN");
    try {
      if (target) {
        sqlite
          .prepare("DELETE FROM contact_ssrs WHERE id = ?")
          .run(target.id);
      }
      /* Remove other contact types for this passenger */
      sqlite
        .prepare(
          "DELETE FROM contact_ssrs WHERE pnr_id = ? AND passenger_ref = ? AND type IN ('CTCE','CTCM')"
        )
        .run(id, passengerRef);
      sqlite
        .prepare(
          "INSERT INTO contact_ssrs (id, pnr_id, type, passenger_ref, value, source_record_id, raw_source_text, observed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .run(
          crypto.randomUUID(),
          id,
          "CTCR",
          passengerRef,
          null,
          "ctcr-" + crypto.randomUUID().slice(0, 8),
          `CTCR passenger ${passengerRef} declined contact`,
          now
        );
      sqlite
        .prepare("UPDATE pnrs SET updated_at = ? WHERE id = ?")
        .run(now, id);
      sqlite.exec("COMMIT");
    } catch {
      sqlite.exec("ROLLBACK");
      throw new Error("failed to persist declined contact");
    }
  } else {
    /* Email or phone: upsert. Remove any CTCR for this passenger.    */
    await sqlite.exec("BEGIN");
    try {
      sqlite
        .prepare(
          "DELETE FROM contact_ssrs WHERE pnr_id = ? AND passenger_ref = ? AND type = 'CTCR'"
        )
        .run(id, passengerRef);

      if (target) {
        sqlite
          .prepare(
            "UPDATE contact_ssrs SET value = ?, raw_source_text = ?, observed_at = ? WHERE id = ?"
          )
          .run(
            value ?? null,
            `${ssrType} ${value ?? ""} (updated by passenger)`,
            now,
            target.id
          );
      } else {
        sqlite
          .prepare(
            "INSERT INTO contact_ssrs (id, pnr_id, type, passenger_ref, value, source_record_id, raw_source_text, observed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
          )
          .run(
            crypto.randomUUID(),
            id,
            ssrType,
            passengerRef,
            value ?? null,
            `${ssrType.toLowerCase()}-${crypto.randomUUID().slice(0, 8)}`,
            `${ssrType} ${value ?? ""} (updated by passenger)`,
            now
          );
      }
      sqlite
        .prepare("UPDATE pnrs SET updated_at = ? WHERE id = ?")
        .run(now, id);
      sqlite.exec("COMMIT");
    } catch {
      sqlite.exec("ROLLBACK");
      throw new Error("failed to persist contact update");
    }
  }

  return NextResponse.json({
    ok: true,
    saved: true,
    falseSave: false,
    message: "Contact updated and persisted.",
    passengerRef,
    ssrType,
    value: value ?? null,
  });
}
