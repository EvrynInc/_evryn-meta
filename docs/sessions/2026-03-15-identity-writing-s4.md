# Identity Writing S4 — Remaining Work

**Status:** In progress. core.md done (v7), operator.md and gatekeeper.md reviewed and approved. Triage.md has gaps (schema questions + doc clarity). Onboarding.md first draft needs rewrite (14 feedback items). conversation.md and gatekeeper-onboarding.md not started.

**Previous sessions:** S1 wrote core.md (v5). S2 resolved architectural questions (ADRs 012-017), wrote situation modules (operator, gatekeeper) and triage activity module, drafted onboarding. S3 did core.md v6+v7 (Justin's full review), reviewed all existing identity files, identified triage.md gaps, updated sprint dates for snow day shift. Full history in `docs/sessions/historical/`.

---

## What Needs to Happen (Priority Order)

1. **Resolve triage schema questions** (5 questions below) — answers determine triage.md rewrite
2. **Rewrite triage.md** with precise instructions — after schema questions resolved
3. **Resolve module shape/format question** — triage.md is the template, capture in identity-writing-brief
4. **Write conversation.md** — DC Day 3 blocker (Tue March 17)
5. **Write gatekeeper-onboarding.md** — needed by Day 4 (Wed March 18) for integration test
6. **Review + rewrite onboarding.md** — 14 feedback items (see below)
7. **Write new-contact.md and regular-user.md** — real versions, not stubs

---

## Triage.md Gaps — Must Resolve Before Rewrite

AC walked through triage.md line by line with the lens: "Can Evryn follow this doc and know exactly what to do?" Found 8 gaps in two categories.

### Schema Questions (must resolve before doc can be precise)

These need Justin + AC to decide before rewriting triage.md. The answers affect what field names the doc references.

1. **Where does first-call classification live?** Triage.md says "Tag: `user` / `ignore` / `bad_actor`" — but there's no `tag` field in `emailmgr_items`. The schema has `categories[]` (an array). Is the first-call classification a new field? Does it go in `categories[]`? Something else?

2. **Where does gold/pass/edge classification live?** Same question. No explicit field for the triage classification result. Needs a specific field name.

3. **Where do Evryn's notes/impressions live in the user record?** Triage.md says "write your impressions" when creating a user record. Where? `profile_jsonb.notes`? `profile_jsonb.story`? A dedicated column? The BUILD doc mentions `profile_jsonb` carries "gatekeeper criteria, story, notes" but no specific key structure.

4. **Does Evryn create or update `emailmgr_items`?** Triage.md says "use your Supabase tools to create it." But ARCHITECTURE.md says the trigger stores forwards in emailmgr_items before Evryn wakes up. Which is it? (Most likely: trigger creates the entry, Evryn updates it with classification. But the doc needs to match reality.)

5. **Who creates the original sender's user record?** The trigger creates/finds the gatekeeper (forwarder). But the original sender extracted from the forward body — does the trigger create their record too, or does Evryn? Sprint doc Day 2 (line 134) says "User record creation" is a DC task, but that likely refers to the gatekeeper, not the extracted sender.

### Doc Clarity (fixable once schema questions are answered)

6. **No status update instructions anywhere.** Triage.md never tells Evryn to update `emailmgr_items.status` — not to `pending_approval` when drafting, not to `escalated` when escalating, not at any step. The whole status lifecycle is invisible in the identity doc.

7. **"Learn immediately" (line 75) is descriptive, not prescriptive.** Says "every signal updates your understanding" but doesn't tell Evryn what to DO. Should be: "After every approval, rejection, or piece of gatekeeper feedback, update your understanding of what 'gold' means for this gatekeeper. Refine `gatekeeper_criteria` if feedback reveals a pattern."

8. **No "check if user already exists" instruction.** The "For all people" section says "Create a record in the users table" — but what if the person already has a record from a previous forward? Evryn needs to check first.

---

## Module Shape / Format (Open Question)

**The question:** What should identity modules look like structurally? Current drafts read like personality guides. They should read more like "a job description meets a workflow" — operational instructions that Evryn can USE.

**What we learned from SDK skills best practices:**
- Shape should be: what's the goal, what are the steps, what does success look like, what tools/references do you have, what do you escalate
- "Success criteria" should include the relationship/vibes stuff — that IS Evryn's job
- Assume the LLM is already smart — only add what it doesn't know, and/or focus/prime its thinking
- Set appropriate degrees of freedom (high for relationship stuff, low for approval workflows)
- Include conditional workflows where the path forks
- Reference deeper material (internal-reference files) one level deep

**This needs to be captured in a persistent doc** (identity-writing-brief.md or a new "module format guide") so every module gets built to the same shape. Justin noted that triage.md likely serves as the template (preconditions, steps, decision points, outputs, security, principles) — confirm during review.

---

## Onboarding Feedback (Justin's notes on first draft — all must be addressed in rewrite)

Preserving Justin's language because the phrasing carries the intent:

1. **"not just a data collection exercise"** — change to "not a data collection exercise" (remove "just")
2. **Pacing section** — "Don't dump everything you know or everything you want to say up front" better than original
3. **"This isn't just tone — it's a design constraint"** — unclear jargon. Make transparent so any human or LLM understands it without needing to be savvy.
4. **"Let them lead" is wrong.** Evryn should *gently guide*. Justin's analogy: like his best therapist — "I feel like I'm very gently being guided — it's my show, but I have this expert who's very gently guiding me — she knows the landscape, she won't let me stray off too far." The v0.1 prototype did this well: it gently led toward things it needed to capture, then gracefully tailed out. This is not "let them lead" — it's "create a safe, fairly wide lane, then let them navigate it."
5. **"Don't improvise the sequence"** → "Avoid improvising the sequence"
6. **Contact capture needs context awareness.** Sometimes you already HAVE their contact info (they emailed a gatekeeper, they signed up, etc.). Evryn needs to check what she already knows before asking. If she has email from a forward, the question might be "is the best way to reach you?" not "can I get your email?"
7. **Missing goals/workflow structure.** The draft feels "flaccid" — it could meander. Needs clear steps/progression like the v0.1 prototype had (acknowledge → introduce → get them talking → Smart Curiosity → "More About Me" → contact capture → close gracefully). Not rigid scripts, but clear sense of direction.
8. **The "gentle guide" quality may need to live in core.md.** DONE — added to core.md v7.
9. **Gatekeeper onboarding should be a separate activity module** (`gatekeeper-onboarding.md`). The workflows are genuinely different: regular onboarding = understand the person for matching; gatekeeper onboarding = understand their judgment for triaging. Different goals, different steps.
10. **Need REAL new-contact.md and regular-user.md, not stubs.** Justin: "we're going to work harder trying to figure out what should be stubbed vs just trying our best to create the real version." Can't properly scope onboarding without knowing what situation module loads alongside it.
11. **Acknowledge what you know about them** during onboarding — but this must pass through the "don't share anything user-to-user without explicit permission" gate. If Justin told Evryn stuff about Mark, she needs to vet what Mark would be comfortable knowing she was told.
12. ~~**gatekeeper.md lifecycle fix needed.**~~ DONE. "What You Know" → "What You Should Know" with framing: if you don't have gatekeeper_criteria yet, you need to find it out via onboarding. Don't triage without it. Module on disk is current.
13. **Precondition checks** needed in all activity modules (like triage has).
14. **Feedback line update:** "Even a one-liner on *why* helps you learn *so* much faster."

---

## Modules to Write

**Before writing more modules:** Resolve triage schema questions (above) and module shape/format question.

| Module | Type | Status | Notes |
|--------|------|--------|-------|
| `activities/triage.md` | Activity | Rewrite needed | Gaps identified S3b — schema questions + doc clarity |
| `activities/conversation.md` | Activity | Not started | **DC Day 3 blocker (Tue March 17)** |
| `activities/gatekeeper-onboarding.md` | Activity | Not started | **Needed by Day 4 (Wed March 18)** for integration test |
| `activities/onboarding.md` | Activity | Rewrite needed | First draft on disk has 14 feedback items (see above) |
| `situations/new-contact.md` | Situation | Not started | Real version, not stub (feedback #10) |
| `situations/regular-user.md` | Situation | Not started | Real version, not stub (feedback #10) |
| `public-knowledge/company-context.md` | Knowledge | Not started | Public-safe "what is Evryn" |
| Internal reference files | Reference | Not started | canary-procedure, crisis-protocol, trust-arc-scripts, contact-capture, feedback-guidance, cultural-trust-fluency (v0.3+ — five culture group table from S1 offload list) |

---

## Key Context for Module Writing

- **Simplified trigger model (ADR-017).** The trigger does as little as possible: identify sender → Supabase lookup → compose systemPrompt (core.md + person context) → call `query()`. One hard-coded exception: Slack from Justin's verified user ID adds operator.md.
- **Activity modules are on-demand.** Evryn pulls them via tool when she recognizes the conversation calls for it. All forwards go to `emailmgr_items` for data capture, but forward ≠ triage — Evryn determines intent (triage vs. info-sharing vs. conversation). No activity is deterministic except operator (trigger-loaded for Justin's Slack).
- **Situation is per-context, not per-person.** Mark is "gatekeeper" when forwarding candidates, "regular user" when asking a personal question. The trigger passes person context (including JSONB roles); Evryn determines the appropriate situation from the conversation.
- **core.md is the activity hub.** Evryn discovers what she can do from core.md's "available modules" section. This is how she knows onboarding.md exists when Mark says "let's get started now."
- **Operator security: three layers.** Core doesn't mention operator.md. Tool blocks access to it. Only trigger code can load it. See ARCHITECTURE.md.
- **Security boundary: incoming message goes in `prompt`, never `systemPrompt`.** Email content is untrusted user input — putting it in systemPrompt would let prompt injection manipulate system-level instructions.
- **v0.2 vs v0.3 framing.** v0.2: Evryn is a smart reader (emails at face value + web research). v0.3: Evryn actually meets people (conversations, trust building). Onboarding should set this expectation with the gatekeeper.
- **Approval flow.** All outbound → justin@evryn.ai (email review for formatting) → Slack (approve/notes) → send with Bcc justin@evryn.ai. Slack-only approval because email sender identity can be spoofed; Slack user ID cannot.
- **Email address roles.** `evryn@evryn.ai` (Evryn's sender), `justin@evryn.ai` (Justin's draft review inbox), `systemtest@evryn.ai` (test recipient standing in for the fictional gatekeeper during testing).
- **emailmgr tagging (user/ignore/bad_actor)** is already implemented in triage.md's "First Call: Who Sent This?" section. Gold/edge/pass is a sub-classification within "user."
- **Escalation mechanics.** Evryn calls `notifySlack()` tool during `query()`, posts to Justin's Slack, does NOT respond to user. Justin handles in operator mode. Item marked `escalated` in emailmgr_items. Full proactive follow-up infrastructure is v0.3 (EVR-54).
- **Status lifecycle.** `emailmgr_items` status flow documented in BUILD doc: `new→processing→pending_approval→done`, with `escalated` and `error` branches. Startup recovery + stale item check in sprint Day 4 hardening.

---

## To Resume (Reading List for a Fresh Instance)

Read these in order. The first 7 are full reads (short, critical). The rest are selective reads with specific line ranges.

**Full reads — these set the frame:**
1. `_evryn-meta/docs/hub/roadmap.md` — the Hub. What Evryn is, the business model, the philosophy. Always first.
2. `_evryn-meta/docs/hub/trust-and-safety.md` — trust loop, canary principle, crisis protocols. Critical for tone.
3. `_evryn-meta/docs/hub/user-experience.md` — onboarding flows, Training Mode, anticipation mode. Critical for module writing.
4. `evryn-backend/docs/identity-writing-brief.md` — the working spec for all identity files. Extensively updated S3a.
5. `evryn-backend/identity/core.md` — the voice everything must match (v7 on disk, ~1,700 tokens).
6. This session doc (you're reading it).
7. All existing identity files — read to understand current state:
   - `evryn-backend/identity/situations/operator.md` — reviewed, approved
   - `evryn-backend/identity/situations/gatekeeper.md` — reviewed, approved
   - `evryn-backend/identity/activities/triage.md` — reviewed, has gaps (see above)
   - `evryn-backend/identity/activities/onboarding.md` — first draft, needs rewrite (14 feedback items above)

**Selective reads — system context (with specific line ranges):**

| # | File | Lines | What's there |
|---|------|-------|-------------|
| 8 | `evryn-backend/docs/ARCHITECTURE.md` | 1-50 | Overview |
| 8 | `evryn-backend/docs/ARCHITECTURE.md` | 430-527 | Identity Composition + trigger model |
| 8 | `evryn-backend/docs/ARCHITECTURE.md` | 528-548 | Proactive Behavior + Dual-Track |
| 8 | `evryn-backend/docs/ARCHITECTURE.md` | 608-624 | Onboarding Patterns |
| 9 | `_evryn-meta/docs/hub/user-experience.md` | 1-55, 59-68, 104-113 | Personality + Onboarding, Anticipation Mode, After Care + Early Match Calibration |
| 10 | `_evryn-meta/docs/hub/trust-and-safety.md` | 1-73, 87-97, 166-170 | Trust Loop through Cultural Trust Fluency, Canary Principle, Crisis Protocols |
| 11 | `evryn-backend/docs/BUILD-EVRYN-MVP.md` | 60-143 | Critical Principles + The Workflow + Justin-Approval Gate |
| 12 | `evryn-backend/docs/BUILD-EVRYN-MVP.md` | 450-480 | Supabase Schema + emailmgr_items Status Lifecycle |
| 13 | `evryn-backend/docs/SPRINT-MARK-LIVE.md` | Skim | Day-by-day timing, urgency context |

**Fresh reads when we reach specific modules (not loaded yet):**

| File | When needed |
|------|-------------|
| `_evryn-meta/docs/hub/detail/gatekeeper-approach.md` | Writing gatekeeper-onboarding.md |
| `_evryn-meta/docs/hub/detail/gatekeeper-flow.md` | Writing gatekeeper-onboarding.md |
| v0.1 historical files in `evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/` | Writing onboarding.md rewrite |

**SDK Skills alignment is RESOLVED** — don't re-investigate. The full analysis is in the ADR-012 addendum (`_evryn-meta/docs/decisions/012-trigger-composed-identity.md`). Summary: Skills format principles adopted; loading mechanism not needed.

---
