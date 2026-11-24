import { NextResponse } from "next/server";
import * as fs from "node:fs";
import * as path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data", "sandbox", "bankdesk");
const COMPLAINTS_FILE = path.join(DATA_DIR, "complaints.json");

const CCMS_UPLOAD_DELAY_MS = 24 * 60 * 60 * 1000; // 24 hours

function readComplaints(): Array<any> {
  if (!fs.existsSync(COMPLAINTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(COMPLAINTS_FILE, "utf8"));
}

/* ------------------------------------------------------------------ */
/* MockCCMS — regulator-side status lookup                            */
/* Only exposes a complaint after the 24-hour bank-upload delay       */
/* has elapsed, and requires the original bank reference.             */
/* Clearly labelled sandbox.                                          */
/* ------------------------------------------------------------------ */

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get("reference");
  const nowParam = searchParams.get("now"); // optional demo clock (epoch ms)

  if (!reference) {
    return NextResponse.json({ error: "bank reference is required" }, { status: 400 });
  }

  const complaints = readComplaints();
  const complaint = complaints.find((c: any) => c.reference === reference);
  if (!complaint) {
    return NextResponse.json({ error: "no case found for this reference" }, { status: 404 });
  }

  const now = nowParam ? Number(nowParam) : Date.now();
  const createdAt = new Date(complaint.createdAt).getTime();
  const elapsed = now - createdAt;
  const uploaded = elapsed >= CCMS_UPLOAD_DELAY_MS;

  const remainingMs = Math.max(0, CCMS_UPLOAD_DELAY_MS - elapsed);

  return NextResponse.json({
    ok: true,
    reference,
    complaintId: complaint.id,
    bankName: complaint.bankName,
    status: complaint.status,
    createdAt: complaint.createdAt,
    uploadDelayMs: CCMS_UPLOAD_DELAY_MS,
    elapsedMs: elapsed,
    uploaded, // true only after 24h
    available: uploaded, // whether CCMS exposes the case
    remainingMs,
    message: uploaded
      ? "Complaint uploaded to CCMS. Status available."
      : `Complaint not yet uploaded by bank. Check back in ${Math.ceil(remainingMs / 1000 / 60)} minutes (24-hour upload delay).`,
  });
}
