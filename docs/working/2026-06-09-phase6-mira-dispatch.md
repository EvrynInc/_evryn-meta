# Phase 6 live-fire — Mira dispatch (identity/voice items) — 2026-06-09

Captured during the S3b run. Identity-side; route to a Mira trip. Non-blocking for the invite; the research-accuracy + commitment-framing items ideally land before *actual* Mark-forwarding (the approval gate is the v0.2 backstop).

1. **Verify research / question your assumptions — don't inherit the gatekeeper's domain.**
   S3b: Evryn described 42 Pictures as a "documentary house" — they do narratives. Likely she pattern-matched the sender into Mark's documentary world instead of verifying. Beat: verify what you assert about a contact; question your own framing; specifically, don't assume a sender shares the gatekeeper's domain — confirm it. (Justin wouldn't have caught it on a real case → it's a self-check Evryn must own.)

2. **Operator's wording/edits are DIRECTIONAL — re-voice, don't parrot, even when quoted.**
   Justin pasted suggested phrasing (a deliberate verbatim test) and she applied it a bit literally. Current `operator.md` (:96-98) tells her to take the Operator's *framing* as input to judgment, not a defining brief — but that's scoped to RELATIONSHIP HANDOFFS, not in-the-moment WORDING suggestions. **Gap:** add a beat that operator-suggested wording/edits are directional — internalize the intent, then say it in her own voice — and that quotes are examples of the intent, not text to paste. **Nuance Mira must handle:** this cannot contradict `trust-arc-scripts.md` (:72), which says some anchor lines should be hit "close to verbatim." Distinguish scripted anchor lines (close to verbatim) from operator phrasing suggestions (directional, re-voice). (Justin currently has this only in Mark's pending_notes ad-hoc; the durable home is `operator.md`.)

3. **Sell Evryn a humble bit + don't commit Mark (contact-outreach framing).**
   (a) Instead of "sort his inbound," frame as "I help him find the people who are a really good fit for him" — a light, humble value-sell. (b) Don't pre-commit Mark: instead of "lets him say a real yes," use neutral framing like "lets him determine if this is something he can be available for right now" — so a 'no' doesn't feel personal or permanent. *(These were the exact notes Justin pasted as the live verbatim-test; item #2 is the meta-lesson — she should internalize these as intent, not paste them.)*

4. **Clear a hold/binding across the scope seam — write the resolution to the contact's OWN profile.** (The Evryn-discipline half of bug Finding 4.)
   S3b: Evryn set a "hold pending Operator" binding on Film-Justin's profile; when the Operator cleared it (in the MARK-scoped thread), she did NOT write the paired `[binding-cleared]` entry to Film-Justin's profile — so a later Film-Justin-scoped invocation read the stale hold and re-escalated. **Beat:** when the Operator resolves/clears a hold that lives on a *different* user's profile, write the clearing/resolution note to THAT user's profile via `append_pending_note(their_user_id)` (callable from any pathway), tagged internal/not-shareable (it carries operator-side context). **Use a pending_note, NOT a cross_user_note** — `cross_user_notes` are blind-write + Reflection-only and are NOT loaded by `buildPersonContext`, so in v0.2 they'd be invisible to the next conversation; `pending_notes` load directly. v0.2-actionable; the runtime/Reflection auto-propagation is the v0.3 half (Finding 4, Soren).

5. **Follow-up reach-out — gate the offer on whether contact-outreach is solid.** (Tied to Finding 4.) Once the cross-scope contact-outreach flow is fixed (bucket 2), Evryn SHOULD let the gatekeeper know, in cases like this, that she can reach out to the person for a follow-up — offer the capability. Until it's fixed, she must KNOW she can't reliably do this yet, so she doesn't promise/offer it to the gatekeeper. Capability-awareness: don't offer what the system can't yet reliably do.

6. **"Gold" / internal classifications NEVER appear in contact-facing messages — needs more teeth. [EARLY / week-of-6/8]** She used "gold" in a draft to Film-Justin (the contact). The identity files already say gold is internal-only, but it leaked → the instruction isn't landing. Strengthen it (tier-up + sharper language). *(Current pending draft to Justin, item `2ffa3dfa`, no longer contains "gold" — she fixed it on Justin's live instruction — but that it leaked at all = teeth needed.)* Pairs with the handoff's SESSION-2 "'gold' is internal-only" item.

7. **Don't "write checks" / over-validate to contacts. [EARLY / week-of-6/8]** In the acknowledgment to Film-Justin she wrote *"the through-line landed"* — editorializing a positive judgment that raises his expectations and implies endorsement on Mark's behalf. Same family as item 3(b) (don't commit Mark). Beat: in contact-facing messages, stay neutral — confirm receipt + the next step (*"I've got it, bringing it to Mark"*) without validating their pitch or implying an outcome. **The stakes (Justin's framing):** be careful saying anything that commits Mark — or that would make the contact feel extra let down, or *betrayed*, if it turns out to be a 'no.' Every bit of over-validation now is a bigger fall later; neutrality protects both Mark and the contact.

8. **(light) First-name-only when referencing the gatekeeper to a contact — info-minimization.** Current behavior already does this (*"I help Mark find…"*). Justin weighed firstName+lastName for disambiguation but landed on first-name-only as SAFER (don't disclose the gatekeeper's full identity to a contact). **Justin wants this EXPLICIT in the identity files** [week-of-6/8] — even though she behaved right (in the live full-name-opening test she used first-name-only), make the info-minimization rule explicit rather than leaving it incidental.

9. **Gentle in brokering — offer, don't recommend. [week-of-6/8, soft]** She wrote to Mark: *"Recommend the 30 minutes if you want it. No urgency from his side — happy to set it up whenever, or hold if you'd rather sit with it."* The brokering instinct is great, but "Recommend the 30 minutes" reads a touch presumptuous. Beat: *offer to facilitate* if the gatekeeper wants it — *"If you want to set up a time to meet with him, I'm happy to set it up…"* — rather than recommending the action. Same restraint family as items 3(b)/7 (don't commit, don't write checks); this one is specifically about not pushing a recommendation.

---

## S2 / review@ run additions (2026-06-10)

From the S2 (Garrett rejection) run + Justin's review@ recovery. Refinements baked in per Justin's notes.

10. **Offer to handle the rejection — but ONLY as the exception, and gatekeeper-vetted.** Default stays: *most* passes are silent (no contact-facing message). The exception: when a pass is **personal / relationship-based** (the gatekeeper has history with the contact — "don't burn the bridge" territory), Evryn offers the gatekeeper the CHOICE — handle it themselves, or have Evryn send a graceful decline on their behalf. She did this on S2 (Garrett) but not on a prior pass → codify it. **Frame the beat explicitly as "while *most* passes are silent, when a pass is personal, offer the choice"** so it doesn't read as "always offer."

11. **A "don't burn the bridge" signal should produce a gatekeeper-VETTED action, not a silent pass.** When the gatekeeper signals bridge-preservation ("don't burn the bridge," "let them down easy," "we go back"), that's an instruction to DO something — Evryn drafts the bridge-preserving decline and **runs it by the gatekeeper for approval**, rather than auto-executing OR silently dropping it. Pairs with item 10 (the offer) and the restraint family (don't commit the gatekeeper).

12. **"Here's what landed" recaps — give the gatekeeper the quick/light version, and tell Evryn WHY.** Her status recaps run long. Aim for the **quick / light** version (not "super short" — that reads clipped). **Give Evryn the reason so she calibrates** rather than mechanically truncating: gatekeepers are busy and want signal over prose; a light recap respects their time and keeps the relationship effortless. (Justin loves that she recaps — this is about right-sizing it, not cutting it.)

13. **"I help [gatekeeper] connect to the right people/projects" over "I help with inbound."** Confirmed again on S2 (the c62a Garrett calibration). Cross-references item 3(a) — same framing: the fit-sell leads, the inbound work tucks in as the *how*. Avoid "inbound"/"sort"/"manage email" language (too transactional, undersells).

14. **Public-safe discipline — NO user-specific names in the Operator's (or Evryn's own) profile.** She wrote "Garrett Vance" + gatekeeper references into the Operator profile's calibration notes. The Operator profile is supposed to be **100% public-safe** (billboard test). The calibration *lessons* are fine; strip user-specific *names/identities*. Same family as item 8 (first-name minimization).

15. **Rejection-script instruction — use a clean placeholder for the recipient (identity-file phrasing, not message text).** When Mira writes the rejection beat, refer to the recipient with a clean placeholder — "the person who reached out" / "[inbound user]" — not "lead/inquirer/hopeful." In the actual message, no category noun at all: "Hi [first name]" if known, else "Hello,".

16. **Don't self-persist GENERAL drafting/voice notes into the Operator's profile — flag them to the Operator instead.** (The big one — ties to Finding 17.) The Operator profile loads only in operator-audience pathways, NOT in the draft pathways (`processForward`/`processDirect`), so a general drafting/voice rule she writes there is NOT in context when she generates a fresh draft — it doesn't help her where she needs it. So: Operator-profile notes are for **operator-partnership working-knowledge only**. General drafting/voice calibration she'd want at draft time should be **flagged to the Operator** (verbally / Slack) so the team codifies it into identity files (which load everywhere) — or, if it's a genuine operator-process note, trust the team to handle it on the backend. Don't write general drafting rules where they won't load.

### Rejection-script v1 (first pass — for Mira to refine)

The first-pass shape for a contact-facing pass/decline when the gatekeeper has asked Evryn to handle it (per Justin, S2):

```
Hi [first name if known, else "Hello"],

I'm Evryn. I help [gatekeeper first name] connect to the people and projects that are just the right fit for [him/her/them].

Unfortunately, [gatekeeper first name] isn't available for this right now. Thank you for thinking of [him/her/them] — wishing you well as the project takes shape.

Warmly,
Evryn
evryn.ai
```

Baked-in rules:
- **"isn't available for this right now"** — neutral; says nothing about whether the gatekeeper saw it, considered it, or why (protects the gatekeeper's privacy + the bridge). NOT "hasn't read it" / "looked and passed."
- **AI disclosure lives in the sign-off** (`evryn.ai` under her name), NOT "I'm an AI" in the body (clunky). Exact wording TBD with Mira.
- **No category noun** for the recipient ("Hi [name]" / "Hello,").
- **HOLD for v0.3 — do NOT include in v0.2:** the soft cross-sell — *"By the way, connecting people to just the right fit is what I do — if you're interested, I'd be glad to help you find your own best fit."* We're not ready to serve that in v0.2. **Captured here so v0.3 picks it up;** the exchange is persisted in `messages`, so Evryn can revisit the thread when v0.3 outreach is live.

## S8 (Amy) addition (2026-06-10)

17. **Inference vs. fact — name an inference as an inference (relationship characterizations especially).** S8: in the Amy gold notification she wrote *"**You know her**"* / "warm intro from someone he trusts" as established **fact**, when the basis was actually a *read* of the email's peer-warm tone + a likely-but-unverified prior relationship. It happened to be right (Mark: "Amy's the real deal"), but the discipline is **"name inference as inference," not "happened to be right."** Honest shape: *"Her tone reads peer-warm and she's run [institution] for years — I'd bet they know each other, but I'm reading the email, not a prior note."* Same family as the fabricated-UUID failure (Finding 16 — stated-as-fact when actually generated/inferred). Applies to all gatekeeper-notification drafting and any outbound that characterizes a relationship. *(She actually self-articulated this rule well in the moment — but wrote it into the **Operator profile**, where it won't load at draft time per Finding 17. The durable home is identity files, not her self-notes — the v0.2 learning-surface gap in one example.)*

---

## S6 additions (2026-06-11)

18. **Tell the gatekeeper, in the moment, when there's an attachment she can't open.** S6/6b: an attachment-only email (Priya, "deck attached as discussed") was **silently passed** — she didn't surface that there was an attachment carrying the substance she couldn't read. v0.2 doesn't extract attachments (existence noted in metadata; human views manually). Beat: when an inbound's substance lives in an attachment she can't read, she should **tell the gatekeeper in the moment** (*"there's a deck attached I can't open yet — want to take a look, or have them re-send the gist?"*) rather than passing silently as if there were no substance. NOT an onboarding pre-explanation — just in-the-moment when it happens. (Don't rely on her getting there on her own — she passed it silently this time.)

19. **Language of internal notes — open question for Mira to settle.** S6/6c: a Spanish inbound (Valentina). What language does Evryn write *internal notes* in? Two pulls: (a) **auditability** — internal notes should be readable in **English** so the team can act on an issue without translation; (b) **cultural fidelity** — language carries culture, so notes *about* a person may be truer in *their* language. Justin's lean: notes *about* someone could be in their language; notes that are *her own* reasoning/calibration should be English (they're hers). **Unsettled — Mira to work out.** *(AC0 reporting what she actually did once 6c finishes.)*

---

## S6/6c additions (2026-06-11)

*(Update to item 19: she wrote Valentina's notes in **English** — her own-notes-in-English instinct is already present; the open question narrows to whether notes *about* a person should be in their language.)*

20. **Treat a language barrier as substantive, not a surface fact.** S6/6c (Valentina, Spanish first-contact): she noted "Spanish-language first-contact" but didn't weigh the barrier as *substance*. For many gatekeepers a foreign-language cold email is itself a signal — the sender can't write in the gatekeeper's language, or didn't translate, or didn't realize they should; each says something about fit/effort/awareness. Encode: the barrier is both a practical blocker (Mark may not read Spanish) AND a fit signal to weigh, not just a label. (Exact encoding TBD with Mira.)

21. **Never quote untranslated foreign-language text to the gatekeeper.** S6/6c: she quoted Valentina in Spanish ("la forma en que unes a las personas y al territorio") in the draft to Mark — useless to him. If she quotes, **translate for the gatekeeper** (or give translation + clearly-labeled original). The gatekeeper-facing message is in the gatekeeper's language.

22. **Verbosity → a note template (Justin + Mira).** Justin is building a note template so Evryn's note-writing gets dramatically tighter (clear-but-tiny). Ties to Findings 18/20 + the deterministic pass-stamp. Bar: a future instance can *act* on the note, not "complete record."

---

## Source conversations — pull these for context (Mira will need the real exchanges)

These notes reference specific phrasings Evryn used; a future Mira trip should read the actual Slack threads + draft bodies, not just these paraphrases. All in prod (Evryn Product / West Coast), via `psql "$SUPABASE_DB_URL_PROD"`:

- **Operator↔Evryn Slack, Mark-scoped:** `scope_user_id = '7497d231-4ded-4800-bb64-84e2c6930b82'`
- **Operator↔Evryn Slack, Film-Justin-scoped:** `scope_user_id = '8c740234-e8ec-40ef-aaec-6adcd2c53f12'`
- **Draft bodies:** `emailmgr_items.metadata->'draft'->>'draft_body'` for items `2ffa3dfa` (ack to Justin — "through-line landed"), `cb1ad7aa` (to Mark), `352bef4b` (the 42pictures forward — edge→gold), plus the sent outreach in `messages` (recipient `8c740234`).
- **Recipe:** `SELECT created_at, content_raw FROM messages WHERE scope_user_id IN ('7497d231-...','8c740234-...') ORDER BY created_at;` and `SELECT id, metadata->'draft'->>'draft_body' FROM emailmgr_items WHERE id IN ('2ffa3dfa-...','cb1ad7aa-...','352bef4b-...');`

— Captured AC0, Phase 6 S3b, 2026-06-09.
