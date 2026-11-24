"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Clock, FileText, ShieldAlert, Banknote, Phone, MapPin, ChevronRight } from "lucide-react";

const STATUSES = [
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
] as const;

type CaseStatus = (typeof STATUSES)[number];

function statusLabel(s: CaseStatus): string {
  const labels: Record<CaseStatus, string> = {
    DRAFT: "Draft",
    EVIDENCE_INCOMPLETE: "Evidence incomplete",
    READY_FOR_BANK: "Ready for bank",
    BANK_COMPLAINT_SUBMITTED: "Complaint submitted to bank",
    BANK_REFERENCE_RECORDED: "Bank reference recorded",
    WAITING_FOR_CCMS_UPLOAD: "Waiting for CCMS upload (24h)",
    BANK_RESOLUTION_WINDOW: "Bank resolution window (2 weeks)",
    ELIGIBLE_FOR_CBN_ESCALATION: "Eligible for CBN escalation",
    CBN_ESCALATION_PREPARED: "CBN escalation prepared",
    RESOLVED: "Resolved",
    DISPUTED: "Disputed",
  };
  return labels[s];
}

function statusClass(s: CaseStatus): string {
  return `status-badge status-${s.toLowerCase()}`;
}

export default function IncidentPage() {
  const [caseId, setCaseId] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Form state
  const [form, setForm] = useState({
    atmType: "own" as string,
    bankName: "",
    transactionDateTime: "",
    timezone: "Africa/Lagos",
    amountDebited: "",
    amountDispensed: "0",
    atmLocation: "",
    atmOperator: "",
    terminalId: "",
    transactionReference: "",
    bankComplaintReference: "",
  });

  // Demo clock state
  const [demoDays, setDemoDays] = useState(0);

  const fetchCase = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases?id=${id}`);
      const json = await res.json();
      if (json.case) setCaseData(json.case);
      else setError(json.error || "Failed to load case");
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create case on first submit of facts
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const body = {
      atmType: form.atmType,
      bankName: form.bankName,
      transactionDateTime: form.transactionDateTime,
      timezone: form.timezone,
      amountDebited: parseFloat(form.amountDebited) || 0,
      amountDispensed: parseFloat(form.amountDispensed) || 0,
      atmLocation: form.atmLocation,
      atmOperator: form.atmOperator || undefined,
      terminalId: form.terminalId || undefined,
      transactionReference: form.transactionReference || undefined,
    };
    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.case) {
        setCaseId(json.case.id);
        setCaseData(json.case);
        setMessage("Incident draft created. Keep going — add evidence next.");
        setMessageType("success");
      } else {
        setError(json.error || "Failed to create case");
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;
    setError(null);
    const body: any = {
      bankName: form.bankName,
      transactionDateTime: form.transactionDateTime,
      timezone: form.timezone,
      amountDebited: parseFloat(form.amountDebited) || 0,
      amountDispensed: parseFloat(form.amountDispensed) || 0,
      atmLocation: form.atmLocation,
      atmOperator: form.atmOperator || undefined,
      terminalId: form.terminalId || undefined,
      transactionReference: form.transactionReference || undefined,
    };
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.case) {
        setCaseData(json.case);
        setMessage("Incident details saved.");
        setMessageType("success");
      } else {
        setError(json.error || "Failed to save");
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleTransition = async (to: CaseStatus, reason?: string) => {
    if (!caseId) return;
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/transition`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(demoDays ? { "X-Demo-Clock": String(Date.now() + demoDays * 86400000) } : {}),
        },
        body: JSON.stringify({ toStatus: to, reason, actor: "user", nowMs: Date.now() + demoDays * 86400000 }),
      });
      const json = await res.json();
      if (json.ok) {
        setCaseData(json.case);
        setMessage(`Moved to ${statusLabel(to)}.`);
        setMessageType("success");
      } else {
        setError(json.error || "Transition blocked");
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleRecordReference = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !form.bankComplaintReference) {
      setError("Enter the bank complaint reference first.");
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankComplaintReference: form.bankComplaintReference }),
      });
      const json = await res.json();
      if (json.case) {
        setCaseData(json.case);
        await handleTransition("BANK_REFERENCE_RECORDED", "Bank complaint reference recorded");
        setMessage("Bank reference recorded. Next: wait 24h, then check CCMS.");
        setMessageType("success");
      } else {
        setError(json.error || "Failed to record reference");
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const missing = caseData ? missingEvidence(caseData) : [];
  const amountClaimed = caseData
    ? Math.max(0, (caseData.amountDebited || 0) - (caseData.amountDispensed || 0))
    : 0;
  const canEscalate = caseData
    ? caseData.status === "BANK_RESOLUTION_WINDOW" || caseData.status === "ELIGIBLE_FOR_CBN_ESCALATION"
    : false;

  const isFormComplete =
    form.bankName.trim() &&
    form.transactionDateTime &&
    form.atmLocation.trim() &&
    parseFloat(form.amountDebited) > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Alert banner */}
      {message && (
        <div
          className={`p-4 rounded-lg border mb-4 ${
            messageType === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
          }`}
          role="status"
          aria-live="polite"
        >
          {message}
        </div>
      )}
      {error && (
        <div className="p-4 rounded-lg border bg-red-50 border-red-200 text-red-800 mb-4" role="alert">
          {error}
        </div>
      )}

      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">ATM debited you, but no cash came out?</h1>
        <p className="text-slate-600 mt-1">
          Guided, evidence-checked bank complaint for ATM cash-dispense errors. Bank-first — lodge with your bank, get a
          reference, then escalate to CBN only after the two-week window.
        </p>
      </div>

      {/* Demo clock controls (time-travel for the demo) */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <label className="text-sm text-slate-500">Demo clock (time-travel):</label>
        <button
          onClick={() => setDemoDays((d) => d - 1)}
          className="px-2 py-1 text-xs border rounded"
        >
          −1 day
        </button>
        <span className="text-sm font-mono">+{demoDays} day(s)</span>
        <button
          onClick={() => setDemoDays((d) => d + 1)}
          className="px-2 py-1 text-xs border rounded"
        >
          +1 day
        </button>
        <button
          onClick={() => setDemoDays(0)}
          className="px-2 py-1 text-xs border rounded text-slate-500"
        >
          reset
        </button>
        {demoDays !== 0 && (
          <span className="ml-2 text-xs text-orange-600">
            (demo clock advanced {demoDays} day(s); CCMS upload = +1 day, CBN = +14 days)
          </span>
        )}
      </div>

      {/* Two-column layout: primary form left, timeline right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / PRIMARY: incident facts + evidence checklist */}
        <div className="lg:col-span-7 space-y-6">
          {/* Incident facts form */}
          <form onSubmit={caseId ? handleUpdate : handleCreate} className="case-card p-5">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Banknote className="w-5 h-5" /> Incident facts
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium mb-1">ATM type</label>
                <select
                  value={form.atmType}
                  onChange={(e) => setForm({ ...form, atmType: e.target.value })}
                  className="w-full p-2 border rounded bg-white"
                >
                  <option value="own">Own-bank ATM</option>
                  <option value="other">Other-bank ATM</option>
                </select>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium mb-1">Your bank</label>
                <input
                  value={form.bankName}
                  onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                  placeholder="e.g. FirstBank, GTCO, Access Bank"
                  className="w-full p-2 border rounded bg-white"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium mb-1">Transaction date/time</label>
                <input
                  type="datetime-local"
                  value={form.transactionDateTime}
                  onChange={(e) => setForm({ ...form, transactionDateTime: e.target.value })}
                  className="w-full p-2 border rounded bg-white"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium mb-1">Timezone</label>
                <input
                  value={form.timezone}
                  onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                  className="w-full p-2 border rounded bg-white"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium mb-1">Amount debited (₦)</label>
                <input
                  type="number"
                  value={form.amountDebited}
                  onChange={(e) => setForm({ ...form, amountDebited: e.target.value })}
                  placeholder="20000"
                  className="w-full p-2 border rounded bg-white"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium mb-1">Amount dispensed (₦)</label>
                <input
                  type="number"
                  value={form.amountDispensed}
                  onChange={(e) => setForm({ ...form, amountDispensed: e.target.value })}
                  placeholder="0"
                  className="w-full p-2 border rounded bg-white"
                />
                <p className="text-xs text-slate-500 mt-1">Default 0. Allow partial dispense.</p>
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium mb-1">ATM location</label>
                <input
                  value={form.atmLocation}
                  onChange={(e) => setForm({ ...form, atmLocation: e.target.value })}
                  placeholder="Street / area"
                  className="w-full p-2 border rounded bg-white"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium mb-1">ATM operator / terminal ID</label>
                <input
                  value={form.atmOperator}
                  onChange={(e) => setForm({ ...form, atmOperator: e.target.value })}
                  placeholder="Operator (optional)"
                  className="w-full p-2 border rounded bg-white"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium mb-1">Terminal ID (optional)</label>
                <input
                  value={form.terminalId}
                  onChange={(e) => setForm({ ...form, terminalId: e.target.value })}
                  placeholder="Terminal ID"
                  className="w-full p-2 border rounded bg-white"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium mb-1">Transaction reference (optional)</label>
                <input
                  value={form.transactionReference}
                  onChange={(e) => setForm({ ...form, transactionReference: e.target.value })}
                  placeholder="From your alert"
                  className="w-full p-2 border rounded bg-white"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="submit"
                disabled={!isFormComplete || loading}
                className="w-full bg-bank-red text-white px-4 py-3 rounded font-semibold disabled:opacity-50"
              >
                {caseId ? "Save incident details" : "Start incident"}
              </button>
              {loading && <span className="ml-2 text-xs text-slate-400">saving…</span>}
            </div>
          </form>

          {/* Bank complaint reference (after lodging with bank) */}
          {(caseData && caseData.status === "READY_FOR_BANK") || (caseData && caseData.status === "BANK_COMPLAINT_SUBMITTED") ? (
            <form onSubmit={handleRecordReference} className="case-card p-5">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5" /> Bank complaint reference
              </h2>
              <p className="text-sm text-slate-600 mb-3">
                Lodge the complaint with your bank first, get a reference/tracking number, then record it here. CBN
                escalation is only available after the two-week bank window.
              </p>
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">Bank complaint reference</label>
                <input
                  value={form.bankComplaintReference}
                  onChange={(e) => setForm({ ...form, bankComplaintReference: e.target.value })}
                  placeholder="Reference / tracking number from your bank"
                  className="w-full p-2 border rounded bg-white"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-bank-red text-white px-4 py-3 rounded font-semibold"
              >
                Record bank reference
              </button>
            </form>
          ) : null}

          {/* Evidence completeness engine */}
          <div className="case-card p-5">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5" /> Evidence checklist
            </h2>
            <p className="text-sm text-slate-600 mb-3">
              A case is marked <strong>ready for the bank</strong> only when these items are present. Nothing is inferred
              — you confirm each value.
            </p>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 p-2 rounded border">
                {missing.includes("Transaction alert or statement excerpt") ? (
                  <span className="text-red-600">✗</span>
                ) : (
                  <span className="text-green-600">✓</span>
                )}
                <span className={missing.includes("Transaction alert or statement excerpt") ? "text-red-600" : "text-slate-700"}>
                  Transaction alert or statement excerpt (evidence attachment)
                </span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded border">
                {missing.includes("Transaction reference or terminal ID") ? (
                  <span className="text-red-600">✗</span>
                ) : (
                  <span className="text-green-600">✓</span>
                )}
                <span className={missing.includes("Transaction reference or terminal ID") ? "text-red-600" : "text-slate-700"}>
                  Transaction reference or terminal ID
                </span>
              </li>
              <li className="flex items-center gap-2 p-2 rounded border">
                {missing.includes("ATM location") ? (
                  <span className="text-red-600">✗</span>
                ) : (
                  <span className="text-green-600">✓</span>
                )}
                <span className={missing.includes("ATM location") ? "text-red-600" : "text-slate-700"}>
                  ATM location
                </span>
              </li>
            </ul>
            {missing.length > 0 ? (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
                <span className="font-semibold text-amber-800">Missing:</span> {missing.join(", ")}. Fix these before the
                case can be sent to your bank.
              </div>
            ) : (
              <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-sm">
                <span className="font-semibold text-green-800">Evidence complete.</span> You can mark the case ready for
                the bank.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT / TIMELINE: next action, deadline, reference, status */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status card */}
          <div className="case-card p-5">
            <h2 className="text-lg font-semibold mb-3">Case status</h2>
            {caseData ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-600">Status</span>
                  <span className={statusClass(caseData.status)}>{statusLabel(caseData.status)}</span>
                </div>
                <div className="mb-3">
                  <span className="text-sm font-medium text-slate-600 block">Amount claimed</span>
                  <span className="text-lg font-mono font-bold">₦{amountClaimed.toLocaleString()}</span>
                </div>
                {caseData.bankComplaintReference ? (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-slate-600 block">Bank reference</span>
                    <span className="text-lg font-mono font-bold">{caseData.bankComplaintReference}</span>
                  </div>
                ) : null}
                {caseData.transactionReference ? (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-slate-600 block">Transaction reference</span>
                    <span className="text-sm font-mono">{caseData.transactionReference}</span>
                  </div>
                ) : null}
                <div className="pt-3 border-t">
                  <span className="text-xs text-slate-500 block">Created</span>
                  <span className="text-sm font-mono">{new Date(caseData.createdAt).toLocaleString()}</span>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-500 text-sm py-4">
                No case yet. Start an incident above.
              </div>
            )}
          </div>

          {/* Next action / timeline */}
          <div className="case-card p-5">
            <h2 className="text-lg font-semibold mb-3">What happens next?</h2>
            {caseData ? (
              <div className="space-y-3">
                {nextActionFor(caseData.status).map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      item.done ? "bg-green-500 text-white" : item.current ? "bg-bank-red text-white" : "bg-slate-200 text-slate-600"
                    }`}>
                      {i + 1}
                    </div>
                    <div>
                      <div className={`text-sm font-medium ${item.current ? "text-bank-red" : "text-slate-700"}`}>
                        {item.text}
                      </div>
                      {item.note && <div className="text-xs text-slate-500 mt-0.5">{item.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-slate-500 text-sm py-4">Create a case to see the timeline.</div>
            )}
          </div>

          {/* Action buttons (state transitions) */}
          {caseData ? (
            <div className="space-y-2">
              {transitionButtons(caseData, handleTransition).map((b, i) => (
                <button
                  key={i}
                  onClick={() => handleTransition(b.to, b.reason)}
                  disabled={b.disabled}
                  className={`w-full py-2.5 rounded text-sm font-semibold border ${
                    b.disabled
                      ? "border-slate-200 bg-slate-100 text-slate-400"
                      : "bg-bank-red border-bank-red text-white hover:bg-bank-red-dark"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          ) : null}

          {/* What happens next summary */}
          <div className="case-card p-5 bg-bank-red/5 border-bank-red/20">
            <h3 className="text-sm font-semibold text-bank-red mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Bank-first process
            </h3>
            <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
              <li>Lodge the complaint with your bank first.</li>
              <li>Obtain a reference/tracking number.</li>
              <li>Wait two weeks before CBN escalation (if unresolved).</li>
              <li>Allow 24h for the bank to upload to CCMS, then check the portal.</li>
              <li>CashCase never sends a real complaint to a bank or CBN.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer links to official sources + sandbox */}
      <div className="mt-8 pt-6 border-t text-xs text-slate-500">
        <p>Official sources: <a href="https://www.cbn.gov.ng/FinInc/FinLit/LodgeComplaint.html" className="text-bank-red hover:underline">CBN Lodge a Complaint</a> · <a href="https://complaintsportal.cbn.gov.ng/" className="text-bank-red hover:underline">CBN CCMS Portal</a></p>
        <p>
          Sandbox:{" "}
          <a href="/sandbox/bankdesk" className="text-bank-red hover:underline">MockBankDesk (bank portal)</a> ·
          <a href="/sandbox/ccms" className="text-bank-red hover:underline">MockCCMS (regulator lookup)</a>
        </p>
      </div>
    </div>
  );
}

function nextActionFor(status: CaseStatus): Array<{ text: string; note?: string; done: boolean; current: boolean }> {
  const steps: Array<{ text: string; note?: string }> = [
    { text: "Enter incident facts", note: "ATM, bank, amount, date/time, location" },
    { text: "Add evidence", note: "Transaction alert/statement; optional receipt" },
    { text: "Mark ready for bank", note: "Evidence must be complete first" },
    { text: "Lodge with your bank", note: "Get a reference/tracking number" },
    { text: "Record bank reference", note: "Bank-first — CBN comes later" },
    { text: "Wait 24h, then check CCMS", note: "Bank upload delay" },
    { text: "Wait two-week bank window", note: "CBN escalation only after" },
    { text: "Prepare CBN escalation packet", note: "With bank reference + proof" },
    { text: "Submit to CBN", note: "Consumer Protection Department" },
  ];
  const index = STATUSES.indexOf(status);
  return steps.map((s, i) => ({
    ...s,
    done: i < index,
    current: i === index,
  }));
}

function transitionButtons(
  c: any,
  onTransition: (to: CaseStatus, reason?: string) => void
): Array<{ label: string; to: CaseStatus; reason?: string; disabled: boolean }> {
  const missing = missingEvidence(c);
  const buttons: Array<{ label: string; to: CaseStatus; reason?: string; disabled: boolean }> = [];

  const st = c.status;
  if (st === "DRAFT") {
    buttons.push({ label: "Mark evidence incomplete", to: "EVIDENCE_INCOMPLETE", reason: "Facts entered", disabled: false });
  }
  if (st === "EVIDENCE_INCOMPLETE") {
    buttons.push({
      label: "Mark ready for bank",
      to: "READY_FOR_BANK",
      reason: "Evidence complete",
      disabled: missing.length > 0,
    });
  }
  if (st === "READY_FOR_BANK") {
    buttons.push({ label: "Complaint submitted to bank", to: "BANK_COMPLAINT_SUBMITTED", reason: "Lodged with bank", disabled: false });
  }
  if (st === "BANK_COMPLAINT_SUBMITTED") {
    buttons.push({ label: "Record bank reference", to: "BANK_REFERENCE_RECORDED", reason: "Reference issued", disabled: !c.bankComplaintReference });
  }
  if (st === "BANK_REFERENCE_RECORDED") {
    buttons.push({ label: "Waiting for CCMS upload", to: "WAITING_FOR_CCMS_UPLOAD", reason: "24h upload delay", disabled: false });
  }
  if (st === "WAITING_FOR_CCMS_UPLOAD") {
    buttons.push({ label: "Enter bank resolution window", to: "BANK_RESOLUTION_WINDOW", reason: "CCMS checked", disabled: false });
  }
  if (st === "BANK_RESOLUTION_WINDOW") {
    buttons.push({
      label: "Eligible for CBN escalation",
      to: "ELIGIBLE_FOR_CBN_ESCALATION",
      reason: "Two weeks elapsed",
      disabled: true, // time-gated; demo clock controls this
    });
  }
  if (st === "ELIGIBLE_FOR_CBN_ESCALATION") {
    buttons.push({ label: "Prepare CBN escalation", to: "CBN_ESCALATION_PREPARED", reason: "Escalation packet ready", disabled: false });
  }
  return buttons;
}

function missingEvidence(c: any): string[] {
  const m: string[] = [];
  if (!c.evidenceAlertUrl) m.push("Transaction alert or statement excerpt");
  if (!c.transactionReference && !c.terminalId) m.push("Transaction reference or terminal ID");
  if (!c.atmLocation) m.push("ATM location");
  return m;
}
