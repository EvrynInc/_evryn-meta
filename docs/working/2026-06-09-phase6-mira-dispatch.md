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

## Source conversations — pull these for context (Mira will need the real exchanges)

These notes reference specific phrasings Evryn used; a future Mira trip should read the actual Slack threads + draft bodies, not just these paraphrases. All in prod (Evryn Product / West Coast), via `psql "$SUPABASE_DB_URL_PROD"`:

- **Operator↔Evryn Slack, Mark-scoped:** `scope_user_id = '7497d231-4ded-4800-bb64-84e2c6930b82'`
- **Operator↔Evryn Slack, Film-Justin-scoped:** `scope_user_id = '8c740234-e8ec-40ef-aaec-6adcd2c53f12'`
- **Draft bodies:** `emailmgr_items.metadata->'draft'->>'draft_body'` for items `2ffa3dfa` (ack to Justin — "through-line landed"), `cb1ad7aa` (to Mark), `352bef4b` (the 42pictures forward — edge→gold), plus the sent outreach in `messages` (recipient `8c740234`).
- **Recipe:** `SELECT created_at, content_raw FROM messages WHERE scope_user_id IN ('7497d231-...','8c740234-...') ORDER BY created_at;` and `SELECT id, metadata->'draft'->>'draft_body' FROM emailmgr_items WHERE id IN ('2ffa3dfa-...','cb1ad7aa-...','352bef4b-...');`

— Captured AC0, Phase 6 S3b, 2026-06-09.
