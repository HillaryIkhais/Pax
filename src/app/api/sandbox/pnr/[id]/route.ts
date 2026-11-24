import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { pnrs, contactSsrs } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/* ------------------------------------------------------------------ */
/* GET /api/sandbox/pnr/[id]                                          */
/* Returns the PNR record and its contact SSRs.                       */
/* ------------------------------------------------------------------ */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const pnrRow = await db.query.pnrs.findFirst({ where: eq(pnrs.id, id) });
    if (!pnrRow) return NextResponse.json({ error: "PNR not found" }, { status: 404 });

    const ssrs = await db
      .select()
      .from(contactSsrs)
      .where(and(eq(contactSsrs.pnrId, id)));

    return NextResponse.json({
      ok: true,
      id: pnrRow.id,
      pnr: pnrRow.pnr,
      surname: pnrRow.surname,
      airline: pnrRow.airline,
      flightDate: pnrRow.flightDate,
      sourceRecordId: pnrRow.sourceRecordId,
      rawPayload: pnrRow.rawPayload,
      ssrs: ssrs.map((s) => ({
        id: s.id,
        type: s.type,
        passengerRef: s.passengerRef,
        segmentRef: s.segmentRef,
        value: s.value,
        sourceRecordId: s.sourceRecordId,
        rawSourceText: s.rawSourceText,
        observedAt: s.observedAt,
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
