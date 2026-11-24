import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { cases, evidenceVersions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createHash } from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

const EVIDENCE_DIR = path.join(process.cwd(), "data", "evidence");
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

/* ------------------------------------------------------------------ */
/* POST /api/cases/[id]/evidence                                      */
/* Upload + hash an evidence attachment. Creates a new evidence       */
/* version whenever a file is replaced.                               */
/* ------------------------------------------------------------------ */

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;

  const c = await db.query.cases.findFirst({ where: eq(cases.id, caseId) });
  if (!c) return NextResponse.json({ error: "case not found" }, { status: 404 });

  const form = await request.formData();
  const file = form.get("file") as File | null;
  const field = form.get("field") as string | null;
  const page = form.get("page") as string | null;
  const region = form.get("region") as string | null;
  const extractedValue = form.get("extractedValue") as string | null;

  if (!file || !field) {
    return NextResponse.json({ error: "file and field are required" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const hash = createHash("sha256").update(buffer).digest("hex");

  // Store file under data/evidence/<caseId>/<field>-<hash><ext>
  const ext = file.name.includes(".") ? path.extname(file.name) : "";
  const caseDir = path.join(EVIDENCE_DIR, caseId);
  if (!fs.existsSync(caseDir)) fs.mkdirSync(caseDir, { recursive: true });
  const fileName = `${field}-${hash}${ext}`;
  const filePath = path.join(caseDir, fileName);
  const sourceUrl = path.relative(process.cwd(), filePath);
  fs.writeFileSync(filePath, buffer);

  // Determine next version number for this field on this case
  const existingVersions = await db
    .select()
    .from(evidenceVersions)
    .where(and(eq(evidenceVersions.caseId, caseId), eq(evidenceVersions.field, field)));
  const nextVersion = (Math.max(...existingVersions.map((v: any) => v.version), 0) + 1);

  await db.insert(evidenceVersions).values({
    caseId,
    version: nextVersion,
    field,
    sourceUrl,
    hash,
    size: buffer.length,
    page: page ?? null,
    region: region ?? null,
    extractedValue: extractedValue ?? null,
    createdAt: Date.now(),
  });

  // Update the case's primary evidence reference
  const updates: Record<string, unknown> = {
    updatedAt: Date.now(),
    evidenceVersion: nextVersion,
  };
  if (field === "evidence_alert") {
    updates.evidenceAlertUrl = sourceUrl;
    updates.evidenceHash = hash;
  } else {
    updates.evidenceReceiptUrl = sourceUrl;
  }

  const [updated] = await db.update(cases).set(updates).where(eq(cases.id, caseId)).returning();

  return NextResponse.json({
    ok: true,
    version: nextVersion,
    hash,
    size: buffer.length,
    sourceUrl,
    case: updated,
  });
}

/* ------------------------------------------------------------------ */
/* GET /api/cases/[id]/evidence                                       */
/* List evidence versions for a case.                                 */
/* ------------------------------------------------------------------ */

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params;
  const versions = await db
    .select()
    .from(evidenceVersions)
    .where(eq(evidenceVersions.caseId, caseId));
  return NextResponse.json({ versions });
}
