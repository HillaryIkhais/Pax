import { NextResponse } from "next/server";
import { db, sqlite } from "@/lib/db/client";
import { cases } from "@/lib/db/schema";
import { insertCaseSchema, type NewCase } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { missingEvidence, isEvidenceComplete } from "@/lib/rules/state-machine";
import { nowMs } from "@/lib/clock/clock";

/* ------------------------------------------------------------------ */
/* GET /api/cases?bankComplaintReference=...                          */
/* List cases, optionally filter by bank complaint reference.         */
/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ref = searchParams.get("bankComplaintReference");
  const id = searchParams.get("id");

  try {
    if (id) {
      const c = await db.query.cases.findFirst({ where: eq(cases.id, id) });
      if (!c) return NextResponse.json({ error: "case not found" }, { status: 404 });
      return NextResponse.json({ case: c });
    }

    let rows;
    if (ref) {
      rows = await db
        .select()
        .from(cases)
        .where(eq(cases.bankComplaintReference, ref));
    } else {
      rows = await db.select().from(cases);
    }
    return NextResponse.json({ cases: rows });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

/* ------------------------------------------------------------------ */
/* POST /api/cases                                                    */
/* Create a new incident case. Starts in DRAFT.                       */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  const now = nowMs();
  const demoClock = request.headers.get("x-demo-clock");
  if (demoClock) {
    // Allow the caller to pin the demo clock (epoch ms)
    (globalThis as any).__cashcase_demo_clock = Number(demoClock);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Security: reject any forbidden fields outright
  const forbidden = ["pin", "otp", "bvn", "fullCardNumber", "password", "token"];
  for (const f of forbidden) {
    if (f in body) {
      return NextResponse.json({ error: `field ${f} is not accepted` }, { status: 400 });
    }
  }

  const parsed = insertCaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const data: NewCase = {
    ...parsed.data,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    demoClockOverride: null,
  };

  try {
    const [created] = await db.insert(cases).values(data).returning();
    return NextResponse.json({ case: created }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
