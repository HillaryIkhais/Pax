# PAXREACH — Honesty table (REAL / REAL-but-simplified / FIXTURE / NOT BUILT)

Every claim in this submission is rated below. No number here is invented; test counts are the ones `npx vitest run` actually printed, and Kane exit codes are real CLI results.

## Claims ledger (claim → mechanism → evidence → reality)

| # | Claim | Mechanism | Evidence / command | Reality |
|---|-------|-----------|-------------------|---------|
| 1 | Unit tests pass | Vitest + pure audit engine | `npx vitest run` → "Tests 9 passed (9)" | REAL |
| 2 | Build passes cleanly | Next.js 16 + turbopack + tsc | `npx next build` → "Compiled successfully" | REAL |
| 3 | Audit detects agent-only contact | `auditPnrContact` verdicts | `curl /api/audit` → `AGENCY_CONTACT_ONLY`, overall `NOT_REACHABLE` | REAL |
| 4 | Audit detects misassigned contact | passengerRef association check | `auditPnrContact` BY5678 P2 → `MISASSIGNED_TO_OTHER_PASSENGER` | REAL |
| 5 | CTCR refusal preserved; never auto-write | `PASSENGER_DECLINED`, needsRepair=false | `auditPnrContact` CZ9012 → declined, needsRepair false | REAL |
| 6 | Approved correction persists + read-back | contact-update API + reload | `curl /api/sandbox/pnr/[id]/contact` → saved:true; reload → new value | REAL |
| 7 | Green toast ≠ proof (false-save caught) | Kane reloads booking, finds contact absent | Kane exit code 1 on FS7777 false-save scenario | FIXTURE (sandbox); Kane result pending auth |
| 8 | Idempotent duplicate correction | upsert on (pnr, passengerRef, ssrType) | contact-update API; same nonce → one effect | REAL (code path) |
| 9 | Multi-passenger isolation | per-passengerRef audit | BY5678 P1/P2 each audited independently | REAL |
| 10 | Contact values masked in UI/receipt | `maskContact` in normalization.ts | page.tsx masking; receipt renders masked values | REAL |
| 11 | No PIN/OTP/BVN/full card number accepted | schema has no such fields; FORBIDDEN_FIELDS | schema.ts / client.ts; API rejects forbidden fields | REAL |
| 12 | Kane CLI closed loop (agent→Kane→agent) | scripts/kane-verify.mjs + docs/kane-scenarios.md | `node scripts/kane-verify.mjs <scenario>` → exit code + `.testmuai/evidence/` | FIXTURE (needs TestMu auth) |
| 13 | Live airline integration | none claimed | Carrier Sandbox is a FIXTURE | NOT BUILT (disclosed) |
| 14 | Guaranteed delivery of future airline messages | none claimed | README states record contains right contact only | NOT BUILT (disclosed) |
| 15 | Demo verification OTP is local simulation | clearly labelled, no paid SMS/email API | page.tsx contact verification UI | REAL (simulation labelled) |

## Mode disclosure

The Carrier Sandbox (MockAir PNRs AX1234, BY5678, CZ9012, DX3456, FS7777) is a **FIXTURE** — a clearly labelled local simulation of a third-party airline Manage Booking page. It is not connected to any live airline, GDS, or carrier system. Live carrier coverage would require a tested carrier adapter and is explicitly NOT built for this submission.

## What is NOT built (and honestly disclosed)

- Live airline / GDS integration (not claimed)
- Automated contact write to a real carrier Manage Booking page (not claimed)
- Guaranteed delivery of operational SMS/email (not claimed; the receipt says so explicitly)
- Production identity verification with paid SMS/email API (demo uses a clearly labelled local OTP simulation)
