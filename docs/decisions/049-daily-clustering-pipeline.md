# ADR-049: Daily-Clustering Pipeline (forwards queue + twice-daily batch)

**Status:** Accepted (Justin, 2026-07-07) — build in progress (SPRINT-V0.2-HARDENING Step 58, "Clustering", cost lane ②).
**Date:** 2026-07-07.
**Owners:** AC2 (cost lane) + Justin. Build spec: `_evryn-meta/docs/sessions/historical/2026.07/2026.07.07-ac2-clustering-build-spec.md` (archived — shipped `v0.2.7`).
**Related:** ADR-020 amendment (Haiku Bouncer, ①) · ADR-018 (emailmgr_items lifecycle — this adds a status) · ADR-041 (M1 silent-death — this adds a heartbeat + a park-target seam) · ADR-046 (gatekeeper-address resolution) · SPRINT Step 57 "Runtime Bookkeeping" (③, the next change, which this composes with).

---

## Context

Evryn triages a forwarded email in real time, the instant it arrives. At the pilot gatekeeper's scale (~200 forwards/day — an onslaught of auto-forwarded bulk), that is ~200 separate Opus triage runs a day, each paying its own cold prompt-cache write. The cache-write cost dominates. The Haiku Bouncer (ADR-020 amendment, cost lane ①, shipped `v0.2.6` OFF) removes obvious no-fits *before* Opus runs; **Clustering** attacks the residual by changing *when* triage runs, so the surviving Opus calls run back-to-back and warm.

Two forces beyond cost shaped the design:
- **Customer service (Justin, 2026-07-06):** the onslaught is bulk auto-forwards (no personal note). The few emails the gatekeeper *hand-forwards with a personal note* are a different, tiny-volume animal — burying those in a twice-daily queue is bad service, and it would leave Evryn *blind* to a forward the gatekeeper just told her about mid-conversation.
- **Re-processing safety (Justin, 2026-07-06):** queuing on the "is-a-forward" signal makes a latent bug load-bearing — a gatekeeper *reply* that quotes a forwarded chain can be mis-classified as a new forward (fresh Message-ID → dedup misses it) → a phantom duplicate item, now landing silently in the queue.

## Decision

**Hold forwards in a queue and drain them in twice-daily batches; keep direct conversation real-time.** Three coupled parts:

1. **Queue + batch.** A new `emailmgr_items.status` value **`queued`** ("captured, awaiting its batch — not triaged"). A forward lands `queued` instead of triaging on arrival; a batch drains the queue oldest-first, sequentially, driving each item through the **existing** `runForwardTriage` (so the Bouncer screen inside it, and Runtime Bookkeeping's future rewrite of it, both compose without Clustering changing). One package per batch to the gatekeeper. **Cadence: twice-daily, ~10am + ~4:30pm PT.** Gated by a three-value `CLUSTERING_MODE` env (`off` | `manual` | `scheduled`, **default `off`**) so it ships dormant (real-time, unchanged) and is flipped on before the gatekeeper goes live — mirroring the Bouncer's ships-off discipline. `manual` (drain only on an operator `cluster now` command) is the rollout step: hand-fire the first batches, watch them, then flip to `scheduled`.
   - **A distinct `queued` status (not reused `new`)** because `new` is the M1 crash-recovery park state; overloading it would collide the poll-loop's dedup-resume rule with "waiting for a batch."
   - **Restart-catch-up is the PRIMARY recovery** (drain leftover `queued` items immediately on restart); the scheduled cron is the *extra* failsafe. An interrupted batch affects only the *remaining* items — drafted items are safe, the in-flight item parks back to `queued` (M1 lossless). This required a park-target seam in M1's halt path (`processing → queued` for clustered items, vs `→ new` for real-time).
   - **A positive per-batch heartbeat** ("cluster ran at HH:MM — drained N, screened S, escalated E, drafted K"), because decoupling ingest from triage means the existing post-ingest heartbeat stays green while a batch silently fails.

2. **Personal-note pathway.** A forward carrying a personal note (`forwardInfo.forwardingNote`) routes the note to Evryn **in real time** (she's never blind to a hand-forward), while the triage item still `queued`s. Evryn judges from the note: *urgent* → pull the item forward and triage now; *not* → she leaves it queued but **always considers replying** (good customer service — the voice is Mira's). A bare forward → straight to the queue.

3. **Reply-aware forward detection.** A message that is clearly the gatekeeper *replying to Evryn* (a `Re:` subject, or an existing Evryn↔sender thread) is never classified as a forward, even if it quotes a forwarded chain — closing the phantom-duplicate hole that Clustering would otherwise make worse.

## Consequences

- **Cost:** the surviving Opus triage runs cluster warm (the first batch query pays the cold write, the rest read it) — the primary v0.2 cost win alongside the Bouncer. Realized only once the gatekeeper is live and `CLUSTERING_MODE` is flipped past `off`.
- **Gold latency up to ~half a day** (twice-daily) — accepted at pilot scale (the gatekeeper often doesn't self-triage for days). A same-day escape hatch for bare forwards is explicitly *not* built; the note-pathway is the urgency channel.
- **Lifecycle:** `queued` is added to the ADR-018 status set (a widened CHECK constraint; migration, RLS unchanged). A *status*, not a verdict.
- **M1 (ADR-041):** a new park target (`queued`) and a new positive batch-heartbeat — both preserve the lossless-halt invariant; flagged for architecture-doc absorption.
- **Composition:** Clustering treats `runForwardTriage` as a black box, so it composes with the Bouncer (①, screen inside it) and Runtime Bookkeeping (③, which rewrites its internals). Order ①→②→③ holds with no rework.
- **Rejected alternatives:** the Anthropic Batch API (architecture misalignment — a rebuild off the Agent SDK; clustering captures most of the savings with near-zero build — see `evryn-team-workspace/shared/projects/product/research/2026.06.12 cost-levers-consolidated.md` §6a); a once-daily cadence (superseded by twice-daily, Justin 2026-06-30); an urgent-keyword/Haiku escape hatch (superseded by the note-pathway's judgment).

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
