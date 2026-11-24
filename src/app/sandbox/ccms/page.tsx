"use client";

import { useState } from "react";
import { Search, Building2, Clock, ShieldAlert } from "lucide-react";

export default function MockCCMSPage() {
  const [reference, setReference] = useState("");
  const [nowDays, setNowDays] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const now = Date.now() + nowDays * 24 * 60 * 60 * 1000;
      const res = await fetch(
        `/api/sandbox/ccms/lookup?reference=${encodeURIComponent(reference)}&now=${now}`
      );
      const json = await res.json();
      setResult(json);
      if (!json.ok) setError(json.error || "Lookup failed");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-6 p-4 rounded-lg border border-blue-200 bg-blue-50">
        <div className="flex items-start gap-3">
          <Building2 className="w-6 h-6 text-blue-700 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold text-blue-900">MockCCMS — sandbox regulator status lookup</h2>
            <p className="text-sm text-blue-800 mt-1">
              This is a clearly labelled local <strong>sandbox</strong>, not the real CBN. It simulates the CCMS
              regulator-side lookup: a complaint only appears after the bank's 24-hour upload delay has elapsed, and it
              requires the original bank reference. Use it to verify the CBN status-check step of CashCase.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 border rounded-lg bg-white shadow-sm space-y-4">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Search className="w-5 h-5" /> Look up a complaint
          </h3>
          <p className="text-sm text-slate-600 mb-3">
            Enter the original bank reference. The case is only exposed once the 24-hour bank-upload delay has passed.
          </p>
          <form onSubmit={handleLookup} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Bank reference</label>
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. BD-123456-ABCD"
                className="w-full p-2 border rounded bg-white"
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-500">Demo clock:</label>
              <button
                onClick={() => setNowDays((d) => d - 1)}
                className="px-2 py-1 text-xs border rounded"
              >
                −1 day
              </button>
              <span className="text-xs font-mono">+{nowDays} day(s)</span>
              <button
                onClick={() => setNowDays((d) => d + 1)}
                className="px-2 py-1 text-xs border rounded"
              >
                +1 day
              </button>
              <button
                onClick={() => setNowDays(0)}
                className="px-2 py-1 text-xs border rounded text-slate-500"
              >
                reset
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Advance +1 day to simulate the bank uploading to CCMS (24-hour delay).
            </p>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white px-4 py-3 rounded font-semibold disabled:opacity-50"
            >
              Check CCMS status
            </button>
            {loading && <span className="block text-xs text-slate-400 mt-2">looking up…</span>}
          </form>
        </div>

        <div className="p-5 border rounded-lg bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> Result
          </h3>
          {result && !result.ok && (
            <div className="p-3 rounded-lg border bg-red-50 border-red-200 text-red-800 text-sm">
              {result.error}
            </div>
          )}
          {result && result.ok && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg border">
                <p className={`font-semibold mb-1 ${result.uploaded ? "text-green-800" : "text-amber-800"}`}>
                  {result.uploaded ? "Complaint available on CCMS" : "Complaint not yet uploaded by bank"}
                </p>
                <p className="text-sm mb-1">Reference: <span className="font-mono font-bold">{result.reference}</span></p>
                <p className="text-sm">Bank: {result.bankName}</p>
                <p className="text-sm">Status: {result.status}</p>
                <p className="text-sm">Registered: {result.createdAt}</p>
                <p className="text-sm">
                  Upload delay: {result.uploadDelayMs / 1000 / 3600} hours · Elapsed:{" "}
                  {Math.round(result.elapsedMs / 1000 / 60)} minutes
                </p>
                {!result.uploaded && (
                  <p className="text-sm text-amber-700">
                    Check back in ~{Math.ceil(result.remainingMs / 1000 / 60)} minutes.
                  </p>
                )}
              </div>
              <p className="text-xs text-slate-500 italic">{result.message}</p>
            </div>
          )}
          {!result && (
            <div className="text-center text-slate-500 text-sm py-6">
              <Clock className="w-6 h-6 mx-auto mb-2" />
              <p>No lookup performed yet.</p>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 text-xs text-slate-500">
        Regulator reference (informational):{" "}
        <a
          href="https://complaintsportal.cbn.gov.ng/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-700 hover:underline"
        >
          CBN CCMS portal
        </a>{" "}
        — CashCase does not connect to the real CBN or any bank.
      </div>
    </div>
  );
}
