import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { cases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateSchema = z.object({
  bankName: z.string().optional(),
  transactionDateTime: z.string().optional(),
  timezone: z.string().optional(),
  amountDebited: z.coerce.number().positive().optional(),
  amountDispensed: z.coerce.number().nonnegative().optional(),
  atmLocation: z.string().optional(),
  atmOperator: z.string().optional(),
  terminalId: z.string().optional(),
  transactionReference: z.string().optional(),
  bankComplaintReference: z.string().optional(),
  evidenceAlertUrl: z.string().optional(),
  evidenceReceiptUrl: z.string().optional(),
  evidenceHash: z.string().optional(),
  evidenceVersion: z.coerce.number().int().nonnegative().optional(),
});

/* ------------------------------------------------------------------ */
/* GET /api/cases/[id]                                                */
/* ------------------------------------------------------------------ */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const c = await db.query.cases.findFirst({ where: eq(cases.id, id) });
  if (!c) return NextResponse.json({ error: "case not found" }, { status: 404 });
  return NextResponse.json({ case: c });
}

/* ------------------------------------------------------------------ */
/* PATCH /api/cases/[id]                                              */
/* Update incident fields. Auto-advances DRAFT -> EVIDENCE_INCOMPLETE */
/* when facts are entered.                                            */
/* ------------------------------------------------------------------ */

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await request.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const { id } = await params;
  const existing = await db.query.cases.findFirst({ where: eq(cases.id, id) });
  if (!existing) return NextResponse.json({ error: "case not found" }, { status: 404 });

  const now = Date.now();
  const updates: Record<string, unknown> = { ...parsed.data, updatedAt: now };

  // Auto state-machine advancement: once facts entered, move DRAFT -> EVIDENCE_INCOMPLETE
  let nextStatus = existing.status;
  if (existing.status === "DRAFT" && (updates.bankName || updates.atmLocation || updates.amountDebited !== undefined)) {
    nextStatus = "EVIDENCE_INCOMPLETE";
  }
  updates.status = nextStatus;

  try {
    const [updated] = await db.update(cases).set(updates).where(eq(cases.id, id)).returning();
    return NextResponse.json({ case: updated });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
