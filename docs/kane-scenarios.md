# PAXREACH — Kane CLI scenarios

Natural-language objectives for `kane-cli run`. Each targets a seeded Carrier Sandbox booking. Variables are supplied via `.testmuai/variables/paxreach-demo.json`.

Official Kane syntax (v0.10.8):
```
kane-cli run "<objective>" --url http://localhost:3000 \
  --variables-file ./.testmuai/variables/paxreach-demo.json \
  --agent --final-validation on --mode action --headless
```
Exit codes: 0 = passed, 1 = failed, 2 = error, 3 = timeout/cancelled.

## Scenario 1 — agency-only contact (AX1234 / OKONKWO)

Objective: Retrieve booking AX1234 for surname OKONKWO. Read CTCE/CTCM for passenger P1. Confirm the contact belongs to the travel agent, not the passenger. Propose the passenger's verified email/phone. Require approval. Apply. Reload in a fresh page. Verify the persisted contact matches the passenger's verified values and P1 association. Do not accept a "Saved" toast as proof.

Expected: Kane PASSES — the record now contains the passenger's contact.

## Scenario 2 — misassigned contact (BY5678 / ADEBAYO)

Objective: Retrieve booking BY5678 for surname ADEBAYO. Confirm P2's contact is actually P1's contact (misassigned). Propose P2's own verified contact for P2. Apply. Reload. Verify P2 now has P2's contact and P1 retains P1's — no cross-assignment.

Expected: Kane PASSES — contacts correctly associated per passenger.

## Scenario 3 — declined contact (CZ9012 / IBRAHIM)

Objective: Retrieve booking CZ9012 for surname IBRAHIM. Confirm CTCR (contact declined) for P1. Confirm PAXREACH does not write any contact and preserves the refusal. No repair action.

Expected: Kane PASSES — refusal preserved, no write.

## Scenario 4 — already correct (DX3456 / SANUSI)

Objective: Retrieve booking DX3456 for surname SANUSI. Confirm P1's email and phone already match the passenger's verified details. No correction needed; no unnecessary write.

Expected: Kane PASSES — no-op, PASS retained.

## Scenario 5 — false-save bug (FS7777 / FALSE)

Objective: Retrieve booking FS7777 for surname FALSE. Apply an approved contact correction. Observe the green "Saved" toast. Reload the booking in a fresh page. Assert the contact was NOT persisted (still the old value). Return FAILURE.

Expected: Kane FAILS (exit code 1) — this is the deliberate false-save bug. The coding agent fixes persistence, then reruns and Kane PASSES with a real persisted contact.

This is the closed-loop demonstration: Kane catches the deception, the agent fixes it, Kane re-verifies.

## Variables file (.testmuai/variables/paxreach-demo.json)

Example for agencyOnly:
```json
{
  "pnr": "AX1234",
  "surname": "OKONKWO",
  "airline": "MockAir",
  "passenger_ref": "P1",
  "email": "chima.okonkwo@example.com",
  "phone": "+2348012345678",
  "expected_email": "chima.okonkwo@example.com",
  "expected_phone": "+2348012345678",
  "url": "http://localhost:3000"
}
```

## Evidence

Raw Kane output (NDJSON), exit code, and evidence path are saved to `.testmuai/evidence/kane-<timestamp>.json` by `scripts/kane-verify.mjs`.

## Authentication

Kane CLI requires TestMu AI authentication: `kane-cli login --oauth` (or `--username/--access-key`). Register on TestMu AI with the same email used for event registration and claim the 10,000 free credits. Running at least one Kane CLI flow is required to be scored.
