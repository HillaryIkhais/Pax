"use client";

import { useState, useCallback } from "react";
import { Search, Plane, Phone, Mail, ShieldCheck, RefreshCw, FileText, ChevronRight, AlertCircle } from "lucide-react";

type Step =
  | "start"
  | "booking"
  | "verify"
  | "audit"
  | "consent"
  | "repair"
  | "reverify"
  | "receipt"
  | "done";

const DEMO_PNRS = [
  { pnr: "AX1234", surname: "OKONKWO", label: "Agent-only contact (agency email/phone)", issue: "AGENCY_CONTACT_ONLY" },
  { pnr: "BY5678", surname: "ADEBAYO", label: "Contact on wrong passenger (two adults)", issue: "MISASSIGNED_TO_OTHER_PASSENGER" },
  { pnr: "CZ9012", surname: "IBRAHIM", label: "Passenger declined contact (CTCR)", issue: "PASSENGER_DECLINED" },
  { pnr: "DX3456", surname: "SANUSI", label: "Already correct (no change needed)", issue: "PASSENGER_CONTACT_MATCH" },
  { pnr: "FS7777", surname: "FALSE", label: "False-save bug demo (Kane catches it)", issue: "FALSE_SAVE" },
] as const;

export default function PaxPage() {
  const [step, setStep] = useState<Step>("start");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  /* Booking form */
  const [booking, setBooking] = useState({
    airline: "MockAir",
    pnr: "",
    surname: "",
    flightDate: "",
  });

  /* Resolved sandbox booking */
  const [sandbox, setSandbox] = useState<{
    id: string;
    pnr: string;
    surname: string;
    airline: string;
    flightDate: string;
    ssrs: Array<{
      type: string;
      passengerRef: string;
      value: string | null;
      rawSourceText: string;
    }>;
  } | null>(null);

  /* Verified contacts entered by passenger */
  const [contacts, setContacts] = useState<Record<string, { email: string; phone: string; declined: boolean }>>({});
  const [contactVerified, setContactVerified] = useState<Record<string, { email: boolean; phone: boolean }>>({});

  /* Audit result */
  const [audit, setAudit] = useState<any>(null);

  /* Repair */
  const [proposals, setProposals] = useState<Array<{
    passengerRef: string;
    ssrType: string;
    value: string;
    reason: string;
    approved: boolean;
  }>>([]);
  const [repairResult, setRepairResult] = useState<any>(null);
  const [falseSaveNotice, setFalseSaveNotice] = useState(false);

  /* Re-verify */
  const [reverifyResult, setReverifyResult] = useState<any>(null);

  const clearMessages = () => { setError(null); setMessage(null); };

  /* ---------- Step: start -> booking ---------- */
  const loadBooking = async (pnr: string, surname: string) => {
    clearMessages();
    setLoading(true);
    try {
      const res = await fetch(
        `/api/sandbox/search?pnr=${encodeURIComponent(pnr)}&surname=${encodeURIComponent(surname)}`
      );
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Booking not found");
        setLoading(false);
        return;
      }

      /* Fetch full PNR + SSRs */
      const pnrRes = await fetch(`/api/sandbox/pnr/${json.id}`);
      const pnrJson = await pnrRes.json();
      if (!pnrJson.ok) {
        setError(pnrJson.error || "Failed to load booking");
        setLoading(false);
        return;
      }

      setSandbox({
        id: json.id,
        pnr: json.pnr,
        surname: json.surname,
        airline: json.airline,
        flightDate: json.flightDate,
        ssrs: pnrJson.ssrs,
      });

      /* Init contact state per passenger */
      const passengerRefs: string[] = Array.from(
        new Set((pnrJson.ssrs as any[]).map((s: any) => s.passengerRef))
      );
      const newContacts: Record<string, { email: string; phone: string; declined: boolean }> = {};
      const newVerified: Record<string, { email: boolean; phone: boolean }> = {};
      passengerRefs.forEach((ref: string) => {
        newContacts[ref] = { email: "", phone: "", declined: false };
        newVerified[ref] = { email: false, phone: false };
      });
      setContacts(newContacts);
      setContactVerified(newVerified);

      setStep("verify");
      setMessage("Booking loaded. Now enter and verify each passenger's own contact details.");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadDemo = async (p: (typeof DEMO_PNRS)[number]) => {
    setBooking({ airline: "MockAir", pnr: p.pnr, surname: p.surname, flightDate: "" });
    clearMessages();
    await loadBooking(p.pnr, p.surname);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await loadBooking(booking.pnr, booking.surname);
  };

  /* ---------- Step: verify ---------- */
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!sandbox) return;

    const verifiedContacts: any[] = [];
    Object.entries(contacts).forEach(([ref, c]) => {
      if (c.declined) {
        verifiedContacts.push({ passengerRef: ref, declined: true });
      } else {
        if (c.email) verifiedContacts.push({ passengerRef: ref, email: c.email });
        if (c.phone) verifiedContacts.push({ passengerRef: ref, phone: c.phone });
      }
    });

    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pnr: sandbox.pnr,
          surname: sandbox.surname,
          airline: sandbox.airline,
          flightDate: sandbox.flightDate,
          ssrs: sandbox.ssrs,
          verifiedContacts,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error || "Audit failed");
        return;
      }
      setAudit(json.result);

      /* Build repair proposals */
      const proposals: any[] = [];
      json.result.passengers.forEach((pa: any) => {
        const vc = verifiedContacts.find((v: any) => v.passengerRef === pa.passengerRef);
        const matchEmail = pa.verdicts.some((v: any) => v.verdict === "PASSENGER_CONTACT_MATCH" && v.ssrType === "CTCE");
        const matchPhone = pa.verdicts.some((v: any) => v.verdict === "PASSENGER_CONTACT_MATCH" && v.ssrType === "CTCM");
        if (vc && vc.email && !matchEmail) {
          const obs = pa.verdicts.find((v: any) => v.verdict === "MISSING_EMAIL" || v.verdict === "MALFORMED_CONTACT");
          proposals.push({
            passengerRef: pa.passengerRef,
            ssrType: "CTCE",
            value: vc.email,
            reason: obs?.message || "Your verified email is missing or incorrect on this passenger.",
            approved: false,
          });
        }
        if (vc && vc.phone && !matchPhone) {
          const obs = pa.verdicts.find((v: any) => v.verdict === "MISSING_MOBILE" || v.verdict === "MALFORMED_CONTACT");
          proposals.push({
            passengerRef: pa.passengerRef,
            ssrType: "CTCM",
            value: vc.phone,
            reason: obs?.message || "Your verified phone is missing or incorrect on this passenger.",
            approved: false,
          });
        }
      });
      setProposals(proposals);
      setStep("audit");
    } catch (e: any) {
      setError(e.message);
    }
  };

  /* ---------- Step: consent / repair ---------- */
  const toggleProposal = (i: number) => {
    setProposals((prev) =>
      prev.map((p, idx) => (idx === i ? { ...p, approved: !p.approved } : p))
    );
  };

  const handleRepairSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    if (!sandbox) return;

    const toApply = proposals.filter((p) => p.approved);
    if (toApply.length === 0) {
      setError("Please approve at least one correction.");
      return;
    }

    /* Consent statement shown in UI; here we just apply each approved proposal. */
    const results: any[] = [];
    for (const prop of toApply) {
      try {
        const res = await fetch(`/api/sandbox/pnr/${sandbox.id}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            passengerRef: prop.passengerRef,
            ssrType: prop.ssrType,
            value: prop.value,
            approved: true,
          }),
        });
        const json = await res.json();
        results.push({ ...prop, result: json });

        if (json.falseSave) {
          setFalseSaveNotice(true);
          setRepairResult({ results, falseSave: true });
          setStep("repair");
          return;
        }
      } catch (e: any) {
        results.push({ ...prop, result: { ok: false, error: e.message } });
      }
    }

    setRepairResult({ results, falseSave: false });
    setStep("repair");
  };

  /* ---------- Step: re-verify (independent read-back) ---------- */
  const handleReverify = async () => {
    if (!sandbox) return;
    setLoading(true);
    clearMessages();
    try {
      const pnrRes = await fetch(`/api/sandbox/pnr/${sandbox.id}`);
      const pnrJson = await pnrRes.json();
      if (!pnrJson.ok) {
        setError(pnrJson.error || "Failed to reload booking");
        setLoading(false);
        return;
    }

      /* Re-run audit with the same verified contacts */
      const verifiedContacts: any[] = [];
      Object.entries(contacts).forEach(([ref, c]) => {
        if (c.declined) verifiedContacts.push({ passengerRef: ref, declined: true });
        else {
          if (c.email) verifiedContacts.push({ passengerRef: ref, email: c.email });
          if (c.phone) verifiedContacts.push({ passengerRef: ref, phone: c.phone });
        }
      });

      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pnr: sandbox.pnr,
          surname: sandbox.surname,
          airline: sandbox.airline,
          flightDate: sandbox.flightDate,
          ssrs: pnrJson.ssrs,
          verifiedContacts,
        }),
      });
      const json = await res.json();
      setReverifyResult({ before: audit, after: json.result, ssrs: pnrJson.ssrs });
      setStep("reverify");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const receiptVerified = reverifyResult?.after?.overall === "REACHABLE";

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-pax-dark">
          Your flight is booked. Can the airline reach <span className="text-pax">YOU</span>?
        </h1>
        <p className="text-slate-600 mt-2">
          PAX checks whether your airline booking record contains <strong>your own</strong> contact details
          — not just the travel agent's. It verifies passenger-to-contact association, helps correct the record with
          your consent, and independently proves the change persisted.
        </p>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-lg border bg-green-50 border-green-200 text-green-800 text-sm" role="status" aria-live="polite">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-lg border bg-red-50 border-red-200 text-red-800 text-sm" role="alert">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <div className="mb-4 text-sm text-slate-500">Loading…</div>}

      {/* STEP: start */}
      {step === "start" && (
        <div className="card p-8 text-center">
          <h2 className="text-xl font-semibold mb-4">Start a contact check</h2>
          <p className="text-slate-600 mb-6">
            Try a seeded carrier-sandbox booking, or enter your own booking reference (sandbox only).
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {DEMO_PNRS.map((p) => (
              <button
                key={p.pnr}
                onClick={() => loadDemo(p)}
                className="w-full p-4 rounded-lg border text-left hover:bg-pax-light/50 transition"
              >
                <div className="font-mono text-xs text-slate-500 mb-1">{p.pnr} · {p.surname}</div>
                <div className="font-medium text-slate-800">{p.label}</div>
                <div className="text-xs text-slate-500 mt-1">{p.issue}</div>
              </button>
            ))}
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-slate-500 mb-3">Or enter your booking</h3>
            <form onSubmit={handleBookingSubmit} className="space-y-3 max-w-xs mx-auto">
              <input
                value={booking.pnr}
                onChange={(e) => setBooking({ ...booking, pnr: e.target.value })}
                placeholder="Booking reference (PNR)"
                className="w-full p-2 border rounded bg-white"
                required
              />
              <input
                value={booking.surname}
                onChange={(e) => setBooking({ ...booking, surname: e.target.value })}
                placeholder="Surname"
                className="w-full p-2 border rounded bg-white"
                required
              />
              <button type="submit" className="w-full bg-pax-dark text-white px-4 py-2 rounded font-semibold">
                Load booking
              </button>
            </form>
          </div>
        </div>
      )}

      {/* STEP: booking loaded -> verify contacts */}
      {step === "verify" && sandbox && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Verify passenger contacts</h2>
            <span className="font-mono text-xs text-slate-500">{sandbox.pnr} · {sandbox.surname}</span>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Enter each passenger's own email and phone. We only use this to compare against the airline record — we
            do not send it anywhere.
          </p>
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            {Object.entries(contacts).map(([ref, c]) => (
              <div key={ref} className="card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-pax" />
                  <span className="font-medium">Passenger {ref}</span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={c.declined}
                    onChange={(e) =>
                      setContacts({
                        ...contacts,
                        [ref]: { ...c, declined: e.target.checked },
                      })
                    }
                    className="rounded text-pax"
                  />
                  {c.declined ? "This passenger declines to share contact details" : "Enter contact details"}
                </label>
                {!c.declined ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                        <input
                          type="email"
                          value={c.email}
                          onChange={(e) =>
                            setContacts({ ...contacts, [ref]: { ...c, email: e.target.value } })
                          }
                          placeholder="you@example.com"
                          className="w-full p-2 border rounded bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Mobile</label>
                        <input
                          type="tel"
                          value={c.phone}
                          onChange={(e) =>
                            setContacts({ ...contacts, [ref]: { ...c, phone: e.target.value } })
                          }
                          placeholder="+234 801 234 5678"
                          className="w-full p-2 border rounded bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() =>
                          setContactVerified({
                            ...contactVerified,
                            [ref]: { email: !contactVerified[ref]?.email, phone: contactVerified[ref]?.phone },
                          })
                        }
                        className={`px-3 py-2 rounded text-xs border ${contactVerified[ref]?.email ? "bg-pax-light border-pax text-pax-dark" : "border-slate-200 text-slate-500"}`}
                      >
                        {contactVerified[ref]?.email ? "✓" : "○"} Email verified
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setContactVerified({
                            ...contactVerified,
                            [ref]: { email: contactVerified[ref]?.email, phone: !contactVerified[ref]?.phone },
                          })
                        }
                        className={`px-3 py-2 rounded text-xs border ${contactVerified[ref]?.phone ? "bg-pax-light border-pax text-pax-dark" : "border-slate-200 text-slate-500"}`}
                      >
                        {contactVerified[ref]?.phone ? "✓" : "○"} Phone verified
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            ))}
            <button
              type="submit"
              disabled={!Object.values(contacts).some((c) => c.email || c.phone || c.declined)}
              className="w-full bg-pax-dark text-white px-4 py-3 rounded font-semibold disabled:opacity-50"
            >
              Run reachability audit
            </button>
          </form>
          <p className="text-xs text-slate-500 mt-3">
            Verified = you've confirmed you control that channel. Unverified contacts are never written to the record.
          </p>
        </>
      )}

      {/* STEP: audit */}
      {step === "audit" && audit && sandbox && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Reachability audit</h2>
            <span className={`badge ${audit.overall === "REACHABLE" ? "badge-match" : "badge-problem"}`}>
              {audit.overall}
            </span>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Each passenger's verified contact compared against CTCE/CTCM/CTCR on the airline record.
          </p>
          <div className="space-y-3 mb-6">
            {audit.passengers.map((pa: any) => (
              <div key={pa.passengerRef} className="card p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Plane className="w-4 h-4 text-pax" />
                  <span className="font-medium">Passenger {pa.passengerRef}</span>
                  <span className={`badge ${pa.reachable ? "badge-match" : "badge-problem"}`}>
                    {pa.reachable ? "Reachable" : "Not reachable"}
                  </span>
                </div>
                <ul className="space-y-1 text-sm">
                  {pa.verdicts.map((v: any, i: number) => (
                    <li key={i} className="flex items-start gap-2">
                      <span
                        className={`text-xs font-medium ${
                          v.verdict === "PASSENGER_CONTACT_MATCH"
                            ? "text-ok"
                            : v.verdict === "PASSENGER_DECLINED"
                            ? "text-warn"
                            : "text-bad"
                        }`}
                      >
                        ▪
                      </span>
                      <span className={v.verdict === "PASSENGER_CONTACT_MATCH" ? "text-green-800" : "text-red-800"}>
                        {v.message}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {proposals.length > 0 ? (
            <div className="card p-4 mb-6">
              <h3 className="section-title mb-3">Proposed corrections</h3>
              <p className="text-sm text-slate-600 mb-3">
                Review each change. Nothing is written to the airline record until you approve it.
              </p>
              <form onSubmit={handleRepairSubmit} className="space-y-3">
                {proposals.map((p, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded border bg-slate-50/50">
                    <input
                      type="checkbox"
                      checked={p.approved}
                      onChange={() => toggleProposal(i)}
                      className="rounded text-pax mt-0.5"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{p.passengerRef} · {p.ssrType}</div>
                      <div className="text-xs text-slate-500 mb-1">{maskValue(p.value)}</div>
                      <div className="text-xs text-slate-700">{p.reason}</div>
                    </div>
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={!proposals.some((p) => p.approved)}
                  className="w-full bg-pax-dark text-white px-4 py-3 rounded font-semibold disabled:opacity-50 mt-2"
                >
                  Approve selected corrections
                </button>
              </form>
            </div>
          ) : (
            <div className="mb-6">
              {audit.overall === "REACHABLE" ? (
                <div className="p-4 rounded-lg border bg-green-50 border-green-200 text-green-800 text-sm">
                  All passengers are directly reachable on the airline record. No correction needed.
                </div>
              ) : audit.overall === "DECLINED" ? (
                <div className="p-4 rounded-lg border bg-amber-50 border-amber-200 text-amber-800 text-sm">
                  Contact declined by passenger. No contact will be written.
                </div>
              ) : (
                <div className="p-4 rounded-lg border bg-blue-50 border-blue-200 text-blue-800 text-sm">
                  No repairable issues found with verified contacts.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* STEP: repair */}
      {step === "repair" && repairResult && (
        <>
          <h2 className="text-lg font-semibold mb-4">Correction applied</h2>
          {repairResult.falseSave && falseSaveNotice && (
            <div className="mb-4 p-4 rounded-lg border bg-red-50 border-red-200 text-red-800 text-sm">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              <strong>Kane trap:</strong> The portal showed "Saved" but the contact was <strong>not persisted</strong>.
              Kane will catch this on fresh retrieval.
            </div>
          )}
          <div className="card p-4 mb-4 space-y-2">
            {repairResult.results.map((r: any, i: number) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={r.result.ok && !r.result.falseSave ? "text-ok" : "text-bad"}>▪</span>
                <span>{r.passengerRef} · {r.ssrType}</span>
                <span className="ml-2 text-slate-500">
                  {r.result.falseSave ? "not persisted (false save)" : r.result.message || "applied"}
                </span>
              </div>
            ))}
          </div>
          <button
            onClick={handleReverify}
            className="w-full bg-pax-dark text-white px-4 py-3 rounded font-semibold"
          >
            Reload booking &amp; verify independently
          </button>
        </>
      )}

      {/* STEP: reverify */}
      {step === "reverify" && reverifyResult && (
        <>
          <h2 className="text-lg font-semibold mb-4">Independent re-verification</h2>
          <p className="text-sm text-slate-600 mb-4">
            The booking was re-opened in a fresh read. PAX only marks verified if the persisted contact fields
            match your verified details and the correct passenger association.
          </p>
          <div className="card p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-600">Result</span>
              <span
                className={`badge ${receiptVerified ? "badge-match" : "badge-problem"}`}
              >
                {receiptVerified ? "PASSENGER CONTACT VERIFIED" : "NOT YET VERIFIED"}
              </span>
            </div>
            <div className="text-xs text-slate-500 mb-3">
              Overall: <span className="font-mono">{reverifyResult.after.overall}</span>
            </div>
            {reverifyResult.after.passengers.map((pa: any) => (
              <div key={pa.passengerRef} className="text-sm mb-2">
                Passenger {pa.passengerRef}:{" "}
                {pa.reachable ? "reachable" : "not reachable"}
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <button
              onClick={() => setStep("receipt")}
              disabled={!receiptVerified}
              className={`w-full py-3 rounded font-semibold ${
                receiptVerified
                  ? "bg-pax-dark text-white"
                  : "border-slate-200 bg-slate-100 text-slate-400"
              }`}
            >
              Generate evidence receipt
            </button>
            <button
              onClick={() => setStep("start")}
              className="w-full py-2 rounded border border-slate-200 text-slate-600 text-sm font-medium"
            >
              Check another booking
            </button>
          </div>
        </>
      )}

      {/* STEP: receipt */}
      {step === "receipt" && reverifyResult && (
        <>
          <h2 className="text-lg font-semibold mb-4">Evidence receipt</h2>
          <div className="card p-5 mb-4 font-mono text-xs text-slate-700">
            <div className="mb-2">PAX — Passenger Contact Evidence Receipt</div>
            <div className="mb-2">PNR: {reverifyResult.after.pnr} &nbsp;|&nbsp; Surname: {reverifyResult.after.surname} &nbsp;|&nbsp; Airline: {reverifyResult.after.airline}</div>
            <div className="mb-2">Overall: <span className="font-bold">{receiptVerified ? "REACHABLE" : "NOT REACHABLE"}</span></div>
            <div className="mb-2">Verified at: {new Date().toISOString()}</div>
            <div className="mb-2 border-t pt-2">Passengers:</div>
            {reverifyResult.after.passengers.map((pa: any) => (
              <div key={pa.passengerRef} className="ml-2 mb-1">
                {pa.passengerRef}: {pa.reachable ? "reachable" : "not reachable"}
                {pa.verdicts.map((v: any) => (
                  <div key="" className="ml-3 text-slate-500">• {v.message}</div>
                ))}
              </div>
            ))}
            <div className="mt-3 border-t pt-2 text-slate-500">
              This receipt confirms the airline booking record contains the passenger's own contact details at the time
              of verification. It does not guarantee delivery of future airline messages.
            </div>
          </div>
          <button
            onClick={() => setStep("done")}
            className="w-full bg-pax-dark text-white px-4 py-3 rounded font-semibold"
          >
            Done
          </button>
        </>
      )}

      {/* STEP: done */}
      {step === "done" && (
        <div className="card p-8 text-center">
          <ShieldCheck className="w-10 h-10 text-pax mx-auto mb-3" />
          <h2 className="text-xl font-semibold">Verification complete</h2>
          <p className="text-slate-600">The airline can now reach the right passenger.</p>
          <button onClick={() => setStep("start")} className="mt-4 text-pax font-medium underline">
            Check another booking
          </button>
        </div>
      )}

      <div className="mt-8 pt-6 border-t text-xs text-slate-500">
        <p>
          Carrier Sandbox is a clearly labelled local simulation — not a live airline. No real passenger data is
          stored. CTCE = email · CTCM = mobile · CTCR = contact declined.
        </p>
      </div>
    </div>
  );
}

function maskValue(v: string): string {
  if (!v) return "";
  if (v.includes("@")) {
    const [l, d] = v.split("@");
    return (l[0] ?? "") + "••••@" + d;
  }
  const dig = v.replace(/\D/g, "");
  return "••••" + dig.slice(-4);
}
