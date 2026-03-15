# Identity Writing S3 — Remaining Work

**Status:** In progress. core.md done (v7), operator.md and gatekeeper.md reviewed and approved, triage.md reviewed with gaps identified (schema questions + doc clarity). Next: resolve triage schema questions, rewrite triage.md, then write conversation.md and gatekeeper-onboarding.md.

**Previous sessions:** S1 wrote core.md (v5 on disk). S2 resolved all 5 open architectural questions (ADRs 012-017), wrote situation modules (operator, gatekeeper) and triage activity module, drafted onboarding (needs rewrite). Full history in `docs/sessions/historical/2026-03-04-identity-writing-s1.md` and `docs/sessions/historical/2026-03-04-identity-writing-s2.md`.

---

## Sprint Timeline Update

**Snow days March 12-13** — no power, no internet. Sprint is shifted:

| Original | New | What |
|----------|-----|------|
| Day 1: Mon March 2 – Wed March 11 | Extended through **Sun March 15** | Scaffolding (DONE) + identity files (IN PROGRESS) |
| Day 2: Thu March 12 | **Mon March 16** | Triage pipeline |
| Day 3: Fri March 13 | **Tue March 17** | Approval flow + conversation pathway |
| Day 4: Mon March 16 | **Wed March 18** | Hardening + integration test |
| Day 5: Tue March 17 | **Thu March 19** | Stabilization + go/no-go |
| Go-live | **~March 19-20** | Tell Mark "we're ready" |

**Sprint doc dates have NOT been updated yet** — do this at the start of the next session. The day-by-day section still shows the old dates.

---

## What Was Done (S3a — March 11)

- Updated `identity-writing-brief.md` extensively — added "What Identity Means" section (bright line: system-side context = identity, user-side input = prompt), "Rewriting Rules" section (pointer comment format, three key constraints, "more Evryn" test), caching/cost note for core.md (signal-to-noise, not token cost), gentle guide requirement (Justin's therapist analogy: "create a safe, fairly wide lane, then let them navigate it"), Smart Curiosity in full decision
- Added rewriting guidelines pointer comment to ALL existing identity files: `<!-- Make NO EDITS to this doc without consulting Rewriting guidelines: docs/identity-writing-brief.md -->`
- Fixed sprint doc dates (days of week off by one throughout, added Day 1 extended framing: Mon March 2 – Wed March 11)

**Key decisions made (S3a):**
- **"Identity" naming is correct** — not "system prompt docs." Only core.md and operator.md go in systemPrompt parameter; everything else loads via tool. "Identity" = full operating context on the system side.
- **Smart Curiosity full 11-area framework goes in core.md** — too fundamental to every conversation to be on-demand. `internal-reference/smart-curiosity-full.md` dropped from planned files.
- **"More Evryn" is the rewriting test** — not "sharper" (ambiguous), not "think/act/speak better" (too specific). "More Evryn" is future-proof.
- **Prescriptive > descriptive in instruction docs** — "must stay lean" not "are lean."
- **Gentle guide applies everywhere**, not just onboarding — belongs in core.md.

---

## What Was Done (S3b — March 14)

### Cleanup
- Removed `smart-curiosity-full.md` references from identity-writing-brief, onboarding.md, ARCHITECTURE.md file tree
- Fixed sprint doc Day 4 typo ("Monday" → "Tuesday")

### core.md → v7 (Justin's full review pass)
- **v6**: ~16 line edits from Justin's review — coffee shop paragraph reordered (operational list separated from poetic series), voice shifted to second person ("your name", "you need it"), trust section restructured ("Trust goes both ways" moved up), "Not a general chatbot", "You're never fluffy or sycophantic", added italics (*real* them, *this* person, *this* moment, *explicitly* mutual, *this particular* person), "give ground or stand your ground based on your values, not blind compliance", "log your observations for a later moment"
- **v7**: Three additions — gentle guide paragraph in "Who You Are", full Smart Curiosity 11-area bulleted list in "How You See People", available modules hub as new "What You Can Draw On" section at end of file

### Email address roles — resolved
- `evryn@evryn.ai` — Evryn's sender address
- `justin@evryn.ai` — Justin's inbox for reviewing drafts
- `systemtest@evryn.ai` — test recipient, stands in for the fictional gatekeeper during testing
- Fixed operator.md and triage.md (draft review → `justin@evryn.ai`)
- Resolved sprint doc #align flag: test recipient = `systemtest@evryn.ai`, `SEND_ENABLED=false` as second layer
- Added go-live checklist item: flip `SEND_ENABLED=true` + set `TEST_RECIPIENT` to Mark's real address
- Both safeguards are already wired in code (`src/email/client.ts`, `src/config.ts`)

### Status lifecycle — documented
- Consolidated `emailmgr_items` status values in ARCHITECTURE.md: `new→processing→pending_approval→done`, with branches to `escalated` or `error`
- Added full status lifecycle table to BUILD doc (Supabase Schema section): who sets each status, what triggers the next step, what catches stuck items
- Two operational requirements added: (1) startup recovery (reset stale `processing` → `new`), (2) stale item check (re-ping Slack for items stuck in `pending_approval` / `escalated` / `error` > 4 hours)
- Added both to sprint doc Day 4 hardening list
- Created Linear task EVR-54 for full escalation tracking infrastructure (v0.3, part of proactive behavior)

### Escalation mechanics — clarified
- For the sprint: Evryn calls `notifySlack()` tool during `query()` processing. Posts to Justin's Slack channel, does NOT respond to user. Justin handles in operator mode (separate Slack conversation). Email marked `escalated` in emailmgr_items.
- Full version (task queue, proactive follow-up) is part of proactive behavior infrastructure — same system as follow-up timers and proactive outreach. ARCHITECTURE.md Proactive Behavior section updated with escalation tracking as a use case.

### Identity file reviews — completed
- **operator.md**: Reviewed and approved. Two edits: "Be reasonably concise" (line 10), instruction channel line expanded ("If you don't see how to integrate it — tell him — it may be something the team needs to change, instead of something you can change.")
- **gatekeeper.md**: Reviewed and approved. No changes needed. Clean, focused situation module.
- **triage.md**: Reviewed with significant gaps found (see below)

### Credential setup doc
- Created `evryn-backend/docs/setup-credentials.md` — step-by-step Slack Socket Mode + Railway setup for Justin

---

## ⚠️ Triage.md Gaps — Must Resolve Before Rewrite

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

## Current Todo List

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | ~~Cleanup: smart-curiosity-full.md refs~~ | DONE | |
| 2 | ~~Cleanup: sprint doc Day 4 typo~~ | DONE | |
| 3 | ~~Fix email address roles~~ | DONE | operator.md, triage.md, sprint doc |
| 4 | ~~Update core.md v6+v7~~ | DONE | Justin's review pass + three additions |
| 5 | ~~Review operator.md~~ | DONE | Two edits made |
| 6 | ~~Review gatekeeper.md~~ | DONE | No changes needed |
| 7 | ~~Review triage.md~~ | DONE | Gaps identified (see above) |
| 8 | Update sprint doc dates | TODO | Snow day shift — see Sprint Timeline Update above |
| 9 | Resolve triage schema questions (1-5 above) | TODO | **Do this first** — answers determine triage.md rewrite |
| 10 | Rewrite triage.md with precise instructions | TODO | After schema questions resolved |
| 11 | Resolve module shape/format question | TODO | Triage.md is the template — capture format in identity-writing-brief |
| 12 | Write conversation.md | TODO | **DC Day 3 blocker** (Tue March 17) |
| 13 | Write gatekeeper-onboarding.md | TODO | **Needed by Day 4** (Wed March 18) for integration test |
| 14 | Review onboarding.md | TODO | First draft has 14 feedback items (see below) |
| 15 | Rewrite onboarding.md | TODO | Extract gatekeeper content, fix all feedback items |

**Justin parallel task:** Slack Socket Mode + Railway setup — DONE (completed March 11).

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
   - `evryn-backend/identity/activities/onboarding.md` — first draft, needs rewrite (14 feedback items below)

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
| 13 | `evryn-backend/docs/SPRINT-MARK-LIVE.md` | Skim | Day-by-day timing, urgency context (**dates need updating — see Sprint Timeline Update**) |

**Fresh reads when we reach specific modules (not loaded yet):**

| File | When needed |
|------|-------------|
| `_evryn-meta/docs/hub/detail/gatekeeper-approach.md` | Writing gatekeeper-onboarding.md |
| `_evryn-meta/docs/hub/detail/gatekeeper-flow.md` | Writing gatekeeper-onboarding.md |
| v0.1 historical files in `evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/` | Writing onboarding.md rewrite |

**SDK Skills alignment is RESOLVED** — don't re-investigate. The full analysis is in the ADR-012 addendum (`_evryn-meta/docs/decisions/012-trigger-composed-identity.md`). Summary: Skills format principles adopted; loading mechanism not needed.

---

## Open Questions (Must Resolve During Review)

### Module Shape / Format (S2 Open Question #2 — still open)

**The question:** What should identity modules look like structurally? Current drafts read like personality guides. They should read more like "a job description meets a workflow" — operational instructions that Evryn can USE.

**What we learned from SDK skills best practices:**
- Shape should be: what's the goal, what are the steps, what does success look like, what tools/references do you have, what do you escalate
- "Success criteria" should include the relationship/vibes stuff — that IS Evryn's job
- Assume the LLM is already smart — only add what it doesn't know
- Set appropriate degrees of freedom (high for relationship stuff, low for approval workflows)
- Include conditional workflows where the path forks
- Reference deeper material (internal-reference files) one level deep

**This needs to be captured in a persistent doc** (identity-writing-brief.md or a new "module format guide") so every module gets built to the same shape. Justin noted that triage.md likely serves as the template (preconditions, steps, decision points, outputs, security, principles) — confirm during review.

### core.md Updates — DONE

All three resolved in S3b:
- ✅ **Available modules hub** — "What You Can Draw On" section added to core.md v7
- ✅ **"Gentle guide" quality** — paragraph added in "Who You Are" section
- ✅ **Smart Curiosity in full** — 11-area bulleted list in "How You See People"

---

## Onboarding Feedback (Justin's notes on first draft — all must be addressed in rewrite)

These are Justin's specific issues with the first `onboarding.md` draft. Preserving his language because the phrasing carries the intent:

1. **"not just a data collection exercise"** — change to "not a data collection exercise" (remove "just")
2. **Pacing section** — "Don't dump everything you know or everything you want to say up front" better than original
3. **"This isn't just tone — it's a design constraint"** — unclear jargon. Make transparent so any human or LLM understands it without needing to be savvy.
4. **"Let them lead" is wrong.** Evryn should *gently guide*. Justin's analogy: like his best therapist — "I feel like I'm very gently being guided — it's my show, but I have this expert who's very gently guiding me — she knows the landscape, she won't let me stray off too far." The v0.1 prototype did this well: it gently led toward things it needed to capture, then gracefully tailed out. This is not "let them lead" — it's "create a safe, fairly wide lane, then let them navigate it."
5. **"Don't improvise the sequence"** → "Avoid improvising the sequence"
6. **Contact capture needs context awareness.** Sometimes you already HAVE their contact info (they emailed a gatekeeper, they signed up, etc.). Evryn needs to check what she already knows before asking. If she has email from a forward, the question might be "is this the best way to reach you?" not "can I get your email?"
7. **Missing goals/workflow structure.** The draft feels "flaccid" — it could meander. Needs clear steps/progression like the v0.1 prototype had (acknowledge → introduce → get them talking → Smart Curiosity → "More About Me" → contact capture → close gracefully). Not rigid scripts, but clear sense of direction.
8. **The "gentle guide" quality may need to live in core.md.** ✅ DONE — added to core.md v7.
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
