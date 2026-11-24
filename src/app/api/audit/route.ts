import { NextResponse } from "next/server";
import { auditPnrContact } from "@/lib/audit/engine";
import type { SsrContact, VerifiedContact } from "@/lib/rules/ssr-types";

/* ------------------------------------------------------------------ */
/* POST /api/audit                                                    */
/* Run the deterministic PNR contact audit.                           */
/* Body: { pnr, surname, airline, flightDate?, ssrs[], verifiedContacts[] } */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const { pnr, surname, airline, flightDate, ssrs, verifiedContacts } = body;

  if (!pnr || !surname || !airline) {
    return NextResponse.json({ error: "pnr, surname, airline required" }, { status: 400 });
  }

  const normalizedSsrs: SsrContact[] = (ssrs ?? []).map((s: any) => ({
    type: s.type,
    passengerRef: s.passengerRef,
    segmentRef: s.segmentRef,
    value: s.value,
    sourceRecordId: s.sourceRecordId,
    rawSourceText: s.rawSourceText,
    observedAt: s.observedAt ?? Date.now(),
  }));

  const normalizedContacts: VerifiedContact[] = (verifiedContacts ?? []).map((c: any) => ({
    passengerRef: c.passengerRef,
    email: c.email,
    phone: c.phone,
    declined: !!c.declined,
  }));

  const result = auditPnrContact({
    pnr,
    surname,
    airline,
    flightDate,
    ssrs: normalizedSsrs,
    verifiedContacts: normalizedContacts,
  });

  return NextResponse.json({ ok: true, result });
}
