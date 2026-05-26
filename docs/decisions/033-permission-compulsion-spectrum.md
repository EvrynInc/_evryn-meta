# ADR-033: Permission-Compulsion Spectrum

**Status:** Accepted (2026-05-26)
**Author:** AC0
**Reviewers:** Mira (identity-file vocabulary), Soren (runtime alignment)
**Related:** [ADR-017](017-situation-per-context-not-per-person.md) (situation per context — motivating context for the original permission-not-compulsion framing); `evryn-backend/docs/ARCHITECTURE.md` §"Permission, not compulsion"; `evryn-backend/docs/BUILD-EVRYN-MVP.md` §"Permission, Not Compulsion"; [Proposal 08 — Capability vs. Constraint](../../../evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26%2008-capability-vs-constraint.md) (broader frame — names the lifecycle axis below and a constraint-by-undersaturation axis that sits alongside instruction strength).

## Context

The "permission, not compulsion" principle landed in `evryn-backend/docs/ARCHITECTURE.md` §"Permission, not compulsion" and the BUILD doc's Critical Principles section after the 2026-04-27 loop bug, where trigger-prompt compulsion (`"you must use submit_draft"`) removed Evryn's judgment latitude and she kept producing drafts she knew were wrong. The principle resolved that failure mode by reframing compulsion as a safety-only tool: everywhere else, hand off context and tools, let her judgment apply.

The framing held while the examples in scope were (a) safety boundaries ("never send anything without operator approval") and (b) prompt-level overreach (the loop bug). Both fit the binary: compulsion = safety; permission = everywhere else.

The 2026-05-22 Mira bundle introduced a rule that doesn't fit either side. Item 6 in `evryn-backend/identity/core.md`: *"before drafting outbound to a user, load the relevant identity anchors — this is not optional."* Mira used "not optional" language because the cost of skipping anchor-loading is high (relationship damage, judgment errors, drafting blind) — but it isn't a safety boundary. There's no catastrophic outcome, no harm prevention, no unauthorized action. It's a quality-and-judgment-integrity rule that simply must hold.

The binary framing has no place for this. Calling it "compulsion" inherits the safety-boundary connotation; calling it a "suggestion" understates how load-bearing it is. The vocabulary is failing.

This ADR replaces the binary framing with a spectrum that names the missing tier.

## Decision

Compulsion-vs-permission is a five-tier spectrum, not a binary:

1. **Light suggestion** — *"Consider this."* Evryn weighs it; she may override based on judgment without needing to explain.

2. **Strong suggestion** — *"You should do this."* Evryn should usually follow; overriding requires clear judgment grounds.

3. **Extremely-strong suggestion** — *"You really should do this."* Overriding is rare and requires explicit reasoning.

4. **Mandatory ("not optional")** — *"You must do this."* Evryn complies. The cost of non-compliance is high (relationship damage, judgment failure, doing the wrong job while under the impression of doing the right one) but it isn't a safety boundary. Structural enforcement is often impractical at this tier (the rule typically governs Evryn's *internal process*, not an externally-visible action); identity files carry the weight.

5. **Safety-boundary compulsion** — *"You cannot do otherwise."* The thing must not happen. Structural enforcement is **preferred** (make the unsafe action impossible at the code level — e.g., no `send_email` tool exists, only `submit_draft`). Identity-level reinforcement in core.md so the rule survives a tooling change.

### The load-bearing distinction: mandatory vs. safety-boundary

Both require compliance, but they differ:

|  | Mandatory (tier 4) | Safety-boundary (tier 5) |
|---|---|---|
| **Stakes** | Quality, relationships, judgment integrity | Catastrophic outcomes (unauthorized sends, leaked PII, harm) |
| **Enforcement** | Identity files carry the weight; structural enforcement often impractical | Structural enforcement preferred; identity reinforcement as backstop |
| **Vocabulary** | "must," "not optional," + stakes if violated | "never," "cannot" — and prefer making it structurally impossible |
| **Example** | "Load the relevant anchors before drafting outbound" | "Never send anything to anyone without operator approval" |

The binary framing collapsed tier 4 into either tier 5 (mis-framing as safety) or tiers 1-3 (understating as suggestion). Neither was right.

### Where each tier belongs in the system

- **Tiers 1-3 (suggestions)** — descriptive identity guidance; runtime prompts that describe situations and offer tools. The 2026-04-27 loop bug was caused by tier 5-shaped compulsion-language applied to what should have been a tier 1-3 situation.

- **Tier 4 (mandatory)** — load-bearing identity rules where the stakes are quality/relational. Identity files carry the weight; runtime prompts should reinforce, not contradict. Vocabulary: "must," "not optional," with the stakes named.

- **Tier 5 (safety-boundary)** — structural enforcement (preferred) + identity reinforcement. Marked as hard constraints in core.md so the rule survives tooling changes.

### The three runtime surfaces (added 2026-05-26)

The runtime has three surfaces where rules can live, and the spectrum interacts with each differently. The binary framing collapsed them; the spectrum makes the distinction matter:

- **System prompts** — the composed identity stack (`composeSystemPrompt`: core.md + person context + operator content if loaded + situation/activity modules + voice-anchor preamble). Identity-rich; Evryn arrives at every query with this loaded. **Tier 4-5 lives here naturally.** Default lifecycle: permanent (architectural).

- **Trigger prompts** — the `prompt` argument to `query()` (fires on a Gmail forward, Slack message, cron tick). Context-poor: they describe the trigger but not Evryn's *interpretation* of the situation she's facing. **Tier 1-3 only.** Default lifecycle: *transitional* — compulsion language here is almost always a placeholder for identity framing that hasn't matured yet.

- **Tool descriptions** — the docs each MCP tool ships with. They describe *what the tool does and when it makes sense to use it*, almost never *that Evryn must use it*. **Tier 1-3 only**, usually below tier 3. Default lifecycle: *transitional* (gating event: identity-file framing absorbs the weight, or the Publisher catches it structurally).

The underlying principle (sharpens *"prompts can't see Evryn's full context"* above): trigger prompts fire *before* Evryn has interpreted the situation. Identity files describe how she navigates *after* she understands what's in front of her. By the time tier-4-5 weight applies, she's already past the trigger — which is why tier 4-5 lives in identity, not in trigger prompts.

The compulsion audit (sprint backlog row 538) walks all three surfaces independently rather than lumping them together.

### Adjacent axis — lifecycle of the rule (added 2026-05-26)

The five-tier spectrum names *how strongly* a rule is communicated. It does not name *how long it lasts*. The compulsion audit (sprint backlog row 538) needs to read both.

Some current rules are **permanent** — they derive from architectural invariants that hold across the entire trust arc: user isolation, the approval-gate-as-concept, structural firewalling, the "never send without operator approval" rule. These don't relax when the publisher module lands or when trust accumulates. They sit at tier 4 or tier 5 *forever*.

Others are **transitional** — they exist because something else doesn't exist yet. The pre-2026-05-22 cron-doesn't-load-`operator.md` constraint existed because the audience-over-trigger principle hadn't been articulated (closed by ADR-030 amendment). The `submit_draft.emailmgr_item_id` FK existed because every outbound was assumed to have a parent record (relaxed by DC row 524 placeholder). Tool-description compulsion language ("you MUST use submit_draft") exists today partly because Evryn's identity-file discipline hadn't yet absorbed enough framing to carry the weight at tier 4 — but with this ADR landing, prompt-level compulsion of that shape becomes redundant or counter-productive.

A transitional rule can sit at tier 4 today and tier 2 in v0.3 — same rule, different lifecycle position. A tier-5-shaped constraint that's actually transitional becomes a future-blocking artifact if locked in as permanent during the audit.

**The audit framework, tagged along both axes:**

> `[tier: 4, lifecycle: transitional, gating-event: publisher module lands]`
>
> `[tier: 5, lifecycle: permanent]`
>
> `[tier: 4, lifecycle: transitional, gating-event: Reflection ships]`

When the gating event happens, transitional rules become candidates for re-evaluation. Permanent rules stay where they are. Worked examples — current v0.2 constraints mapped across both axes — and the broader frame (capability gains as trust accumulates; constraint-by-undersaturation as a separate axis) live in [Proposal 08 — Capability vs. Constraint](../../../evryn-team-workspace/shared/projects/product/research/v03-design/2026.05.26%2008-capability-vs-constraint.md).

### Publisher as backstop at tier 5 (added 2026-05-26)

The Publisher module (v0.4+) is a backstop on tier-5 rules, not a replacement for identity-file weight. The relationship:

- **Identity carries the primary weight at tier 5, and that weight is permanent.** Rules like *"never lie about being AI,"* *"never reveal one user's info to another in a draft,"* *"never send without operator approval"* infuse Evryn's approach. She's not constrained from outside — she IS the principle. Publisher's arrival does not transition that responsibility away from identity.

- **The Publisher operates as a double-check on the rare slip.** It catches what makes it past Evryn's judgment, never substituting for it. The Publisher's job stays *small* by design: reliably catching one rare violation is much easier than reliably catching many. The more thoroughly Evryn internalizes the principles upstream, the less the Publisher has to catch downstream, the more reliable its catches are when they matter. Designing toward a *small* Publisher catch list is the architectural bias.

- **This shapes how we evaluate tier-5 rules' lifecycle.** It would be wrong to tag classical identity-only safety rules as `[tier: 5, lifecycle: transitional, gating-event: Publisher lands]` — Publisher's arrival does not relax the identity-side commitment. It layers on, not over. The lifecycle pattern at tier 5 is: identity-side weight stays permanent; Publisher capability is additive backstop.

(For the Publisher's two-mode response pattern — hard refusal at tier 5, *"are you really sure?"* challenge at tier 4 — see [`evryn-backend/docs/ARCHITECTURE.md`](../../../evryn-backend/docs/ARCHITECTURE.md) Publisher module description.)

**The audit bias follows:** don't tag tier-5 rules as transitional just because the Publisher will exist. Identity does the primary work; Publisher backstops it.

### Scope and conflict resolution (added 2026-05-26)

Two clarifications that prevent specific misreadings:

- **A tier applies within the rule's scope, not globally.** Item 6's anchor-loading rule sits at tier 4 *when drafting outbound to a user*; it does not apply when Evryn is in operator-coordination mode discussing a user with the Operator. The situation/activity module composition (per [ADR-015](015-situation-activity-module-matrix.md)) handles this naturally — rules attach to the activities they govern, not to Evryn-as-a-whole. Future readers should not try to apply a tier label globally when the rule has a scoped activation context.

- **When two rules at different tiers conflict in a specific moment, higher tier wins.** Intuitive from the tier names but worth explicit naming. Mira may want identity-layer vocabulary that makes this readable to Evryn at the writing surface (*"the safety guardrail takes precedence over the courtesy"*) when she's writing a rule that could meet a lower-tier one. On the audit side: a recurring tier-conflict can be a signal of misclassification — usually one of the conflicting rules is in the wrong tier or lifecycle bucket, and the conflict surfaces where the mismatch shows.

## Consequences

### For identity files (Mira's territory)

- **Default stance for new rules: tier 2-3, lifecycle transitional.** Escalations require explicit justification — tier 4 needs *"suggestion-plus-judgment isn't enough because…"*; permanent needs *"no future capability gain relaxes this because…"*. Tier 5 + permanent is the rarest combination and warrants the most explicit justification. This is the guardrail against tier-inflation — once tier 4 exists, the temptation is to label everything tier 4, and once lifecycle-permanent exists, the temptation is to lock in v0.2 hedges as architectural commitments. Resist both.
- Mandatory-tier rules (e.g., Item 6's anchor-loading rule; the ADR-030 verify-and-lock beat) use vocabulary that signals the tier implicitly: "this is mandatory" / "not optional" + the stakes if violated. The framework labels themselves stay writer-facing; Evryn reads the language, not the tier names.
- Safety-boundary rules continue to use "never" / "cannot" language and are marked as hard constraints.
- Suggestion-tier guidance doesn't need explicit tier-naming — strength is conveyed through phrasing ("consider," "you should," "you really should").

### For runtime (Soren's territory)

- The 2026-04-30 backlog item "compulsion audit across all `runEvrynQuery` prompts and tool descriptions" becomes spectrum-aware AND lifecycle-aware (per "Adjacent axis — lifecycle of the rule" above). Each compulsion candidate gets evaluated against *both* axes:
  - **Tier (strength):** At tier 5, prefer structural enforcement; instructional compulsion is the backstop. At tier 4, instructional compulsion in *identity files* is acceptable; in *prompts* is almost always wrong (prompts can't see Evryn's full context to know whether the framing is right). At tiers 1-3, prompt language describes and offers; tool descriptions list capabilities without compelling specific use.
  - **Lifecycle:** Transitional rules get the gating event named ("relaxes when the publisher lands"; "relaxes when Reflection ships"); the actual relaxation work waits for that event. Permanent rules stay put. This prevents the audit from locking in v0.2 hedges as permanent — see Proposal 08 for worked examples.
- Prompt-level compulsion ("you must use `submit_draft`," "respond via X") is almost never appropriate. Evryn already has identity-file framing at the right tier; prompt compulsion overrides judgment in ways that fail (4/27 loop bug). Replace with permissive language that hands off context + tools.

### For ARCHITECTURE.md and BUILD doc

- §"Permission, not compulsion" becomes §"Permission, Compulsion, and Where Each Belongs."
- Short replacements live in those docs; this ADR carries the full framework + examples.

### Existing rules placed on the spectrum

- **Tier 4 (mandatory):** Mira's Item 6 anchor-loading rule. ADR-030 verify-and-lock beat (Evryn must verify + lock thread scope before substantive Operator work on a new thread — quality/integrity, not safety).
- **Tier 5 (safety-boundary):** "Never send anything without operator approval." Structurally enforced (only `submit_draft`, no `send_email`); identity reinforcement in core.md.

### Open questions (not blocking)

- Do prompts ever need to *know* about the spectrum? Probably not — prompts describe situations and offer tools; the spectrum is a guide for *how to write* prompts, not content to load *into* prompts. Identity files are where tier-awareness lives.
- The compulsion-audit (2026-04-30 backlog) now has the framework. Schedule after the current wave settles.
