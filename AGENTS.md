# PAXREACH — Agent instructions (enoch-mode Phase 1)

Non-discoverable invariants, honesty rules, and task-level definition of done.
Every agent working on this repo must read this first.

## Invariants (must never be false — enforced in one place, attacked by tests)

1. **Contact belongs to the passenger, not the agent.** `auditPnrContact` never infers a contact is the passenger's from the name or mere presence in the PNR. It compares actual CTCE/CTCM values to the passenger's separately verified values and checks `passengerRef` association. `src/lib/audit/engine.ts` owns this; no other module re-implements contact-ownership logic.
2. **No write without consent + explicit approval.** The contact-update API (`/api/sandbox/pnr/[id]/contact`) requires `approved: true`. Nothing is written on a page load, a toast, or a model suggestion.
3. **CTCR refusal is preserved.** A passenger with `CTCR` (declined) never gets a contact written, never gets a repair proposal, and `needsRepair` is `false`.
4. **No green toast as proof.** A `saved: true` response is not accepted as verification. Kane must reload the booking in a fresh read and confirm persisted values match the passenger's verified details and correct passenger association.
5. **Deterministic code decides; the model proposes.** The audit engine is a pure function with injected time. No LLM decides reachability, coverage, or pass/fail. The model never states a number not in the record.
6. **No real customer data, no PIN/OTP/BVN/full card number.** The schema has no such fields; `FORBIDDEN_FIELDS` is enforced at the API layer. Contact values are masked in UI and receipts.

## Honesty rules

- Label REAL / DEMO / FIXTURE everywhere. The Carrier Sandbox is a FIXTURE (clearly labelled local simulation, not a live airline). Say so in the UI, README, and demo.
- Never fake a number, mode, or result. Test counts are written only after `npx vitest run` prints them. Kane exit codes are real; do not fabricate pass/fail.
- Ship an honesty table (`REAL_VS_MOCKED.md`) with `Real / Real but simplified / Fixture / Not built`. Candor buys more than polish.

## Definition of done (binary, per task)

A task is done only when:
- [ ] `npx next build` passes cleanly (TypeScript + turbopack)
- [ ] `npx vitest run` passes; the count is the actual printed count
- [ ] The behavior is exercised through a real endpoint (curl or browser), not just asserted in a unit test
- [ ] If it's a Kane-facing behavior, a Kane run was attempted and the exit code + evidence were saved to `.testmuai/evidence/`
- [ ] `REAL_VS_MOCKED.md` was updated if the claim's reality changed

## Stop conditions

- Do not build the differentiator until M1–M3 exist (real integration identifier, attack lab, race test).
- Do not polish the UI before the mechanism is verified.
- Do not commit after the internal cutoff (6–10 hours before the Nov 26, 7:29 PM WAT deadline).
