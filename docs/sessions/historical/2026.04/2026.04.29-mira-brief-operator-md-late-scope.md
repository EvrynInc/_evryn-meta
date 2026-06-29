# Brief for Mira — operator.md updates for ADR-031 (late-scope recovery + ongoing scope re-evaluation)

**From:** AC, 2026-04-29
**For:** Mira
**Concerns:** `evryn-backend/identity/situations/operator.md`
**Reads:** [ADR-031](../decisions/031-late-scope-recovery.md) first (full design); then [ADR-030](../decisions/030-slack-threads-as-operator-scope.md) for context on the recovery patterns this extends; then this brief for what lands in identity-file language.

---

## Context

Today's v0.2 deploy + smoke-test (DC's reply at `evryn-backend/docs/dc-to-ac.md`, 2026-04-29) surfaced two coupled findings about how `operator.md`'s scope-determination guidance plays out in practice:

1. **Scope determination is currently framed as a one-shot at thread start.** The empirical failure mode is **mid-thread drift** — Evryn correctly judged a thread as meta on turn 1, then the conversation drifted into user-substantive territory across turns 5-8 without her re-evaluating. Her own self-audit captured this cleanly: *"My judgment call was defensible at one point and then quietly stopped being defensible — and I didn't re-evaluate."*

2. **A third recovery pattern emerged.** ADR-030 names mid-thread bleed and wrong-scope recovery; what's missing is **late-scope recovery** — *"this conversation drifted from meta to user-substantive across multiple turns or threads, and I should have locked scope earlier."* Within-thread is already covered by the existing backfill in `handleGeneralMessage`. Cross-thread is the gap. ADR-031 captures the architectural decision and DC will land the runtime tooling (`rescope_messages` MCP tool); your job is the identity-layer side.

These two findings are coupled: the re-evaluation beat is the conceptual frame (*"I should be re-evaluating scope as the conversation evolves, not assuming my turn-1 call still holds"*); the recovery beat is what she does when she catches the drift late.

DC implementation of `rescope_messages` is on the sprint backlog and will land before the integration test re-runs at higher tempo. **Your `operator.md` pass and DC's tooling pass should ship together** — the identity layer needs the tool to recommend; the tool's UX is calmer with the identity-layer framing in place.

---

## What `operator.md` needs

Two coupled additions. Voice matches existing `operator.md` (operational/peer; you already chose to bring her full self in operator mode rather than damping warmth — that stays).

### 1. Reframe scope determination as ongoing, not one-shot

**Where:** in the existing "How the Channel Works" section, where the verify-and-lock beat lives.

**What changes:** the current language is shaped around the first turn ("when the Operator opens a new top-level thread, read the message and identify whether it's about a specific user"). That's still right for the first turn — but the empirical drift is *mid-thread*, after she's already made an initial scope call.

**The new beat (rough shape — your voice on the actual language):**

> *"Scope isn't a one-shot decision at thread start. As the conversation evolves, the substance can drift — what opened as a meta question about classifications drifts into a specific user's framework; what opened about Mark drifts into general calibration. Pause when you notice the drift. If a meta thread starts producing research about a specific user, direct assessment of a user's fit, or captures that should land on a profile, that's the moment to lock scope — not the next time you happen to think about it. The judgment call you made at turn 1 was defensible at the time; if it has quietly stopped being defensible, name it and re-evaluate."*

**Why this matters in her own voice (her closing turn from the smoke-test):**

> *"My judgment call was defensible at one point and then quietly stopped being defensible — and I didn't re-evaluate."*

You can lean on her own framing here. She's already named the failure mode in language you can ratify.

### 2. Add late-scope recovery as the third named recovery pattern

**Where:** in the existing Recovery Patterns section, alongside mid-thread bleed and wrong-scope recovery.

**The pattern:** the conversation drifted from meta to user-substantive across multiple turns *or threads*, and she should have locked scope earlier. The substantive content sits orphaned (NULL-scoped or wrongly-scoped) and would otherwise stay invisible to future user-context queries.

**The flow:**

1. **Flag.** *"I think we've drifted into Mark-substantive territory across the last several turns / across this thread and the earlier one. The content where I assessed Mark's gatekeeper fit / where I started capturing observations about him should rescope to Mark, not stay NULL."*
2. **Recommend specific message IDs / thread IDs.** Not "all NULL-scoped messages mentioning Mark" — that's over-eager. The discipline is the same as wrong-scope recovery: be specific about what gets touched.
3. **Operator confirms** (or corrects).
4. **Perform the rescope** via the new `rescope_messages({message_ids[], scope_user_id})` MCP tool (DC is landing it). The tool records audit metadata (`metadata.rescoped_from: null`, `metadata.rescoped_at: <ts>`, `metadata.rescoped_by: <operator_user_id>`) automatically — she doesn't have to do that herself.
5. **If the substance is too tangled to clean up surgically** (rare), nuke the affected messages and start a fresh user-scoped thread. Same fallback as wrong-scope recovery.

**Why this isn't panic-escalate:** same as the other recovery patterns. Calm, named, acted on. The failure mode is recoverable; the discipline is the recovery.

### Empirical motivating example (yours to use or not)

From today's smoke-test: Mark-substantive content (Evryn's gatekeeper-fit assessment) landed in thread `1777492994.283769` NULL-scoped because she didn't lock scope until a later thread (`1777493029.312859`). The orphaned content was recovered via raw `supabase_upsert` with one-shot operator coaching — but the recovery was ad-hoc; no first-class primitive supported the pattern. ADR-031 is the architectural response; your operator.md pass is the identity-layer half.

You don't have to reference the specific thread IDs in the file (probably better not to — they're transient operational state). The example exists to ground your understanding of what "late scope" looks like in practice.

---

## Open call: structure

**One file, three modes** (recovery patterns) **vs. nested structure?**

The existing operator.md handles meta + user-scoped modes inline (your one-file-two-modes call from the previous pass). The three recovery patterns (mid-thread bleed, wrong-scope, late-scope) are now coupled enough that flat-listing them might bloat the section.

Options:
- Keep flat — three named patterns, similar sentence-shape, in the existing Recovery Patterns section.
- Group — "in-thread recovery" (mid-thread bleed) vs. "thread-level recovery" (wrong-scope, late-scope). Less surgery on existing content.

Your call. The ADR is agnostic; both work.

---

## What lands when

DC implementation of `rescope_messages` is on the sprint backlog (`evryn-backend/docs/SPRINT-MARK-LIVE.md`). Your `operator.md` pass and DC's tooling should ship together — same coupling pattern as the previous ADR-030 + operator.md pair.

When you're done, the `operator.md` updates can land. DC's tooling is paired-but-decoupled (the tool can land first; identity-layer works against the existing raw `supabase_upsert` primitive in the meantime). Worst case: tooling ships, identity-layer hasn't, and Evryn does the right thing via raw upsert until the dedicated tool's tool description shows up.

When you ship, ping the AC ambassador (or commit + tell Justin) so the integration test re-runs against the new identity-layer language.

— AC (2026-04-29)
