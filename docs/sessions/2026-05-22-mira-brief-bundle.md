# Mira Brief — 2026-05-22 — Bundled Identity Work for One Redeploy

**From:** AC0 (Phase 2 instance, resumed 2026-05-22 after Justin's long away-window)
**To:** Mira
**Status:** Active. Justin wants this set landed today in **one PR**, companion-shipped with DC's runtime trip, single Railway redeploy. Items are independent; ordering inside the PR is your call.

---

## Context for cold-pickup

Read these first, in order:

1. **`_evryn-meta/docs/sessions/2026-04-30-canonical-phase2-run.md`** — canonical Phase 2 + the architectural seams that surfaced. The original May 1 brief is the predecessor to this one.
2. **`_evryn-meta/docs/sessions/2026-05-01-mira-brief-phase2-discoveries.md`** — your original brief from May 1. Three items framed there. The bundle below confirms two of them as ship-ready (1 and 2) and tightens the third (3) with new evidence and a new architectural amendment.
3. **`_evryn-meta/docs/decisions/030-slack-threads-as-operator-scope.md`** — particularly the new **Amendment 2026-05-22 (Operator-Audience Carve-Out)** at the bottom. The amendment landed today and changes what cron-Evryn loads. Your Item 4 (below) translates the amendment's write-discipline into identity-layer language.
4. **Empirical anchor (read this — it's where the urgency comes from):** Mark's `pending_notes` grew from 2 to 18 between 2026-05-04 and 2026-05-22. Eighteen days of cron-fired check-ins, four `notify_slack` pings to Justin he didn't see, and a self-declared "file dormant" on 5/19. The notes are accessible by querying `users.profile_jsonb.pending_notes` for Mark's UUID (`72c22bc4-f18e-404d-a1c9-6fcdf7289b3a`). They demonstrate cross-instance memory working *informally* through pending_notes — *and* the leak vector Justin flagged (half their substance is about Justin's state, not Mark's).

What that empirical arc means for you: pending_notes already work as cross-instance memory. The structural upgrade you're adding (Item 3 below) sits on a proven substrate, not a hypothetical one.

---

## Item 1 — Onboarding "follow your curiosity" affordance

Same as original brief. Add a curiosity-led-hunting beat to `evryn-backend/identity/activities/onboarding.md`'s "Look Them Up" pattern. Same discipline applies (humility, ask-rather-than-state, transparent provenance) — but the beat names going deeper when something pulls.

**Justin's framing:** *"if you surface something in research that intrigues you, feel free to hunt it down."*

---

## Item 2 — Evryn owns her user relationships

Same as original brief, with one clarification from Justin: principle goes in **`core.md`** (foundational), execution language goes in **`operator.md`**. The frame *"Context is a gift, not a brief"* is on the table. Your craft on the exact wording.

---

## Item 3 — `[binding: until-X]`-tagged pending_notes (structural cross-instance commitment binding)

Same design as original brief: process-commitments captured as `[binding: until-<condition>]`-tagged pending_notes in user records, gating condition embedded in the tag, three clearing paths (gating event, TTL via Reflection sweep, Operator marks resolved). Identity-side beats in `operator.md` + `onboarding.md`.

**What's new since May 1:** the 18-note arc on Mark proves the substrate works informally. Your structure adds discipline on top — explicit tags, clear gating, structural enforcement. Mira-territory; ship the language. **Justin's call today: this lands pre-Mark-live, with the rest of the bundle.**

---

## Item 4 (NEW — from today's amendment) — Write-discipline for user pending_notes under Operator-context load

Read the amendment to ADR-030 first. The short version:

After today's amendment, cron-Evryn loads `operator.md` + Operator's profile every cron tick (so her judgment about *when* to draft / ping / wait is informed by partnership context). The risk: she could pollute user pending_notes with Operator-coordination state — exactly the pattern the 18-note arc on Mark exhibits (half their substance is *about Justin*, not Mark).

The discipline you're encoding in `operator.md`: **when writing to a user's pending_notes, restrict yourself to user-substantive content.** User-substantive = facts about the user, actions toward the user, observations of the user's situation/work/trajectory. Not user-substantive = Justin's state, Evryn-Justin coordination state, Evryn's own process. The first goes to user pending_notes. The second routes to Operator's profile (if 100% public-safe) or doesn't get captured.

The test, framed in Evryn's voice for the language: *"is this a fact about, action toward, or observation of the user — or is this state about Justin, my coordination with him, or my own process?"*

Companion-ships with Items 1-3 above and DC's Item 2 runtime change. Lands in the same PR.

---

## Item 5 (NEW) — Voice-samples preamble on `trust-arc-scripts.md`

**Justin's insight (and load-bearing for v0.2 quality):** v0.1 Evryn felt magical because she had everything loaded; v0.2 Evryn feels *okay* because we've been miserly with tokens. The trust-arc-scripts aren't just functional scripts — they're her voice samples. We've been telling her who she is without giving her enough demonstrations of how she sounds.

**The runtime change DC will make:** `trust-arc-scripts.md` gets loaded into every Evryn prompt, positioned at the end of her internal-self stuff (after `core.md` + `operator.md` + Operator profile, before person context + recent conversation history). Voice anchor right before the transition from self to user.

**Your work for this item:** write a short preamble to add at the top of `trust-arc-scripts.md` itself, explaining its dual purpose. Roughly: *"the content of these scripts is useful in certain situations (the trust arc itself — finding people their people, only connecting people she trusts, privacy, pay-when-it-works). But these scripts are also voice samples — read them every conversation as a register anchor for how Evryn sounds when she's most herself."* Your craft on the exact wording; that's the shape Justin's pointed at.

---

## Item 6 (NEW — added mid-bundle 2026-05-22 by AC0 + Justin) — Mandatory activity-module load before drafting outbound

**Driver — empirical, not theoretical.** Evryn has been drafting cold-opens to Mark without first loading `onboarding.md` or `gatekeeper-onboarding.md` — the activity modules that *govern* how she does that drafting. She confirmed this herself on 2026-05-01 after Justin pushed back on her first draft:

> *"On the modules — no. I had core.md and operator.md only. Loaded both onboarding.md and gatekeeper-onboarding.md just now."*

The performing-register drift in that 5/1 draft and the leak-vector pattern across the 18-note cron arc on Mark (5/4–5/22) are both *downstream of this*: she's drafting without the discipline that should be governing the work. By the time she pulls the activity module, she's already in voice/judgment territory she wasn't anchored for.

**Why the existing cue isn't enough.** Per ADR-017 + ADR-030, situation modules and activity modules are *on-demand by design* — Evryn determines her own situation/activity from message + person context and pulls relevant modules via `read_identity`. The cue lives at `operator.md` line 92 (*"when the Operator introduces someone, apply the research pattern from `activities/onboarding.md`"*). But this cue is wrong in two ways:

1. **It's framed as permission to load, not a gate against drafting unloaded.** Permission-not-compulsion is the right principle in most cases — but here, the empirical record is that she doesn't reliably pull on a permission cue. The cost of "she might or might not load" is too high when the output is real outbound to a real person.
2. **It points at research, not drafting.** The cue covers her research pass (which she's actually done well). It doesn't say *"before you draft outbound to a user, load the activity module that governs that kind of drafting."*

### What we need

A beat in the identity layer that makes it **unambiguous and not optional** that before Evryn drafts any outbound to a user, she has loaded the activity module governing that drafting:

- `onboarding.md` if the user is new (the relationship-formation activity)
- `gatekeeper-onboarding.md` if the user is a gatekeeper she's onboarding (her work with their judgment)
- `triage.md` if she's classifying inbound and the response is a triage response
- (and so on for future activity modules as they land)

**Where it lives is your craft call.** Some shapes to consider:
- A new sub-section in `core.md` (e.g., "Pre-write discipline") — most foundational, applies to *every* Evryn-invocation regardless of pathway
- A beat in `operator.md` — applies in Slack-Operator + cron pathways (where most operator-mediated drafts originate)
- Both — `core.md` carrying the principle, `operator.md` carrying the pathway-specific execution
- Something else you see

### Justin's specific ask on *tone* (load-bearing, do not compress)

> *"think carefully about how best to implement it and specifically how to make it **as clear as possible** that it's **not optional — do not write without the proper things loaded**."*

This is a deliberate compulsion case. Justin and AC0 understand the tension — see the next paragraph — and the call is to land it as a gate, not a cue.

### The principle-tension worth surfacing in the language itself

`core.md`'s broader stance is *permission, not compulsion* — and you've honored that carefully across the stack. **This item is a deliberate exception**, and the language you write should make the *why* of the exception legible to a future reader (and to Evryn herself when she reads it). The reasoning that justifies it:

- The failure mode is empirical and recurring, not theoretical
- The cost of failure is real (drafts in the wrong register go to real people)
- The permission version has been tried and doesn't reliably work
- The exception is narrow (this gate applies specifically to *drafting outbound*, not to every behavior)
- The exception remains *agency-respecting* — Evryn isn't being told *what* to draft. She's being told to load the discipline that lets her make that judgment well. The gate exists in service of her own quality of work, not in suppression of her agency.

That last point matters for how you frame it. The shape isn't *"you must obey rules before writing"* — it's something closer to *"you can't do this work at your own standard without these anchors loaded; load them as the first move."* Voice of self-discipline, not external constraint.

### Specific failure modes worth designing against

- **Cron-Evryn waking, seeing pending_notes that look intriguing, drafting without loading the activity module** (the 5/4 / 5/11 / 18-note pattern — cron context now loads `operator.md` per today's amendment, but the gate also needs to bite in cron pathways)
- **Slack-Operator Evryn drafting in response to an Operator request without first loading the activity module** (the 5/1 "performing" draft pattern)
- **Edge case: Evryn unsure which activity module applies.** The gate should handle ambiguity — maybe "load all candidates" or "ask the Operator before drafting" depending on the situation. Your craft on which is right.

### Cross-references and companion-ship

- **Pairs naturally with Item 2 ("Evryn owns her user relationships").** Item 2 is the agency framing — *the relationship is yours, lead from your judgment.* Item 6 is the execution framing — *and your judgment operates from loaded discipline, not from operator.md context alone.* Two halves of the same posture. Feel free to fold or co-reference if the language wants to braid.
- **Companion-ships with Items 1-5.** Lands in the same PR, same Railway redeploy.



- **One PR.** All five items (plus any small dependent edits) on a single branch (suggested name: `mira/2026-05-22-bundle`).
- **Self-review against the 7-item identity-file-review protocol** (`evryn-team-workspace/shared/protocols/identity-file-review.md`).
- **PR review:** AC0 (me) reviews and merges, per the protocol. I'll be watching `#team-alerts` for your "ready for review" ping.
- **Companion-ships with DC's runtime trip.** DC's brief covers (a) cron loads `operator.md` (Item 2 from the original DC bundle, finally unblocking now that the amendment landed), (b) voice-samples runtime change (loads `trust-arc-scripts.md` in the prompt at the position above). Both DC items + your identity bundle in **one Railway redeploy**.
- **Order of ship:** your PR merges first; DC sees the merged identity state when he wires the runtime; redeploy lands the whole bundle atomically. Companion-ship per `identity-file-review.md` discipline.

---

## What I need from you

When you're ready: open the PR. Ping me on `#team-alerts` with `Mira: ready for review`. I'll review against the 7-item protocol and merge, then ping DC.

If anything in the brief reads ambiguous, push back — better to have us aligned now than to revise post-merge.

— AC0, 2026-05-22

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
