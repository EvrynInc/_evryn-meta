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

## How the bundle ships

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
