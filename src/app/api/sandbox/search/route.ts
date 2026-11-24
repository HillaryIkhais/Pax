import { NextResponse } from "next/server";
import { sqlite } from "@/lib/db/client";

/* ------------------------------------------------------------------ */
/* GET /api/sandbox/search?pnr=...&surname=...                        */
/* Carrier Sandbox: find a booking by PNR + surname.                  */
/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pnr = searchParams.get("pnr");
  const surname = searchParams.get("surname");

  if (!pnr || !surname) {
    return NextResponse.json({ error: "pnr and surname are required" }, { status: 400 });
  }

  try {
    const pnrRow = sqlite
      .prepare("SELECT * FROM pnrs WHERE pnr = ? AND surname = ?")
      .get(pnr.toUpperCase(), surname.toUpperCase()) as any;

    if (!pnrRow) {
      return NextResponse.json({ error: "booking not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      pnr: pnrRow.pnr,
      id: pnrRow.id,
      surname: pnrRow.surname,
      airline: pnrRow.airline,
      flightDate: pnrRow.flightDate,
      sourceRecordId: pnrRow.sourceRecordId,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
