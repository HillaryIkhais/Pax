<div align="center">
  <img src="https://github.com/HillaryIkhais/Pax/raw/main/public/pax-icon.svg" width="140" alt="PAX" />

# PAX

### Your flight is booked. But can the airline reach **you**?

<br/>

<sub>A tool that checks whether your airline booking record actually contains <b>your</b> contact details — and proves the fix stuck.</sub>
</div>

---

## The problem, in one story

You book a flight through a travel agent.

The confirmation arrives, you pack, you head to the airport. Meanwhile the airline sent a delay notice two hours ago — and it went to the **agent's** phone number, because that's what's written in the booking record.

You walk into the terminal and only then find out your flight was cancelled this morning.

This is not a hypothetical. On **May 27, 2026**, Nigeria's civil aviation authority warned that passengers were arriving at Abuja airport with no idea their flights had been disrupted — because travel agents had put their own contact details in the booking record.

The airline had a way to reach someone. It just wasn't you.

---

## What PAX does

PAX answers one question: **does this booking record contain your own contact details, attached to you?**

You enter the email and phone number you actually control. PAX compares them against the fields airlines genuinely use — `CTCE` for email, `CTCM` for mobile, `CTCR` when a passenger has said they'd rather not be contacted.

It does not assume the contact on the record is yours just because your name is on the booking. It checks the real values, and it checks that the contact is attached to **your** passenger, not the agent's and not the other passenger's sitting on the same reservation.

When something is wrong, PAX shows you exactly what it found. Nothing is changed until you tick the box and approve it yourself.

Then — and this is the part that matters — PAX **reloads the booking from scratch** and checks what's actually stored. A green "Saved" popup is easy. A stored contact is proof.

---

## Try it in 60 seconds

```bash
npm install
npx tsx src/scripts/seed.ts     # loads 5 demo bookings
npm run dev                     # then open http://localhost:3000
```

Five bookings are waiting on the home screen. Each one demonstrates something different:

| Booking | What you'll see |
|---------|-----------------|
| `AX1234` · OKONKWO | The **agent's** contact is sitting on your booking. Flagged. |
| `BY5678` · ADEBAYO | Two passengers, one reservation — the **same** contact on both. Flagged. |
| `CZ9012` · IBRAHIM | This passenger **declined**. PAX respects it and writes nothing. |
| `DX3456` · SANUSI | Already correct. PAX changes nothing it doesn't need to. |
| `FS7777` · FALSE | The interesting one. Keep reading. |

Pick `AX1234`, type in your own email and phone, tick the boxes to confirm you control them, and run the audit.

You'll get told the contact on that booking belongs to the travel agent. You approve the correction. PAX applies it. Then it reloads the booking and checks the change is really there — and gives you a receipt with masked contacts, a timestamp, and every verdict behind it.

---

## The part I'm proudest of

**What if the system lies to you?**

PAX ships with a deliberately broken booking, `FS7777`. Approve a correction on it and the portal cheerfully shows a green *Saved* toast. Nothing was written. The contact on the record never changed.

A tool that trusts its own success message would call that a win.

PAX doesn't. It reloads the booking in a fresh read, sees the old contact still sitting there, and reports failure.

That check isn't a button in the app — it's a real browser driven by **Kane CLI**, the sponsor's tool. Kane opens the page, performs the correction, reloads the booking independently, and returns an honest exit code. When it caught the broken save, it exited `1`. After the persistence path was fixed, it exited `0`.

The loop, end to end:

1. Kane opens the booking and performs the correction.
2. The portal shows green. Kane doesn't care.
3. Kane reloads the booking in a fresh browser read.
4. The contact was never saved. **Kane fails, exit code 1.**
5. The agent reads Kane's failure evidence and fixes the persistence path.
6. Kane reruns the same flow. The contact is really there. **Exit code 0.**

That's the loop this submission is built on: the agent builds, Kane verifies, Kane's own failure output drives the fix, Kane re-verifies. Kane isn't a logo at the end. It's the thing that decides whether we're done.

---

## What's real and what isn't

I'd rather tell you this plainly than let you find out later.

- **The audit, the consent gate, the receipt, the re-verification** — real, and covered by 9 passing tests.
- **Nothing is written without your explicit approval.** The API refuses to save unless you approved it. No page load, no toast, no suggestion writes anything.
- **If you declined, you stay declined.** A passenger marked `CTCR` never gets a contact written for them, ever.
- **The bookings are a fixture.** MockAir and the Carrier Sandbox are a clearly labelled local simulation. There is no live airline integration, and I'm not claiming one.
- **PAX does not promise your airline will text you.** It proves the record contains your contact at the moment of verification. Delivery is the airline's job, and I can't guarantee it.
- **No real customer data.** Contacts are masked everywhere they appear — `b•••••s@domain`, `••••0000`.

---

## Run it yourself

```bash
git clone https://github.com/HillaryIkhais/Pax.git
cd Pax
npm install
npx tsx src/scripts/seed.ts     # 5 demo bookings
npm run dev                     # http://localhost:3000

npx vitest run                  # 9 passed, 0 failed
npx next build                  # clean
```

To watch Kane verify a flow for yourself, you'll need a TestMu AI account — register, claim your credits, then `kane-cli login --oauth` and run the scenarios in `tests/kane/`.

---

## What's in the box

| Want to see… | Open this |
|---|---|
| The reasoning that decides if you're reachable | `src/lib/audit/engine.ts` |
| The screen you'd actually use | `src/app/page.tsx` |
| The five demo bookings | `src/lib/db/seed.ts` |
| Kane catching the fake save | `scripts/kane-verify.mjs` |
| The full list of what's real vs simulated | `REAL_VS_MOCKED.md` |
| The questions a judge would ask | `JUDGES.md` |
| How the demo video was made | `production/` |

---

<p align="center">
  <b>Your flight is booked. Can the airline reach you?</b>
  <br/><br/>
  <sub>Built for the Kane CLI Online Hackathon by TestMu AI · <a href="https://github.com/HillaryIkhais/Pax">github.com/HillaryIkhais/Pax</a></sub>
</p>
