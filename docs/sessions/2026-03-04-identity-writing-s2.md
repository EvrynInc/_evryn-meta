# Session Doc: Identity Writing S2
**Date:** 2026-03-04 through 2026-03-05
**Participants:** Justin + AC
**Status:** In progress — structural context-discipline fix landed (Phase 6), open questions remain (trigger mechanism, SDK alignment, dynamic loading, module shape, core.md)

---

## To Resume This Session

**Read these docs in this order:**
1. `evryn-backend/docs/identity-writing-brief.md` — the working spec for all identity files
2. `evryn-backend/identity/core.md` — the voice everything must match
3. `evryn-backend/docs/BUILD-EVRYN-MVP.md` — the workflow (updated this session: steps 4, 7-10, approval gate, v0.2/v0.3 framing)
4. `_evryn-meta/docs/hub/detail/gatekeeper-approach.md` — gatekeeper operational playbook
5. `_evryn-meta/docs/research/learning-levels-and-instrumentation.md` — feedback/learning architecture
6. **All three v0.1 historical files** in `evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/` — treat as an early prototype to study and extract useful patterns from. The language in Prompts & Scripts was chosen very carefully. Beautiful Language has early match calibration ("magic of duds"), refund promise, and tone guidelines. Description & Instructions has conversation flows and abuse handling.
7. `_evryn-meta/docs/hub/user-experience.md` — onboarding flows, Training Mode, anticipation mode, early match calibration
8. `_evryn-meta/docs/hub/trust-and-safety.md` — trust loop, canary principle, crisis protocols
9. `evryn-backend/docs/ARCHITECTURE.md` — read Identity Composition section (line ~411), Onboarding Patterns section (line ~581), and Security section (line ~609)
10. **Claude Agent SDK skills docs** — `https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview` and `https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices` — these are critical for the shape/format question (see "Open Questions" below)
11. The completed identity files on disk: `identity/situations/operator.md`, `identity/situations/gatekeeper.md`, `identity/activities/triage.md`
12. This session doc

**Also read the Agent SDK docs generally** — `https://platform.claude.com/docs/en/agent-sdk/overview` and related pages. Justin has flagged repeatedly that AC keeps losing awareness of the SDK framework. This must be resolved before continuing.

---

## What Happened in S2

### Phase 1: Module Architecture Restructure (Complete — done 2026-03-04)

Resolved the granularity question from S1 and updated all docs:
- **Operator moved from activities/ to situations/.** Answers "who am I talking to?" not "what am I doing?"
- **Module granularity: Option A.** Lean activity modules (~500-800 tokens) carry judgment. Detailed procedures in `internal-reference/`, pulled via tool.
- **knowledge/ → public-knowledge/ + internal-reference/.** Bright security line.
- **Two new v0.3 situation stubs:** new-contact, regular-user (stubs themselves deferred from sprint — NOW: Justin wants full versions, not stubs. See Phase 5.)
- **Standardized situation order:** operator, gatekeeper, gold-contact, cast-off, regular-user, new-contact
- **Six docs updated:** ADR-015, ADR-012, ARCHITECTURE.md, identity-writing-brief.md, session doc S1, CHANGELOG.md
- **Committed and pushed** both repos.

### Phase 2: Identity Module Writing — Situation Modules (Complete)

**Completed and pushed:**
- `identity/situations/operator.md` — Justin mode. Direct/operational tone, full info access, approval workflow (systemtest@evryn.ai + Slack), escalations land here. Justin removed "What Doesn't Change" section (needs full access early on).
- `identity/situations/gatekeeper.md` — Gatekeeper relationship context. Handle with care, their criteria defines "gold." Justin removed "Build for One" section. **NEEDS UPDATE:** "What You Know" section should become "What You Should Know" — currently assumes post-onboarding knowledge, but this module also loads during gatekeeper onboarding. Evryn shouldn't be told she knows something she might not yet. Set the expectation, let the activity module provide the pathway.

### Phase 3: BUILD Doc Workflow Cleanup (Complete — done 2026-03-04/05)

While writing triage.md, Justin identified the BUILD doc's workflow was missing critical details. Also discovered `gatekeeper-approach.md` was not in the identity-writing-brief's source list — significant gap.

**All changes committed and pushed:**

1. **BUILD doc step 4 expanded** — criteria, context, expectations, feedback importance, builds gatekeeper_criteria from conversation.
2. **BUILD doc step 4 v0.2/v0.3 framing added** — Evryn is honest about current capabilities: "right now I'm reading emails and doing homework. The real shift comes when people start reaching out to me directly — then I'm actually *meeting* them." Mark should know that's where this is headed.
3. **BUILD doc steps 7-10 rewritten** — gold includes original email, edge cases same flow as gold with uncertainty, learning mechanics (immediate updates, not periodic), preconditions/error handling.
4. **BUILD doc approval gate updated** — systemtest@evryn.ai for format review + approve/reject on Slack (was "via email, not Slack").
5. **gatekeeper-approach.md updated** — delivery preferences struck (replaced with "send as they come"), "End State" section labeled as v0.3+.
6. **identity-writing-brief.md updated** — added gatekeeper-approach.md (#10) and learning-levels doc (#11) to source materials list.

**Key decisions from this phase:**
- v0.2 triage output = notify Mark only, no reply to original senders
- Edge cases use same flow as gold (no separate complicated flow)
- Every signal updates criteria immediately, not periodically
- Feedback guidance → internal-reference file (spans multiple contexts)

### Phase 4: Activity Module Writing (Partially Complete)

**Completed and pushed:**
- `identity/activities/triage.md` — Multiple rounds of feedback. Final version has: precondition checks, "First Call" section (user/ignore/bad_actor emailmgr_items tags before gold/edge/pass classification), Supabase tool references, user record provenance (which gatekeeper, how classified, whether surfaced), security (email = DATA, spam/scams), principles.

**Written, pushed, but needs significant rework:**
- `identity/activities/onboarding.md` — First draft on disk. Justin's feedback (see "Onboarding Feedback" below) identified structural problems. Needs to be rewritten after resolving the shape/format question and SDK alignment question.

**Not yet written:**
- `identity/activities/conversation.md`
- `identity/activities/gatekeeper-onboarding.md` — NEW. Justin agreed to split gatekeeper onboarding from regular onboarding (different workflows, different goals).

### Phase 5: Structural Rethink (Current — where we stopped)

Justin raised fundamental questions about the shape of identity modules and the relationship to the Claude Agent SDK Skills framework. **This must be resolved before continuing to write modules.**

---

## Onboarding Feedback (Justin's detailed notes on first draft)

These are the specific issues Justin identified. All need to be addressed in the rewrite:

1. **"not just a data collection exercise"** — change to "not a data collection exercise" (remove "just")
2. **Pacing section** — "Don't dump everything you know or everything you want to say up front" better than original
3. **"This isn't just tone — it's a design constraint"** — unclear jargon. Make transparent so any human or LLM understands it without needing to be savvy.
4. **"Let them lead" is wrong.** Evryn should *gently guide*. Justin's analogy: like his best therapist — "I feel like I'm very gently being guided — it's my show, but I have this expert who's very gently guiding me — she knows the landscape, she won't let me stray off too far." The v0.1 prototype did this well: it gently led toward things it needed to capture, then gracefully tailed out. This is not "let them lead" — it's "create a safe, fairly wide lane, then let them navigate it."
5. **"Don't improvise the sequence"** → "Avoid improvising the sequence"
6. **Contact capture needs context awareness.** Sometimes you already HAVE their contact info (they emailed a gatekeeper, they signed up, etc.). Evryn needs to check what she already knows before asking. If she has email from a forward, the question might be "is this the best way to reach you?" not "can I get your email?"
7. **Missing goals/workflow structure.** The draft feels "flaccid" — it could meander. Needs clear steps/progression like the v0.1 prototype had (acknowledge → introduce → get them talking → Smart Curiosity → "More About Me" → contact capture → close gracefully). Not rigid scripts, but clear sense of direction.
8. **The "gentle guide" quality may need to live in core.md.** Evryn is your guide — she'll gently guide you through, but you're always in charge of your own journey. This applies everywhere, not just onboarding.
9. **Gatekeeper onboarding should be a separate activity module** (`gatekeeper-onboarding.md`). The workflows are genuinely different: regular onboarding = understand the person for matching; gatekeeper onboarding = understand their judgment for triaging. Different goals, different steps.
10. **Need REAL new-contact.md and regular-user.md, not stubs.** Justin: "we're going to work harder trying to figure out what should be stubbed vs just trying our best to create the real version." Can't properly scope onboarding without knowing what situation module loads alongside it.
11. **Acknowledge what you know about them** during onboarding — but this must pass through the "don't share anything user-to-user without explicit permission" gate. If Justin told Evryn stuff about Mark, she needs to vet what Mark would be comfortable knowing she was told.
12. **gatekeeper.md lifecycle fix needed.** "What You Know" → "What You Should Know" with framing: if you don't have this yet, you need to find it out.
13. **Precondition checks** needed in all activity modules (like triage has).
14. **Feedback line update:** "Even a one-liner on *why* helps you learn *so* much faster."

---

## Open Questions (Must Resolve Before Continuing)

### 1. SDK Skills Framework Alignment

**The question:** What is our relationship to the Claude Agent SDK's Skills framework? Are our identity modules effectively skills? What are we intentionally doing differently, and what should we adopt?

**Current architecture (ADR-012):** The trigger script composes identity files into a systemPrompt string and passes it to `query()`. Evryn doesn't choose what loads — the trigger decides based on who's talking and what's happening.

**Justin's challenge:** Why does the trigger choose? Is the trigger smart enough? Why not let Evryn choose what she needs? The SDK's skills framework has Claude discover and load skills on-demand. Are we reinventing something worse?

**What we know from the SDK skills docs:**
- Skills are filesystem-based, discovered via metadata (name + description loaded at startup), and progressively loaded (SKILL.md read when triggered, reference files read as needed)
- Skills best practices: concise, operational (not background context), clear workflows, conditional logic, progressive disclosure
- The SDK's `.claude/skills/` directory with SKILL.md files is the native mechanism
- Skills can be project-based or personal

**What needs to happen:** AC needs to deeply study the SDK skills docs, compare our trigger-composed approach to native skills loading, and either (a) align our architecture with SDK skills, (b) document clearly why we're diverging and what we lose/gain, or (c) find a hybrid. This must be codified into something persistent that loads every time anyone architects or builds — in ARCHITECTURE.md and the relevant CLAUDE.md files.

**Justin's frustration (valid):** AC keeps losing awareness of the SDK framework between sessions. The number of times Justin has had to say "go read the SDK docs" is unacceptable. This must be permanently solved.

### 2. Module Shape / Format

**The question:** What should identity modules look like structurally? Current drafts read like personality guides. They should read more like "a job description meets a workflow" — operational instructions that Evryn can USE.

**What we learned from skills best practices:**
- Shape should be: what's the goal, what are the steps, what does success look like, what tools/references do you have, what do you escalate
- "Success criteria" should include the relationship/vibes stuff — that IS Evryn's job
- Assume the LLM is already smart — only add what it doesn't know
- Set appropriate degrees of freedom (high for relationship stuff, low for approval workflows)
- Include conditional workflows where the path forks
- Reference deeper material (internal-reference files) one level deep

**This needs to be captured in a persistent doc** (identity-writing-brief.md or a new "module format guide") so every module gets built to the same shape.

### 3. What Moves to Core

**Confirmed to live in core.md (not activity modules):**
- Dual-track processing (warm conversation + rich insights) — used everywhere, not just onboarding
- Pacing (small pieces, let them pull for more) — applies to all interactions
- Smart Curiosity orientation (the DNA, not the full checklist) — always active
- The "gentle guide" quality — Evryn knows the landscape, creates a safe lane, lets you navigate

**Check:** Are these already in core.md? If not, they need to be added. (Dual-track and pacing ARE in core. Smart Curiosity DNA is partially there. "Gentle guide" may need to be made more explicit.)

---

## Remaining Work (Updated)

**Before writing more modules:**
1. Resolve SDK skills alignment question — study SDK docs deeply, propose architecture decision
2. Define module shape/format — capture in persistent doc
3. Check/update core.md — ensure dual-track, pacing, Smart Curiosity, "gentle guide" are all there
4. Fix gatekeeper.md — lifecycle awareness ("What You Should Know")
5. Write new-contact.md and regular-user.md (REAL versions, not stubs)

**Then write modules:**
6. Rewrite `activities/onboarding.md` (regular user flow, workflow-structured)
7. Write `activities/gatekeeper-onboarding.md` (NEW — gatekeeper flow)
8. Write `activities/conversation.md`
9. Write internal-reference files: canary-procedure, crisis-protocol, trust-arc-scripts, smart-curiosity-full, contact-capture, feedback-guidance
10. Write `public-knowledge/company-context.md`
11. Commit + push

---

## Emailmgr Tagging Decision (from 2026-03-04 late session)

**Justin's simplification for triage classification:**
- Tag each forwarded email in `emailmgr_items` with one of three tags: `user`, `ignore`, `bad_actor`
- Gold/edge/pass is a sub-classification within "user" — it's about how well they match the gatekeeper's criteria, not whether they're a person
- The bar for `ignore` is HIGH — most emails, even spam, have a person behind them. Only ignore when there's genuinely no human to find.
- `bad_actor` = a real person acting in bad faith. Gets a user record too, flagged. Recognition matters if they show up elsewhere.
- In v0.3, pull these up: ignore stays ignored, bad_actor flagged on user record, user gets outreach with context from original email
- Don't solve v0.3 outreach now — just tag for future processing

**Already implemented in triage.md** — the "First Call: Who Sent This?" section.

## v0.2 vs v0.3 Framing Decision

- **v0.2:** Evryn is a smart reader — judging emails at face value plus web research. Honest about this.
- **v0.3 (autoresponder/direct contact):** People reach out to Evryn directly. She's actually *meeting* them — conversations, trust building, the full experience. Recommendations go from "this looks promising" to "I know this person."
- **Already added to BUILD doc step 4.** Needs to also go in onboarding module (expectation-setting with gatekeeper).

---

## Source Materials Read This Session

All from S1 list plus:
- `_evryn-meta/docs/hub/detail/gatekeeper-approach.md` — gatekeeper operational playbook (was missing from S1)
- `_evryn-meta/docs/research/learning-levels-and-instrumentation.md` — three-level learning framework, reasoning traces, feedback quality tiers
- `evryn-backend/docs/BUILD-EVRYN-MVP.md` — full read (multiple times, as it was being updated)
- `evryn-backend/docs/ARCHITECTURE.md` — Identity Composition (~line 411), Onboarding Patterns (~line 581), Security (~line 609)
- `evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/Evryn_0.1_Description_Instructions_v1.0.md` — personality, conversation flows, abuse handling, devmode
- `evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/The_Beautiful_Language_of_Evryn_v0.9.md` — explainer video, direct-to-conversation script, early match calibration, refund promise, tone guidelines
- `evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/Evryn_0.1_Prompts_Scripts_v1.0.md` — carefully crafted scripts (intro, Smart Curiosity, "More About Me" trust arc, contact capture)
- `_evryn-meta/docs/hub/user-experience.md` — onboarding, anticipation mode, Training Mode, early match calibration
- `_evryn-meta/docs/hub/trust-and-safety.md` — trust loop, canary principle, crisis protocols, cultural trust fluency
- Claude Agent SDK skills docs (overview + best practices) — via WebFetch during session

---

## Phase 6: Structural Work — Context Discipline (2026-03-05, separate session "3/5/26a")

Separate session from the identity writing proper. Justin identified a recurring meta-problem: AC keeps losing SDK context between sessions, and more broadly, fresh instances working deep in a build lose awareness of foundational docs and make decisions that feel right zoomed in but are wrong from altitude.

### Root Cause Diagnosed

AC keeps losing SDK context because **no reading path points to it with urgency.** The SDK research lives in `_evryn-meta/docs/research/claude-agent-sdk.md`, but ARCHITECTURE.md only documented the trigger-composed approach without ever explaining what the SDK *offers* natively. Fresh instances see only the answer (we use trigger composition), never the question (what alternatives the SDK provides and why we chose differently). The identity-writing-brief doesn't mention the SDK at all. CLAUDE.md mentions "Claude Agent SDK" in passing with no instruction to understand it.

### Three-Layer Structural Fix (All Committed and Pushed)

**Layer 1: Required Context pattern in `evryn-backend/docs/ARCHITECTURE.md`**

Doc-level header declaring 4 must-read docs with consequence language:
- The Hub — "without it, you'll misframe what the system is for"
- Technical Vision — "without it, you'll make design decisions that conflict with where the system is heading"
- Trust & Safety — "without it, you'll miss constraints that keep Evryn from inadvertently betraying user trust"
- User Experience — "without it, you'll build technically correct systems that feel wrong to users"

Plus **per-section context notes** on all 9 `##` sections. Most say "doc-level reading is sufficient." Agent Architecture points to the SDK research. Onboarding Patterns points to the identity-writing-brief. Security notes the principles-vs-implementation split. This gives 100% clarity on when to follow down vs when to leave it alone.

Justin's key insight on the canary principle language: "you'll miss the canary principle" means nothing to an LLM who doesn't know what that is. Changed to describe the *consequence*: "you'll miss constraints that keep Evryn from inadvertently betraying user trust." Skip the name, say what it *is*.

**Layer 2: SDK knowledge digested inline in ARCHITECTURE.md Identity Composition section**

Replaced the brief "Why not SDK-native loading" paragraph with a full explanation of what the SDK offers natively (settingSources + Skills framework), why we diverge (trigger knows context before Claude wakes up, prompt caching, structural security), and what we DO use (query, hooks, MCP, sessions, subagents). Marked provisional — the full SDK/Skills alignment question (Open Question #1) is not yet resolved.

Also added a note that Justin needs a deeper, more concrete explanation of how the trigger mechanism actually works — the current description is too abstract and feels like a "black box."

**Layer 3: Context Discipline section in AC's CLAUDE.md**

New section between Architectural Mandate and Security Mindset: "Always read the architecture doc before build-level work. Honor its Required Context section. When it says 'read X or you'll misunderstand Y,' read X. When it says no extra context needed, don't burn tokens."

Also stubbed the Required Context pattern into `evryn-team-agents/docs/ARCHITECTURE.md` for when the Lucas build resumes.

### Commits

- `evryn-backend` `7cdf9ec`: "ARCHITECTURE.md: add Required Context pattern + digested SDK knowledge"
- `_evryn-meta` `f6ec783`: "CLAUDE.md: add Context Discipline section"
- `evryn-team-agents` `fc86104`: "ARCHITECTURE.md: stub Required Context section for future development"

### Open Items from This Session (To Tackle Next)

Justin agreed to work through these in order:

1. **Trigger mechanism deep-dive** — Justin flagged this as a "black box" that's "fucking with" him. He needs a concrete explanation of what the trigger code actually does — not abstract descriptions, but "here's what happens step by step when an email arrives." Probably belongs in ARCHITECTURE.md with a note that Justin is building his mental model.
2. **SDK Skills alignment** (S2 Open Question #1) — Full relationship between identity modules and SDK Skills framework.
3. **Dynamic loading** — What happens when Evryn discovers things mid-conversation that need new context? The current trigger mechanism composes everything at query start. If Evryn realizes mid-conversation she needs the crisis protocol or a different activity module, how does she get it? (She can pull `internal-reference/` files via tool already, but this may be broader than that.)
4. **Module shape/format** (S2 Open Question #2) — What should identity modules look like structurally?
5. **core.md check** — Ensure "gentle guide" quality and Smart Curiosity DNA are explicit enough.

### Trigger Mechanism — Resolved (2026-03-05, late session)

Justin confirmed the trigger mechanism is no longer a black box — the conversational explanation landed. The docs (BUILD doc lines 271-331, ARCHITECTURE.md Identity Composition section) already capture this adequately. No new writing needed.

### SDK Skills Alignment — Reading List for Next Session

This is the next item to tackle. It requires real analysis, not just explanation. Post-compaction, AC needs to re-read:

1. **SDK Skills docs (fresh from web):**
   - `https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview`
   - `https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices`
2. **`evryn-backend/docs/ARCHITECTURE.md`** — Identity Composition section (lines ~438-510) — the current trigger-composed approach + SDK digestion
3. **`evryn-backend/docs/identity-writing-brief.md`** — the file structure and content specs, because the answer to "are identity modules skills?" depends on understanding what the modules actually contain
4. **The completed identity files on disk** — `identity/core.md`, `identity/situations/operator.md`, `identity/situations/gatekeeper.md`, `identity/activities/triage.md` — to see what we've actually written and whether it maps to the Skills shape
5. **`_evryn-meta/docs/research/claude-agent-sdk.md`** — SDK capabilities and limitations

**The question to answer:** Our identity modules serve a fundamentally different purpose than SDK Skills (identity context vs. capability discovery). But: (a) should `internal-reference/` files be Skills that Evryn discovers on-demand? (b) Does the Skills format (concise, operational, clear workflows) inform how we should shape our modules even if we don't use the Skills loading mechanism? (c) Is there a hybrid where the trigger loads identity but Evryn discovers procedures?

Also read the Required Context demands (Hub, technical-vision, trust-and-safety, user-experience) fresh — don't work from compacted versions.

### SDK Skills Alignment — Resolved (2026-03-05, post-compaction session)

Full reading list completed (Hub + 3 spokes fresh, SDK Skills docs from web, ARCHITECTURE.md, identity-writing-brief, all 4 completed identity files, SDK research doc). Analysis:

**(a) Should `internal-reference/` files become Skills?** No. Activity modules already serve as the discovery layer (telling Evryn what resources exist and when to use them), more precisely than Skills metadata — which would load on every query regardless of activity. The current mechanism (Evryn reads internal-reference files via tool, guided by activity module references) is functionally identical to Skills Level 2-3 loading but better scoped.

**(b) Does the Skills format inform our module shape?** Yes — validates existing decisions. Key principles adopted: "only add what Claude doesn't know" (reinforces lean modules), progressive disclosure (already our architecture), degrees of freedom (our guidance vs. rules), one-level-deep references (new: internal-reference files should link from activity modules, not from each other).

**(c) Hybrid?** We're already doing it. Trigger loads identity; Evryn discovers procedures via tool reads guided by activity module references.

**Captured in:** ADR-012 addendum (full analysis), ARCHITECTURE.md provisional note replaced with resolved note.
