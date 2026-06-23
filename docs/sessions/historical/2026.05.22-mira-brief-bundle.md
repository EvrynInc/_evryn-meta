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

---

## Appendage — 2026-05-26 (Wave 2 follow-ups, not in flight today)

**Context:** AC1 produced two v0.2 runtime fixes today (see his working doc at `_evryn-meta/docs/working/cron-architecture-and-cross-loading.md`):

- **Bug A — Ghost messages.** `notify_slack` will start logging every cron-Evryn ping to the Operator into the `messages` database table with proper user-scoping. Tool signature gains an optional `about_user_id` parameter.
- **Bug B — Cross-loading.** User-facing Evryn pathways (`processForward`, `processDirect`, cron) will auto-load Operator-about-user scoped messages into the prompt with a clear runtime label and a "context for judgment, not material to echo" framing.

Justin's call (2026-05-26): these ship as a **second** Railway redeploy ("Wave 2") *after Wave 1 lands and smoke-tests clean*, *before* the resumed Phase 2 integration test. They are NOT in today's Wave 1 (your current 6+3-item PR + DC's currently-briefed runtime). The full Phase 2 integration test runs once, against the final state — after both waves have shipped and smoke-tested clean.

The two small identity additions below pair with those two runtime fixes. Companion-shipped together as a coherent Wave 2 unit (your identity beats + AC1's runtime fixes). **Pick this up in your next session, after today's Wave 1 PR merges and smoke-tests clean** — Wave 2 fires before the resumed Phase 2 integration test, not after.

### Beat 1 — `notify_slack` scoping cue (small addition to `operator.md`)

**Why:** Bug A's fix gives `notify_slack` an optional `about_user_id` parameter so the resulting database row gets scoped to the right user. Evryn needs to know when to pass it: when she's pinging the Operator about a specific user (proactive check-in, escalation, observation about a particular person), pass `about_user_id`. When pinging the Operator about meta-stuff (system status, cross-cutting question), omit it.

**Where:** A short beat in `evryn-backend/identity/situations/operator.md`, somewhere near existing tool-usage discipline beats or wherever `notify_slack` is currently referenced.

**Voice/shape:** Your craft. Same register as your existing tool-usage discipline.

### Beat 2 — Operator-Evryn-about-user conversations are judgment context, not transcripts to echo

**Why:** Bug B's fix auto-loads Operator-Evryn conversations *about* a user into user-facing Evryn's prompt when she's working with that user. The runtime label on the auto-loaded section gives her a floor framing ("These are messages between you and Justin about this user. Be aware of what's been discussed; exercise discretion about what to surface."). But that runtime label is just the floor — identity-layer reinforcement is needed to make the discretion durable across pathways and over time.

**The discipline:** Operator-Evryn conversations about a user are *context for Evryn's judgment*, not transcripts to echo back to the user. Some of that content carries Evryn's frank operator-facing reasoning (*"I'm uncertain about Mark's framing of X"; "Justin flagged that Mark might be burning out"*) — material that shouldn't reach Mark even though it's *about* Mark. When in doubt about whether to surface something from those conversations, treat it as background context unless the user explicitly invites it.

**Where:** Your craft call. The behavior fires in user pathways (when the auto-load happens) but the principle is about how Evryn relates to Operator-conversation content generally, so it could live in `core.md` (universal posture) or `operator.md` (operator-pathway-specific discipline). Either way is defensible.

**Voice/shape:** Your craft.

### Coordination for Wave 2

- These beats land in a **follow-up PR** (separate branch from `mira/2026-05-22-bundle`, which will be merged by then). Suggested branch name: `mira/2026-05-XX-wave2-pairs` (pick the date you push).
- AC1's runtime fixes (Bug A + Bug B) ship in DC's Wave 2 trip. Your identity beats + DC's runtime fixes = atomic Railway redeploy.
- AC0 reviews per the 7-item identity-file protocol, same as Wave 1.
- AC0 will coordinate the merge timing so your identity layer lands ahead of DC's runtime read (same companion-ship pattern as Wave 1).

— AC0, 2026-05-26

---

## Appendage — 2026-05-26 — Soren refinements for Wave 2 tier-4 vocabulary work

**From:** Soren (CTO)
**To:** Mira
**Context:** Reviewing ADR-033 (with AC1's lifecycle axis addition) for runtime alignment as part of Wave 2. Four refinements I'd want landed in the ADR before Status flips to Accepted — surfacing them to you because they shape the vocabulary discipline for your Wave 2 paired identity beats. None changes the tier-4 framing of Item 6 (anchor-loading) or any Wave 1 content. All apply going forward.

Full sign-off response at `_evryn-meta/docs/sessions/2026-05-26-soren-wave-2-review-response.md` — what's below is just the Mira-facing extract.

### 1. Tier-inflation guardrail, extended to lifecycle

The most important refinement. Once tier 4 exists, the temptation is to label everything tier 4. With the lifecycle axis added, the worse failure is labeling something as *permanent* when it should be transitional — locks v0.2 hedges in as architectural commitments.

**Default for a new rule: tier 2-3, lifecycle transitional.** Escalations require explicit justification:
- Tier 4 (mandatory) needs: *"suggestion-plus-judgment isn't enough because…"*
- Permanent needs: *"no future capability gain relaxes this because…"*
- Tier 5 + permanent is the rarest combination and warrants the most explicit justification.

For your tier-4 vocabulary work: this means *resist the gravitational pull toward tier 4*. If a rule reads like "should usually" or "you really should," tier 3 (extremely-strong suggestion) is right. Tier 4 is for rules where Evryn can't reach the correct behavior from a strong suggestion plus her judgment — anchor-loading is a clean example (skipping has high cost, but Evryn might rationalize skipping if it's framed as a suggestion).

### 2. Publisher framing — which tier 4-5 rules are durable architectural commitments

(From Justin's 2026-05-26 framing.) At Publisher maturity, many "inherently identity-only" tier-5 rules become *structural*. The pattern: `[tier: 5, lifecycle: transitional, gating-event: Publisher lands]`. Identity carries the weight today; Publisher catches it structurally at maturity.

Justin's two-response-mode Publisher model:
- **Tier 5 violations:** hard refusal with operator-auth path. *"Sorry, can't do it — change it, or I'll need to get auth from Justin."*
- **Tier 4 violations:** *"Are you really sure?"* challenge with reasoning preserved.
- Tier 1-3 doesn't reach the Publisher.

**What this means for your labeling, today:** vocabulary doesn't change. You still write tier-4 rules as *"must,"* *"not optional,"* with stakes named. But knowing which rules will eventually be Publisher-enforceable informs the threat model — outbound-affecting tier 4-5 rules will be backstopped by Publisher; internal-process tier 4 rules (like anchor-loading) won't be. The internal-process rules are the ones identity *permanently* carries.

The lifecycle tag captures this. An outbound-facing tier-5 rule today might tag `[tier: 5, lifecycle: transitional, gating-event: Publisher lands]`; an internal-process tier-4 rule like anchor-loading tags `[tier: 4, lifecycle: permanent]`.

### 3. Three-surface distinction — supportive for your work

The runtime has three surfaces — system prompts (composed from identity), trigger prompts (the `query()` argument), and tool descriptions. **Tier 4-5 lives in identity (your surface), not in trigger prompts or tool descriptions.** This is supportive of your work, not changing it — it confirms identity is the right home for the weight.

Implication: if you ever see tier-4-shaped language showing up in a trigger prompt or tool description (e.g., *"you MUST load the anchors before drafting"*), that's a smell — the right home is identity. The audit pass will sweep for this; you don't need to act on it preemptively.

### 4. Conflict-resolution explicit naming

When two rules at different tiers conflict in a specific moment, higher tier wins. Implicit in the tier names, but you might want identity-layer vocabulary that makes this readable to Evryn — something she can pattern-match to when she's holding two pulls at once.

Example shape (yours to refine): *"When two of these pulls run against each other, lean toward the one with higher stakes. The cost of getting the lower-stakes thing slightly wrong is much less than getting the higher-stakes thing wrong."*

Not blocking; your craft on whether to include and how to phrase.

---

## Two specific identity-territory beats attached to Wave 2 runtime work

Both flagged by AC1 in the Bug A + Bug B specs:

### Beat A (companion to Bug A — `notify_slack` ghost-message fix)

A small addition to `operator.md` instructing Evryn: when she calls `notify_slack` about a specific user, pass `about_user_id` to scope the log. Cost of skipping = lost audit trail (real but not catastrophic). My read: tier 3 (extremely-strong suggestion) by default — Evryn's judgment about when a ping is "about a specific user" vs. meta-operator is the load-bearing call, and a strong suggestion plus her judgment should reach the right behavior. Your call on tier and craft.

### Beat B (companion to Bug B — cross-loading auto-load)

A short addition (your call between `core.md` and `operator.md` — both defensible) naming the discipline:

> *"Operator-Evryn conversations about a user are context for your judgment, not transcripts for echo. When in doubt about whether to surface something to the user, treat it as background unless explicitly invited."*

My read: this could land at tier 4 (mandatory) given the leak-vector stakes — surfacing operator-coordination state to a user is real harm. But the structural filter (`scope_user_id`) catches pre-amendment messages, and the amendment's write-discipline (Item 4 in this brief) catches new writes. Tier 3 plus the structural backstops may be sufficient. Your call.

---

— Soren, 2026-05-26

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
