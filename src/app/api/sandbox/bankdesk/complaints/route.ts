import { NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";
import { createHash } from "node:crypto";
import { z } from "zod";

const DATA_DIR = path.join(process.cwd(), "data", "sandbox", "bankdesk");
const COMPLAINTS_FILE = path.join(DATA_DIR, "complaints.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(COMPLAINTS_FILE)) {
  fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify([]));
}

function readComplaints(): Array<any> {
  return JSON.parse(fs.readFileSync(COMPLAINTS_FILE, "utf8"));
}
function writeComplaints(complaints: Array<any>): void {
  fs.writeFileSync(COMPLAINTS_FILE, JSON.stringify(complaints, null, 2));
}

const createSchema = z.object({
  bankName: z.string().min(1),
  amountDebited: z.coerce.number().positive(),
  amountDispensed: z.coerce.number().nonnegative().default(0),
  atmLocation: z.string().min(1),
  terminalId: z.string().optional(),
  transactionReference: z.string().optional(),
  transactionDateTime: z.string().optional(),
  evidenceIndex: z.string().optional(),
});

/* ------------------------------------------------------------------ */
/* MockBankDesk — bank complaint portal                               */
/* Clearly labelled sandbox. Persists complaints + references.        */
/* Duplicate detection: same bank + amount + datetime => same case.   */
/* ------------------------------------------------------------------ */

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation failed", issues: parsed.error.flatten() }, { status: 400 });
  }

  const complaints = readComplaints();
  const d = parsed.data;

  // Duplicate detection: same bank, amount, and transaction datetime => existing case
  const existing = complaints.find(
    (c: any) =>
      c.bankName === d.bankName &&
      c.amountDebited === d.amountDebited &&
      c.transactionDateTime === d.transactionDateTime
  );

  if (existing) {
    // Idempotent: return the existing reference, do NOT create a duplicate
    return NextResponse.json({
      ok: true,
      duplicate: true,
      reference: existing.reference,
      caseId: existing.id,
      status: existing.status,
      message: "Complaint already registered. Returning existing reference (idempotent).",
    });
  }

  const id = createHash("sha256").update(`${d.bankName}${d.amountDebited}${d.transactionDateTime}${Date.now()}`).digest("hex").slice(0, 12);
  const reference = `BD-${Date.now().toString().slice(-6)}-${id.slice(0, 4).toUpperCase()}`;

  const complaint = {
    id,
    reference,
    bankName: d.bankName,
    amountDebited: d.amountDebited,
    amountDispensed: d.amountDispensed,
    amountClaimed: Math.max(0, d.amountDebited - d.amountDispensed),
    atmLocation: d.atmLocation,
    terminalId: d.terminalId ?? null,
    transactionReference: d.transactionReference ?? null,
    transactionDateTime: d.transactionDateTime ?? null,
    evidenceIndex: d.evidenceIndex ?? null,
    status: "registered",
    createdAt: new Date().toISOString(),
  };

  complaints.push(complaint);
  writeComplaints(complaints);

  return NextResponse.json({
    ok: true,
    duplicate: false,
    reference,
    caseId: id,
    status: "registered",
    message: "Complaint registered. Reference issued.",
  }, { status: 201 });
}

/* ------------------------------------------------------------------ */
/* GET /api/sandbox/bankdesk/complaints?reference=...                 */
/* Lookup a complaint by reference.                                   */
/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  if (!reference) {
    return NextResponse.json({ error: "reference is required" }, { status: 400 });
  }

  const complaints = readComplaints();
  const complaint = complaints.find((c: any) => c.reference === reference);
  if (!complaint) {
    return NextResponse.json({ error: "no case found for this reference" }, { status: 404 });
  }
  return NextResponse.json({ ok: true, complaint });
}
