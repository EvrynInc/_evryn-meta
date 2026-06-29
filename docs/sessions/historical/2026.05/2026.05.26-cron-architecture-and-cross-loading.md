# Working Doc — Cron Architecture & Cross-Loading (Item 1)

> **Author:** AC1
> **Date:** 2026-05-26
> **Status:** Working — Justin has made the v0.2 + v0.3 architectural calls; this doc captures them, names the ghost-message fix spec, and notes what remains open. Companion-shipped with [Item 2 / Proposal 08](../../../evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26%2008-capability-vs-constraint.md).
> **Predecessors:** Original brief in `2026-05-01-ac1-brief-phase2-architectural-adrs.md` (with 5/22 append). Canonical Phase 2 run `2026-04-30-canonical-phase2-run.md`. [ADR-030 + 2026-05-22 amendment](../decisions/030-slack-threads-as-operator-scope.md). Today's chat conversation with Justin in this session.

---

## What Phase 2 surfaced (recap)

The 2026-04-30 canonical Phase 2 run produced three concrete cron seams:

- **Seam A — Cron didn't load `operator.md` when pinging the Operator.** Cron-Evryn fired without Operator-discipline (no scope-thread awareness, no verify-and-lock posture, no respect for in-flight Operator commitments). Closed by [ADR-030 amendment 2026-05-22](../decisions/030-slack-threads-as-operator-scope.md) via the *audience-over-trigger* principle. Runtime change is in DC's 5/22 brief, queued for Monday's Railway redeploy.

- **Seam B — Cron-initiated outbound about a user doesn't scope to that user, doesn't log to `messages`.** `notify_slack` posts to Slack but never calls `createMessage`. The result: Operator-Evryn pings on Mark (4 times across the 5/4–5/22 arc) were ghosts — visible to Justin in Slack, structurally invisible to every future Evryn-instance. **Still open. v0.2 fix specced below.**

- **Seam C — Cadence drifts on deploy.** Pre-amendment cron fired "24h since last invocation" → drifted with deploy times. **Closed** by DC's 5/2 trip (per-user fixed-time gating, `last_proactive_check_at`, `PROACTIVE_CHECK_HOUR_PT=7`).

A fourth seam surfaced in today's conversation with Justin:

- **Seam D — Operator-about-user content is invisible to user-facing Evryn.** When Mark sends an email and the user pathway fires, `getRecentMessages(mark.id)` returns messages where Mark is sender or recipient — but Operator-scoped messages *about* Mark (where Mark is neither sender nor recipient, but `scope_user_id = mark.id`) are excluded. User-facing Evryn is amnesic about her Operator-conversation life regarding Mark. **Justin called the v0.2 and v0.3 fixes today** — specced below.

---

## The deeper "identity per pathway" question — answered

The original brief asked: *should any pathway ever load fundamentally different identity, or should every pathway load a consistent baseline + situational add-ons?*

The ADR-030 amendment's **audience-over-trigger** principle is the answer:

- **Consistent baseline:** `core.md` loads in every pathway. (And per Item 2 / Proposal 08, `trust-arc-scripts.md` joins the baseline as the v0.2 80/20 voice-anchor fix.)
- **Situational add-ons gated by audience:** `operator.md` + Operator's profile + `_meta.discipline_notice` load when Evryn's audience is the Operator — *both* `handleGeneralMessage` and cron pathways, *not* `processForward`/`processDirect` (where the audience is the user).

The amendment closed the question with a structural answer that generalizes. New pathways (web app, voice, additional cron families) inherit the same rule: audience determines what loads. No new ADR is needed unless a future pathway breaks the audience-can-be-deterministically-detected assumption (e.g., a pathway that could be Operator-audience or user-audience depending on runtime conditions — none today).

This doc does not re-derive the answer. It assumes it.

---

## v0.2 fix specs

### Spec 1 — `notify_slack` always logs to `messages`

**Why:** Today's `notify_slack` is a ghost — Justin sees the message; future Evryn-instances cannot. Four cron pings to Justin over the 5/4–5/22 arc disappeared this way. Empirically biting.

**Justin's call (today):** Always log. No clean distinction between "operational poke" and "Evryn-as-conversational-actor" — they're all conversational acts.

**Implementation:**

1. Extend [`notify_slack` tool definition](../../../evryn-backend/src/triage/classify.ts#L258) to accept an optional `about_user_id` parameter:
   ```ts
   tool(
     "notify_slack",
     "Send a notification to the Operator on Slack. ... When the ping is *about a specific user* (proactive check-in, cron observation, escalation about a particular person), pass their `about_user_id` so the message logs with proper scope. Omit for meta-operator pings (system status, cross-cutting questions).",
     { message: z.string(), about_user_id: z.string().uuid().optional() },
     async (args) => { ... }
   );
   ```

2. Inside the tool handler, capture the resulting Slack `ts` from `chat.postMessage` (currently `notifySlack` doesn't return it) and call `createMessage`:
   ```ts
   const slackTs = await notifySlack(args.message); // updated to return ts
   await createMessage({
     sender_id: EVRYN_USER_ID,
     recipient_id: OPERATOR_USER_ID,
     source: "slack",
     content_raw: args.message,
     thread_id: slackTs,
     scope_user_id: args.about_user_id ?? null,
     metadata: { auto_recorded: true, origin: "notify_slack" },
   });
   ```

3. The notification becomes the *parent* of a new Slack thread. Justin replying in-thread hits `handleGeneralMessage` with `threadTs = slackTs`, and existing `getThreadScope` logic inherits the scope cleanly. **No new code path needed in `handleGeneralMessage`** — the ADR-030 mechanics already handle inherited-scope replies.

4. Operator-discipline (per ADR-030 amendment, shipping in DC's 5/22 trip) will be loaded when cron-Evryn calls `notify_slack` — so she'll have the awareness to pass `about_user_id` correctly. Worth a beat in `operator.md` (Mira-territory addition, small): *"when pinging the Operator about a specific user, pass `about_user_id` to scope the log."*

**Architectural framing for ARCHITECTURE.md:** This is the principle *"all Evryn-Operator outbound logs to `messages` with proper scope."* The fact that one tool was bypassing this was an inadvertent gap, not a deliberate design. The spec closes the gap; no architectural shift required.

### Spec 2 — User pathways auto-load Operator-about-user messages

**Why:** Today, when Mark wakes Evryn up via email, `getRecentMessages(mark.id)` only returns Mark-as-sender-or-recipient messages. Operator-about-Mark scoped messages (sender = Operator/Evryn, recipient = Evryn/Operator, scope_user_id = mark.id) are excluded. Evryn-with-Mark has no awareness of conversations between her and Justin about Mark. That's a genuine architectural gap — even if Evryn is careful about what she shares with Mark, she should *know* what she's discussed with Justin about him.

**Justin's call (today):** Auto-load Operator-about-user messages into user-facing Evryn's prompt, clearly labeled. v0.2 is just Mark and all-gated, so loading the full payload is acceptable; the volume can't kill us yet.

**Implementation:**

1. Add a new function to `src/db/messages.ts`:
   ```ts
   export async function getOperatorScopedMessages(
     userId: string,
     limit: number = 50
   ): Promise<MessageRecord[]> {
     const db = getDb();
     const { data, error } = await db
       .from("messages")
       .select("*")
       .eq("source", "slack")
       .eq("scope_user_id", userId)
       .order("created_at", { ascending: true })
       .limit(limit);
     if (error) throw new Error(`getOperatorScopedMessages failed: ${error.message}`);
     return (data ?? []) as MessageRecord[];
   }
   ```

2. In user pathways (`processForward`, `processDirect`, cron), augment the prompt with a clearly-labeled section *after* person context, *before* user conversation history:
   ```
   --- Operator-Evryn conversations about this user ---
   [These are messages between you and Justin (the Operator) ABOUT this user.
   Mark is not part of these conversations. Be aware of what's been discussed
   so you have context, but exercise discretion about what to share back with
   Mark — much of this is operator-facing reasoning, not for direct echo.]

   {operator_scoped_messages_formatted}
   --- End Operator-Evryn conversations ---
   ```

3. v0.2 sizing: at one gatekeeper and the volume to date (Mark has 18 cron-fired pending_notes + a handful of Slack-Operator threads), the full payload is ~50 messages tops. Acceptable. Position before user conversation history so the cached-prefix discipline holds (Operator-about-user changes more slowly than user-with-Evryn conversation).

4. **Privacy considerations:** Even though all Mark-scoped Operator content is *about Mark*, some of it may include Evryn's frank operator-facing reasoning ("I'm uncertain about Mark's framing of X"; "Justin flagged that Mark might be burning out"). The "be aware, exercise discretion" instruction in the labeled section is the v0.2 floor. Identity-file reinforcement (Mira-territory addition to `core.md` or `operator.md`) could harden: *"Operator-Evryn conversations about a user are context for your judgment, not transcripts for echo. When in doubt about whether to surface something to the user, treat it as background unless explicitly invited."*

**This is a v0.2 fix for a v0.2 reality.** At scale it can't hold — see Spec 3.

### Why we're doing both fixes now

Spec 1 (logging) and Spec 2 (loading) are linked. Spec 1 *captures* the Operator-about-user content into the messages table; Spec 2 *surfaces* it into user-facing Evryn's context. Without Spec 1, Spec 2 has nothing new to load (the cron pings are still ghosts). Without Spec 2, Spec 1 captures content that no future Evryn-instance reads. Both required.

---

## v0.3+ direction — what scales beyond v0.2

**Justin's call (today):** v0.3+ likely solves this through Reflection and a dedicated section of story or meta. Alternatives exist; the recommendation points that direction.

### The problem at v0.3 scale

Auto-loading the full Operator-about-user payload doesn't survive scale:
- Multi-gatekeeper means more users, more Operator threads per user.
- Cast-off outreach + matching adds more Operator-about-user messages per user.
- Years of conversation history means even a single user accumulates thousands of Operator-scoped messages.
- Most are noise; some matter enormously. "Load last N messages" loses the important ones; "load everything" blows context windows and costs.

The v0.2 auto-load is a 80/20 patch on a real architectural question: **how does Evryn-with-user efficiently access the durable substance of Operator-Evryn discussion about that user, without loading the full raw history?**

### Design space

1. **(Recommended) Reflection distills into the user's story.** Reflection processes Operator-scoped messages about a user the same way it processes other inputs (cross_user_notes, pending_notes) — producing sanitized insights that fold into the user's `profile_jsonb.story` as natural narrative. When user-facing Evryn loads the user's profile, the operator-distilled context comes along inside the story. *Example sanitized insight:* *"Justin and I have discussed Mark's responsiveness in recent weeks — context suggests bandwidth, not disengagement. Hold steady; reach out if silence extends past two more weeks."* No parallel data structure; the same Reflection → story pipeline that handles everything else.
   - **Pros:** Single narrative; no parallel system; uses already-planned Reflection infrastructure; natural pattern-match with ADR-027 Decision 3 (cross-user notes routed through Reflection into story).
   - **Cons:** Reflection is the gating dependency (v0.3+). Until it ships, the v0.2 auto-load remains.
   - **Edge case to consider:** the operator-distilled insights need to be marked in some way (provenance) so Evryn knows their origin — *"this came from your conversations with Justin, not from this user directly."* Likely as inline tags during the Reflection-write or as a sub-section the story can have when the narrative warrants.

2. **Reflection distills into a dedicated `_meta.operator_distilled` field.** Parallel structured field on `profile_jsonb`. Loads alongside story.
   - **Pros:** Easy to find, easy to update, clean separation of "user-direct narrative" vs. "operator-mediated context."
   - **Cons:** Parallel system. ADR-027 simplified the schema explicitly to avoid parallel notes/story tracks; this re-introduces the problem in a new shape.
   - **When this beats Option 1:** if the operator-mediated context proves *qualitatively different* from the user-direct story in ways that resist coherent narrative integration. Not visible today.

3. **Cached summary recomputed periodically.** A lighter pipeline than Reflection: a background job that summarizes recent Operator-about-user messages into a brief, refresh every N hours.
   - **Pros:** Lower compute cost than Reflection; no Reflection dependency.
   - **Cons:** Two pipelines (Reflection + summary) doing similar work. Stale by design (the refresh window is the staleness ceiling). No story continuity — each summary is a snapshot.

4. **Compute-at-load.** Every time user-facing Evryn wakes for a user, compute a brief summary from recent Operator-about-user messages.
   - **Pros:** Always fresh; no async pipeline.
   - **Cons:** Per-load latency + cost. At scale, computing this on every user-facing invocation is expensive.

### Recommendation

Option 1. The ADR-027 simplification principle ("everything flows through pending_notes → story via Reflection") generalizes cleanly to this case. Operator-scoped messages are another input class to Reflection, alongside pending_notes and cross_user_notes. The story carries the consolidated understanding regardless of source. Provenance is handled inline (similar to ADR-027 §"How cross-user feedback flows into the story" — sanitized insight, source identification stripped, *narrative judgment* about what matters).

### Why this isn't "build for one, structure for many" failure

The v0.2 auto-load (Spec 2) is acceptable specifically because Reflection isn't ready yet *and* v0.2 is one gatekeeper / one user with operator-mediated context. The auto-load is a bridge, not a destination. When Reflection ships, the auto-load gets replaced with story-loading (since the story now carries the distilled context). At that point: remove `getOperatorScopedMessages` from user pathways; the same surface is in the story.

Marking the auto-load explicitly as transitional (using the lifecycle axis from [Proposal 08](../../../evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26%2008-capability-vs-constraint.md)) keeps it from getting locked in as permanent.

---

## Cross-instance memory binding — what's already in motion

The original brief's third sub-question — *how do promises bind across instances?* — is partly addressed by Mira's `[binding: until-X]` structural upgrade (Item 3 in the 5/22 bundle). The 18-note arc on Mark proved pending_notes already work as cross-instance memory *informally*; the tagged-binding mechanism upgrades that to structural enforcement with three clearing paths (gating event, TTL via Reflection sweep — see the PROPOSED EDIT in BUILD doc v0.3 Staging table, Mira's 5/22 brief Item 3).

No new architectural design needed here. The work is in Mira's bundle.

---

## Open implementation questions (for DC, when these specs are picked up)

1. **Where in the prompt does the "Operator conversations about this user" section position?** My proposal: after person context, before user conversation history. Worth verifying against actual prompt structure when DC implements.

2. **What's the limit on `getOperatorScopedMessages`?** I suggested 50 to match `getRecentMessages` default. May need adjustment based on per-user volume.

3. **Should the section also load on the Slack-Operator pathway (`handleGeneralMessage`)?** Probably not — that pathway already loads scoped-thread history via `getThreadHistory`. Cross-thread retrospective ("show me my recent Mark threads") is on-demand via tool today (per ADR-030 v0.3 Operator Interface notes), not auto-loaded. The auto-load is specifically the *user-pathway gap* — Operator-pathway already has this.

4. **Format of the label.** I suggested explicit "--- Operator-Evryn conversations about this user ---" framing. Mira may want to refine the language for Evryn-the-actor (voice anchor, not boilerplate).

5. **Marking auto-load as transitional in DC's implementation.** When DC ships Spec 2, the runtime should ideally carry an inline comment naming the spec as transitional — replaced by story-loading when Reflection ships. Operational hygiene; not blocking.

---

## What's NOT in this doc

- **Detailed Reflection pipeline for Operator-scoped messages.** That's a v0.3 BUILD doc concern. This doc gives the direction; the v0.3 BUILD doc gives the implementation.
- **A new ADR.** I considered it for Spec 1 (notify_slack logging), but the architectural commitment is simple and uncontroversial (logging closes an inadvertent gap, doesn't change a principle). PROPOSED EDITs in ARCHITECTURE.md are sufficient.
- **The deeper question on identity per pathway** — closed by ADR-030 amendment via audience-over-trigger. Named here; not re-derived.
- **Cross-instance memory binding** — covered by Mira's 5/22 bundle Item 3 (binding-TTL). Named here; not re-designed.
