# PAX — Storyboard

**Format:** Product demonstration video, ~120–150 seconds, 1080p, 16:9, 30 FPS  
**Style:** Human product film — not a screen recording of coding. Clean interface, deliberate pacing, actual product interaction.  
**Audio:** Conversational voiceover (see `voiceover-script.md`), restrained ambient texture, occasional sound effects for key moments (page load, verification success, failure alert).  
**Captions:** Synchronized `.srt` file, every claim captioned (judges watch muted).

---

## SCENE 1 — The problem (0:00–0:25)

| Time | Visual | Audio / Caption |
|------|--------|-----------------|
| 0:00–0:03 | Black screen. Phone buzzes on a kitchen counter. Screen lights up: push notification “FLIGHT DELAYED — NEW DEPARTURE 14:30.” | Voiceover: “You book a flight through a travel agent. Everything looks fine.” |
| 0:03–0:08 | Airport terminal. Traveler (20s–30s, casual, stressed) walks with suitcase, checks phone. No new messages. Departure board flickers in background. | “Confirmation in your inbox. You're packed. You're headed to the airport.” |
| 0:08–0:12 | Close-up: phone screen shows “No new notifications.” Departure board behind them changes: “FLIGHT DELAYED / RESCHEDULED.” | “But the airline sent a delay notice an hour ago. It went to your agent's email. Not yours.” |
| 0:12–0:17 | Traveler stops. Stares at board. Realization. | “You walk into the terminal. The board shows your flight — delayed. And you had no idea.” |
| 0:17–0:22 | Text on screen over blurred terminal background: “The airline had a way to contact someone. It just wasn’t you.” | “This happened in Abuja on May 27th, 2026. The civil aviation authority warned about it.” |
| 0:22–0:25 | Black screen. White text, one line at a time: “Passengers arrived at the airport unaware their flights had been disrupted.” | “Because travel agents had put their own contact details in the booking record.” |

**Creative direction:** No logo animation. No “Introducing.” Start with the failure. Make the viewer feel the frustration before showing the solution.

---

## SCENE 2 — What PAX is (0:25–0:50)

| Time | Visual | Audio / Caption |
|------|--------|-----------------|
| 0:25–0:30 | PAX home screen loads. Hero text: “Your flight is booked. But can the airline reach you?” Clean, warm, editorial styling. No charts, no dashboard clutter. | “This is PAX. It checks whether the airline's booking record actually contains your own contact details.” |
| 0:30–0:35 | Cursor types: airline “MockAir,” booking reference “AX1234,” surname “OKONKWO.” Clicks “Load booking.” | “Not just an email somewhere on the booking. Your email. Your phone. Attached to you.” |
| 0:35–0:40 | Form appears: “Verify passenger contacts.” User enters email and phone. Clicks “Run reachability audit.” | “You enter and verify your own email and phone. PAX doesn't send them anywhere.” |
| 0:40–0:45 | Audit runs. Spinner. Then results appear: Red flags for P1. | “It only uses them to compare against what's on the record.” |
| 0:45–0:50 | Verdict card: “NOT REACHABLE.” Plain-language explanation: “The contact on this booking belongs to the travel agent, not to you.” | “PAX reads CTCE for email, CTCM for mobile, CTCR when a passenger declines. And checks passengerRef association.” |

**Creative direction:** Show the form being filled. Not every field — just enough to feel real. Keep the interface legible. Zoom in on the verdict card.

---

## SCENE 3 — The mechanism (0:50–1:30)

| Time | Visual | Audio / Caption |
|------|--------|-----------------|
| 0:50–0:55 | Second booking loads: BY5678 / ADEBAYO. Two passengers. P1 has correct contact. P2 shows same contact as P1. | “Here's what it finds. This booking — two passengers. One passenger's phone number got attached to the other person.” |
| 0:55–1:00 | Cursor hovers over P2's flagged contact. Tooltip: “A contact matching yours is attached to a different passenger on this booking.” | “Also flagged. PAX doesn't hide the problem behind a generic error.” |
| 1:00–1:05 | Consent modal appears. Plain language: “You authorise these contact details to be shared with the airline for operational flight notifications only. Not for marketing.” User checks box. Clicks “Approve correction.” | “Before anything is written, you give explicit consent. Plain language. Not legalese.” |
| 1:05–1:10 | Correction applies. Green “Saved” toast flashes — but immediately the page reloads to a clean state. | “You review the proposed change. You approve it. Nothing happens without your say-so.” |
| 1:10–1:15 | Fresh read-back. Green checkmark: “PASSENGER CONTACT VERIFIED.” | “PAX reloads the booking in a completely fresh read.” |
| 1:15–1:20 | Evidence receipt slides up: before/after digest, timestamp, masked contact values (b•••••s@domain, ••••0000). | “And only then — if the persisted values match your verified details and the right passenger — does it mark you verified.” |
| 1:20–1:25 | Receipt card stays on screen. Cursor highlights “masked contact values.” | “You get an evidence receipt. Before and after. Timestamps. Masked contacts. Proof you can point to.” |

**Creative direction:** The reload is important — show it clearly. The green toast appearing then disappearing is deliberate; it sets up ACT 4.

---

## SCENE 4 — The Drey moment (1:30–2:00)

| Time | Visual | Audio / Caption |
|------|--------|-----------------|
| 1:30–0:35 | New booking: FS7777 / FALSE. User applies correction. Green “Saved” toast. Confident UI. | “But what if the system lies? What if it says ‘Saved’ and never actually writes anything?” |
| 1:35–1:40 | Page reloads. Contact is still the old value. The smile drops. | “That's the moment this becomes more than a form. That's the Drey moment.” |
| 1:40–1:45 | Terminal window opens. `kane-cli run ...` NDJSON streams. Real Chrome browser window appears. Navigates to FS7777. Reads contact. | “Kane CLI opens a real browser. Reloads the booking. Reads the contact afresh.” |
| 1:45–1:50 | Terminal shows red: `exit code 1 — FAILED: contact not persisted after reload`. | “And finds — nothing was saved. The green toast was a lie. Kane returns failure.” |
| 1:50–1:55 | Coding agent reads failure. Edits persistence path in `src/app/api/sandbox/pnr/[id]/contact/route.ts`. Saves. | “The agent reads Kane's failure evidence. Fixes the persistence path.” |
| 1:55–2:00 | Kane reruns. Green: `exit code 0 — PASS: contact persisted and verified.` | “Reruns Kane. And this time — the contact is really there. Verified by an independent browser.” |

**Creative direction:** This is the money moment. Uncut. Show the terminal, the browser, the failure, the fix, the pass. Don't speed it up. Let the failure land.

---

## SCENE 5 — The honesty (2:00–2:20)

| Time | Visual | Audio / Caption |
|------|--------|-----------------|
| 2:00–2:05 | Clean screen. Left column: “What’s real.” Right column: “What’s not.” Deterministic audit / Real. Consent-gated write / Real. CTCR refusal / Real. Live airline integration / Not built. | “Here's what I'll tell you straight. The demo runs on a Carrier Sandbox — a clearly labelled local simulation. It's not connected to a live airline.” |
| 2:05–2:10 | Five seeded PNRs slide in: AX1234, BY5678, CZ9012, DX3456, FS7777. | “We don't claim it is. PAX doesn't guarantee your airline will send you a text.” |
| 2:10–2:15 | Cursor clicks “Run all tests.” `npx vitest run` → “9 passed, 0 failed.” | “It proves the booking record contains your contact — at the time of verification. That's the claim. Nothing more.” |
| 2:15–2:20 | Text on screen: “Every number reproducible. Nine unit tests. Five Kane scenarios. All in the repo.” | “And every number you just saw is reproducible. All in the repo.” |

**Creative direction:** Honest. No hype. The “What’s not” column is as important as the “What’s real” column.

---

## SCENE 6 — Close (2:20–2:40)

| Time | Visual | Audio / Caption |
|------|--------|-----------------|
| 2:20–0:25 | PAX home screen again. Hero text returns. | “Most travel tools tell you about your flight. PAX asks whether the airline can reach you.” |
| 0:25–0:30 | Cursor clicks “Start a contact check.” Flow begins. | “Try it. Clone the repo. Seed the sandbox. Run the audit. See for yourself.” |
| 0:30–0:35 | GitHub URL appears: `https://github.com/HillaryIkhais/Pax.git`. Below: “Built for Kane CLI Hackathon — TestMu AI.” | “PAX. Because the airline should be able to reach the person who bought the ticket.” |
| 0:35–0:40 | Fade to black. White text: “PAX — Can the airline reach you?” | (Voiceover ends. Ambient texture fades out.) |

**Creative direction:** End clean. No logo animation. Just the URL and the question.

---

## Production notes

- **Captions:** Every caption line above must be in `captions.srt`, synchronized to the voiceover. Judges watch muted.
- **Voiceover:** Human delivery. Conversational. Not robotic. See `voiceover-script.md` for delivery notes.
- **No fake cursor:** All interactions are real product usage.
- **No post-production numbers:** If a number changes in the product, re-record that scene.
- **Music:** Restraint. Ambient texture under narration only. No music under speech.
- **Export:** MP4, 1920×1080, 16:9, 30 FPS.
