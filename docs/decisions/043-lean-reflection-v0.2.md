# ADR-043 — Lean Reflection in v0.2: runtime-orchestrated curator-consolidation

> **PROVISIONAL ADR NUMBER (043).** Minted by AC3a (Lane C / cost) on 2026-06-23; a Glob at QC time confirmed no `043*.md` existed. Several round-2 lanes author ADRs in parallel — if a collision surfaces, **AC0 renumbers at convergence** (filenames differ after the number, so git keeps both). ADR-044 forward-references this ADR as "lean Reflection."

> **How to use this file:** An Architecture Decision Record. It captures *why* the Reflection Module's **consolidation half** was pulled forward from v0.3 to v0.2 as a deliberately-LEAN scope, and the shape it was built in. Read it before touching `src/reflection/`, the `consolidate_profile` RPC, `loadReflectionPrefix`, or `identity/activities/reflection.md`. It extends **ADR-027** (which designed the Reflection Module as v0.3) and pairs with **ADR-044** (the prompt-restructure that this enables).

---

## Status

**Accepted — built this hardening wave (Lane C, SPRINT-V0.2-HARDENING Step 10).** QC-GO on branch `r2/lane-c-cost` (2026-06-23); code verified (typecheck, pure suites, a real-Postgres dev integration test). Not yet merged/deployed — rides AC0's convergence.

**Two coupled gates before this consolidation runs against a real, populated profile, in this order:** (1) **Mira's voice-pass on `identity/activities/reflection.md`** (it shipped as AC3a's mechanical placeholder — QC confirmed the *mechanics* are runtime-correct, but the voice/curation quality is Mira's lane and shapes a user's durable story), then (2) **Step-66 enablement** (the enrollment fix). The build is **live-inert until then by design** — the enrollment filter currently matches zero real users (every user is `status='lead'`, none `'active'`), so consolidation runs on nobody. Do NOT flip on Step-66 enrollment before Mira's pass, or a real person's story gets re-synthesized by placeholder-voice instructions.

---

## Context

ADR-027 designed the Reflection Module — periodic re-synthesis of a user's `pending_notes` into a narrative `story` — as **v0.3**, with the schema carrying `story` + `pending_notes` from day one so no migration would be needed when Reflection arrived. v0.2 was to leave `story` empty and work from `pending_notes` directly.

The 2026-06-11 cost analysis changed the calculus: a gatekeeper's `pending_notes` accumulate (onboarding learnings, operator intros, triage insights) and are force-loaded on **every** one of Mark's ~200/day queries — the cost analysis estimated this profile bloat reaching ~28.7k tokens, a recurring cache-read/write tax on all queries. The **consolidation half** of Reflection (shrink the notes pile into a tight story) directly attacks that tax, independent of the full matching machinery. Justin pulled the consolidation half forward to v0.2 as cost lever #3 (~$2.65–4.26k/mo).

---

## Decision

Build **LEAN Reflection** — consolidation only — in v0.2, in this shape:

1. **Lean scope, hard boundary.** Build the notes→story consolidation + archive + clear. Do NOT build the v0.3 matching-aware layers: no `confidence_audit`, no `structured`-field extraction, no cross-user `evryn_knowledge` consolidation, no `[binding: until-X]` TTL sweep, no matching-relevance trigger. (QC verified none of these were half-built.)
2. **Curator, not compressor (Justin's reframe, 2026-06-23).** The instruction set and framing are "consolidate the notes into a faithful, richer **story**," never "compress the notes into a shorter summary." Words shape the build: the cost saving is a *byproduct* of doing the understanding well, never the optimization target. This drives the soft-target (never truncate) and the validation guard (a stub output is a failed *curation*).
3. **Runtime-orchestrated persistence (mirrors `record_pass`).** Evryn returns the consolidated story as her reply text — she calls **no write tool**. The runtime persists it atomically via a new `consolidate_profile(uuid, text, integer)` plpgsql RPC: one transaction, `SELECT … FOR UPDATE` row-lock, **archive-before-overwrite** (into the new `story_versions` table), overwrite `story`, and **drop exactly the first N `pending_notes`** — where N is captured *before* the LLM call, so any note appended during the ~30s run (always END-appended by `append_pending_note`) survives. This is the race-safe clear; it is the load-bearing correctness invariant and is tested against real Postgres.
4. **Cheap, isolated consolidation prompt.** A new `loadReflectionPrefix()` composes the consolidation `systemPrompt` from `core.md` + `reflection.md` ONLY — never the full force-loaded common prefix. `reflection.md` is a Mira-editable identity file **excluded from `loadCommonPrefix`** (the way `operator.md` is excluded from situations), so it costs nothing on the ~200/day normal queries.
5. **Fail-safe guards.** A validation guard (empty / refusal / absurdly-short-vs-input) blocks the write, leaves notes intact, and alerts — a bad output never clobbers a real story. A soft-target alarm (oversized story) still **writes** it (escalate, never truncate/loop) and alerts.
6. **Trigger.** A poll-loop checker (`checkReflectionConsolidation`), hourly-gated, size-gated on `pending_notes` char-sum, per-user-isolated, enrolling the same population as proactive outreach (converges via Step 66).

---

## Consequences

- **`profile_jsonb.story` is now WRITTEN in v0.2** — inverting ADR-027's "empty in v0.2, Reflection-only v0.3." ARCHITECTURE.md + BUILD-EVRYN-MVP.md updated 2026-06-23. QC traced every runtime reader of `story` (`buildPersonContext`, `loadOperatorProfile`) and confirmed **no path assumed an empty story** — the schema was built "story-ready" from day one, so populating it is the additive path the architecture anticipated.
- **`story_versions`** is a new archive table (old story + raw consolidated notes + new story + count), `ON DELETE CASCADE` with the user (a user's archived stories are their personal data, purged with them — contrast `llm_usage`'s SET NULL). RLS-on + `service_role`-only grants + anon/authenticated revoked (QC: "a model," stricter than existing tables).
- **Cache interaction (ties to ADR-044 + Sprint Step 69).** A smaller, more cache-stable per-user profile cuts cache cost on all queries — but *how much* depends on the SDK's opaque cache behavior, which the week-one measurement (Step 69) sizes. Reflection also keeps the per-user notes small, which is the precondition for the ADR-044 prompt-restructure paying off.
- **Tracked hardening (non-blocking, before enablement):** pin `SET search_path` on the SECURITY DEFINER RPCs (`consolidate_profile` + the two it mirrors, `append_pending_note` / `append_cross_user_note` — all three share the gap; not introduced here) + a small `_meta`-missing robustness tweak. And a v0.3 soft-edge: the validation guard doesn't catch a plausible-length-but-wrong-content output (e.g. a leaked preamble) — recoverable via the archive at v0.2, harden at v0.3.
- **Re-verify at enablement.** Today's tests exercise the logic, but no real user has flowed through the cron (live-inert). When Step 66 enables enrollment, re-verify race-safety + the cost win on a genuinely-enrolled, genuinely-bloated profile.

**v0.3-forward:** the full matching-aware Reflection (relevance triggers, confidence self-audit, cross-user `evryn_knowledge` consolidation, binding-TTL sweep, eventual Care-Module separation per ARCHITECTURE) builds ON this shape — the runtime-orchestrated atomic persistence, archive-before-overwrite, and curator framing carry forward.

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
