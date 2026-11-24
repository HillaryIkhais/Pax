import { NextResponse } from "next/server";
import { db, sqlite } from "@/lib/db/client";
import { cases } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { transition, type StateMachineContext } from "@/lib/rules/state-machine";
import { nowMs } from "@/lib/clock/clock";
import { z } from "zod";

const bodySchema = z.object({
  toStatus: z.enum([
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
  ]),
  reason: z.string().optional(),
  actor: z.enum(["system", "user", "kane"]).optional(),
  nowMs: z.coerce.number().optional(),
});

/* ------------------------------------------------------------------ */
/* POST /api/cases/[id]/transition                                    */
/* Advance the case state machine.                                    */
/* ------------------------------------------------------------------ */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const demoClock = request.headers.get("x-demo-clock");
  if (demoClock) {
    (globalThis as any).__cashcase_demo_clock = Number(demoClock);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const ctx: StateMachineContext = {
    caseId: id,
    toStatus: parsed.data.toStatus,
    actor: parsed.data.actor ?? "system",
    reason: parsed.data.reason,
    nowMs: parsed.data.nowMs ?? nowMs(),
  };

  const result = await transition(ctx);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  const updated = await db.query.cases.findFirst({ where: eq(cases.id, id) });
  return NextResponse.json({ ok: true, caseStatus: result.caseStatus, case: updated });
}
