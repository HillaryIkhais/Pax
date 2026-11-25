# PAX — Voiceover Script

**Tone:** Conversational, confident, human. Like someone explaining something they genuinely believe is worth paying attention to. No corporate spokesperson. No motivational speaker. No AI assistant reading a generated script. Natural contractions. Varied sentence lengths. Pauses where they matter.

**Target runtime:** ~120–150 seconds (2–3 minutes)

---

## ACT 1 — The moment that makes you care (0:00–0:25)

**[Visual: Black screen. Then a phone buzzing on a kitchen counter. The screen lights up: “FLIGHT DELAYED — NEW DEPARTURE 14:30.”]**

**Narrator:**
You book a flight through a travel agent. Everything looks fine. Confirmation number in your inbox. You're packed. You're headed to the airport.

**[Visual: Airport terminal. Traveler walking with a suitcase, checking their phone. No new messages.]**

**Narrator:**
But the airline sent a delay notice an hour ago. It went to your agent's email. Not yours. Your agent's phone. Not yours.

You walk into the terminal. The board shows your flight — delayed, rescheduled, cancelled. And you had no idea.

**[Visual: Close-up of the traveler's face. Realization. Then text on screen: “The airline had a way to contact someone. It just wasn’t you.”]**

**Narrator:**
This happened in Abuja on May 27th, 2026. The civil aviation authority warned about it. Passengers arrived at the airport completely unaware their flights had been disrupted — because travel agents had put their own contact details in the booking record.

The airline could reach someone. Just not the passenger.

**[Beat. Silence for one second.]**

---

## ACT 2 — What PAX is (0:25–0:50)

**[Visual: Clean, simple. PAX opens. One question at the top: “Your flight is booked. But can the airline reach you?”]**

**Narrator:**
This is PAX. It checks whether the airline's booking record actually contains your own contact details — not just an email somewhere on the booking, but *your* email, *your* phone, attached to *you*.

Airlines use specific fields: CTCE for email, CTCM for mobile, CTCR when a passenger declines to share. PAX reads those fields. Compares them against what you've verified as your own. And checks that the contact is attached to your passenger reference — not the agent's, not another passenger's.

**[Visual: Cursor moves through PAX. Selects a booking. Enters airline, reference, surname.]**

**Narrator:**
You enter your booking reference. Your surname. Then you enter and verify your own email and phone. PAX doesn't send them anywhere. It only uses them to compare against what's on the record.

---

## ACT 3 — The mechanism (0:50–1:30)

**[Visual: PAX runs the audit. Red flags appear.]**

**Narrator:**
Here's what it finds. This booking — the contact on file is the travel agency's email. Not yours. That's flagged. Or this one — two passengers on the same booking, and one passenger's phone number got attached to the other person. Also flagged.

**[Visual: Cursor hovers over a flagged contact. Plain-language explanation appears: “The contact on this booking belongs to the travel agent, not to you.”]**

**Narrator:**
PAX doesn't hide the problem behind a generic “something went wrong.” It tells you exactly what's wrong, in plain language.

**[Visual: A consent box appears. Plain language: “You authorise these contact details to be shared with the airline for operational flight notifications only. Not for marketing.” The user checks a box. Clicks “Approve.”]**

**Narrator:**
Before anything is written, you give explicit consent. Plain language. Not legalese. You review the proposed change. You approve it. Nothing happens without your say-so.

**[Visual: The correction is applied. A green “Saved” toast appears — but then the screen reloads fresh.]**

**Narrator:**
Here's the part most tools skip. PAX doesn't trust a green “Saved” toast. It reloads the booking in a completely fresh read. And only then — only if the persisted contact fields match your verified details and the right passenger — does it mark you as verified.

**[Visual: Green checkmark. “PASSENGER CONTACT VERIFIED.” Evidence receipt appears with before/after digest, timestamp, masked contacts.]**

**Narrator:**
You get an evidence receipt. Before and after. Timestamps. Masked contact values. Proof you can actually point to.

---

## ACT 4 — The Drey moment (1:30–2:00)

**[Visual: The screen shifts. A different booking loads: FS7777. The user applies a correction. Green “Saved” toast. Confident smile — then the screen reloads.]**

**Narrator:**
But what if the system lies? What if it says “Saved” and never actually writes anything?

That's the moment this becomes more than a form. That's the Drey moment.

**[Visual: Kane CLI runs in a terminal. Real browser window opens. Navigates to the booking. Reads the contact. Red text: “FAILED — contact not persisted.”]**

**Narrator:**
Kane CLI opens a real browser. Reloads the booking. Reads the contact afresh. And finds — nothing was saved. The green toast was a lie. Kane returns failure.

**[Visual: The coding agent reads the failure. Edits the persistence path. Saves. Kane runs again. Green. “PASS — contact persisted and verified.”]**

**Narrator:**
The agent reads Kane's failure evidence. Fixes the bug. Reruns Kane. And this time — the contact is really there. Verified by an independent browser, not a success message.

**[Visual: Text on screen: “No green toast accepted as proof. No LLM declaring itself successful.”]**

**Narrator:**
That's the closed loop. Agent builds. Kane verifies. Agent fixes. Kane confirms. That's what this submission is scored on.

---

## ACT 5 — The honesty (2:00–2:20)

**[Visual: Clean screen. “What’s real” vs “What’s not.”]**

**Narrator:**
Here's what I'll tell you straight. The demo you just saw runs on a Carrier Sandbox — a clearly labelled local simulation. It's not connected to a live airline. We don't claim it is.

PAX doesn't guarantee your airline will actually send you a text. It proves the booking record contains your contact — at the time of verification. That's the claim. Nothing more.

**[Visual: The five seeded bookings appear: AX1234, BY5678, CZ9012, DX3456, FS7777.]**

**Narrator:**
And every number you just saw — the verdicts, the fixes, the results — is reproducible. Nine unit tests. Five Kane scenarios. All in the repo.

---

## ACT 6 — Close (2:20–2:40)

**[Visual: PAX home screen again. “Your flight is booked. But can the airline reach you?”]**

**Narrator:**
Most travel tools tell you about your flight. PAX asks whether the airline can reach *you*.

**[Visual: Cursor clicks “Start a contact check.” The flow begins.]**

**Narrator:**
Try it. Clone the repo. Seed the sandbox. Run the audit. See for yourself.

**[Visual: Text on screen. GitHub URL. “Built for Kane CLI Hackathon — TestMu AI.”]**

**Narrator:**
PAX. Because the airline should be able to reach the person who bought the ticket.

**[Fade to black.]**

---

## Voice notes for delivery

- **Pacing:** Not rushed. Let the airport realization land. Let the false-save failure land. Silence is a tool — use it after “It just wasn’t you” and after the Kane FAIL.
- **Voice:** Warm, slightly tired but competent. Like someone who's actually stood in an airport and been frustrated. Not polished. Not over-produced.
- **Emphasis:** “your own,” “your email, your phone,” “never saved,” “really there.”
- **No hype words:** Avoid “revolutionary,” “seamless,” “game-changing.” Use plain words: “works,” “proves,” “caught,” “fixed.”
