"use client";

import { useState, useEffect } from "react";
import { Building, CreditCard, FileText, ShieldCheck } from "lucide-react";

// SEED_DECEPTIVE_SUCCESS: when true, the frontend shows "Complaint submitted"
// although the backend fails before creating the case. This is the deliberately
// seeded deceptive-success bug used for the Kane closed-loop demonstration.
// Set to false after the fix to verify a real persisted case/reference.
const SEED_DECEPTIVE_SUCCESS = process.env.NEXT_PUBLIC_SEED_BUG === "true";

export default function MockBankDeskPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [lookupRef, setLookupRef] = useState("");
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [bugNotice, setBugNotice] = useState(false);

  const [form, setForm] = useState({
    bankName: "",
    amountDebited: "",
    amountDispensed: "0",
    atmLocation: "",
    terminalId: "",
    transactionReference: "",
    transactionDateTime: "",
    evidenceIndex: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setBugNotice(false);
    try {
      if (SEED_DECEPTIVE_SUCCESS) {
        // SEeded BUG: frontend displays "Complaint submitted" although the
        // backend was never called / failed before creating the case.
        // No case is persisted, no reference is issued.
        setBugNotice(true);
        setResult({
          ok: true,
          duplicate: false,
          reference: null,
          caseId: null,
          status: "submitted",
          message: "Complaint submitted", // deceptive success toast
        });
        setLoading(false);
        return;
      }

      const res = await fetch("/api/sandbox/bankdesk/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: form.bankName,
          amountDebited: parseFloat(form.amountDebited) || 0,
          amountDispensed: parseFloat(form.amountDispensed) || 0,
          atmLocation: form.atmLocation,
          terminalId: form.terminalId || undefined,
          transactionReference: form.transactionReference || undefined,
          transactionDateTime: form.transactionDateTime || undefined,
          evidenceIndex: form.evidenceIndex || undefined,
        }),
      });
      const json = await res.json();
      setResult(json);
      if (!json.ok) setError(json.message || "Failed to register complaint");
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
    setLoading(false);
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLookupResult(null);
    try {
      const res = await fetch(
        `/api/sandbox/bankdesk/complaints?reference=${encodeURIComponent(lookupRef)}`
      );
      const json = await res.json();
      if (json.ok) setLookupResult(json.complaint);
      else setError(json.error || "No case found");
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6 p-4 rounded-lg border border-yellow-200 bg-yellow-50">
        <div className="flex items-start gap-3">
          <Building className="w-6 h-6 text-yellow-700 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-yellow-900">MockBankDesk — sandbox bank complaint portal</h2>
            <p className="text-sm text-yellow-800 mt-1">
              This is a clearly labelled local <strong>sandbox</strong>, not a real bank. It simulates a bank complaint
              portal with required fields, duplicate detection, and a persisted case/reference. Use it to verify the
              bank-first step of CashCase.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Register complaint */}
        <div className="space-y-6">
          <div className="p-5 border rounded-lg bg-white shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" /> Register complaint
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bank name</label>
                  <input
                    value={form.bankName}
                    onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                    placeholder="e.g. FirstBank"
                    className="w-full p-2 border rounded bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount debited (₦)</label>
                  <input
                    type="number"
                    value={form.amountDebited}
                    onChange={(e) => setForm({ ...form, amountDebited: e.target.value })}
                    placeholder="20000"
                    className="w-full p-2 border rounded bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amount dispensed (₦)</label>
                  <input
                    type="number"
                    value={form.amountDispensed}
                    onChange={(e) => setForm({ ...form, amountDispensed: e.target.value })}
                    placeholder="0"
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ATM location</label>
                  <input
                    value={form.atmLocation}
                    onChange={(e) => setForm({ ...form, atmLocation: e.target.value })}
                    placeholder="Street / area"
                    className="w-full p-2 border rounded bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Terminal ID (optional)</label>
                  <input
                    value={form.terminalId}
                    onChange={(e) => setForm({ ...form, terminalId: e.target.value })}
                    placeholder="Terminal ID"
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Transaction reference (optional)</label>
                  <input
                    value={form.transactionReference}
                    onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                    placeholder="From your alert"
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Transaction date/time</label>
                  <input
                    type="datetime-local"
                    value={form.transactionDateTime}
                    onChange={(e) => setForm({ ...form, transactionDateTime: e.target.value })}
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">Evidence index (optional)</label>
                  <input
                    value={form.evidenceIndex}
                    onChange={(e) => setForm({ ...form, evidenceIndex: e.target.value })}
                    placeholder="Evidence file reference"
                    className="w-full p-2 border rounded bg-white"
                  />
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Submitting the same bank + amount + date/time twice returns the existing reference (idempotent — no
                duplicate case).
              </p>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 text-white px-4 py-3 rounded font-semibold disabled:opacity-50"
              >
                Register complaint
              </button>
              {loading && <span className="block text-xs text-slate-400 mt-2">registering…</span>}
            </form>
          </div>

          {bugNotice && (
            <div className="p-4 rounded-lg border bg-red-50 border-red-200 text-red-800">
              <h4 className="font-semibold mb-1 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" />
                Seeded bug active: deceptive success toast
              </h4>
              <p className="text-sm">
                The frontend shows "Complaint submitted" but <strong>no case was persisted</strong> to the backend.
                Kane should catch this when it reopens the reference/status journey.
              </p>
            </div>
          )}
          {result && (
            <div className="p-4 rounded-lg border">
              {result.duplicate ? (
                <div className="bg-amber-50 border-amber-200 text-amber-800">
                  <h4 className="font-semibold mb-1">Duplicate — existing case returned</h4>
                  <p className="text-sm">Reference: <span className="font-mono font-bold">{result.reference}</span></p>
                  <p className="text-sm">{result.message}</p>
                </div>
              ) : (
                <div className="bg-green-50 border-green-200 text-green-800">
                  <h4 className="font-semibold mb-1">Complaint registered</h4>
                  <p className="text-sm">Reference: <span className="font-mono font-bold">{result.reference}</span></p>
                  <p className="text-sm">Case ID: <span className="font-mono">{result.caseId}</span></p>
                  <p className="text-sm">{result.message}</p>
                </div>
              )}
            </div>
          )}
          {error && <div className="p-3 rounded-lg border bg-red-50 border-red-200 text-red-800 text-sm">{error}</div>}
        </div>

        {/* Lookup by reference */}
        <div className="p-5 border rounded-lg bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Lookup by reference
          </h3>
          <form onSubmit={handleLookup} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Bank reference</label>
              <input
                value={lookupRef}
                onChange={(e) => setLookupRef(e.target.value)}
                placeholder="e.g. BD-123456-ABCD"
                className="w-full p-2 border rounded bg-white"
                required
              />
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white px-4 py-3 rounded font-semibold">
              Look up
            </button>
          </form>
          {lookupResult && (
            <div className="mt-4 p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-800 text-sm">
              <p className="font-semibold mb-1">Case found</p>
              <p className="text-sm mb-1">Reference: <span className="font-mono font-bold">{lookupResult.reference}</span></p>
              <p className="text-sm">Bank: {lookupResult.bankName}</p>
              <p className="text-sm">Amount debited: ₦{lookupResult.amountDebited}</p>
              <p className="text-sm">Status: {lookupResult.status}</p>
              <p className="text-sm">Registered: {new Date(lookupResult.createdAt).toLocaleString()}</p>
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 rounded-lg border bg-red-50 border-red-200 text-red-800 text-sm">{error}</div>
          )}
        </div>
      </div>

      <div className="mt-6 text-xs text-slate-500">
        Informational bank channel (not part of the sandbox):{" "}
        <a href="https://complaints.firstbanknigeria.com/" target="_blank" rel="noopener noreferrer" className="text-bank-red hover:underline">
          FirstBank complaints portal
        </a>{" "}
        — CashCase does not replace bank channels.
      </div>
    </div>
  );
}
