# Identity Writing S5 — Session Doc

**Status as of 2026-03-23.** Continuation of S4 work. AC1 (fresh instance) reviewing and revising identity docs, writing remaining pre-go-live files.

**Previous session:** S4 (`docs/sessions/historical/2026-03-15-identity-writing-s4.md` — move there when retiring).

---

## What Was Done This Session

### core.md updates (committed, on disk)

1. **"User privacy is sacred" rewrite** (Hard Constraints section). Expanded from 2 sentences to a full protocol:
   - Changed headline from "User isolation is absolute" to "User privacy is sacred"
   - Explicit consent model: user must authorize *this particular* information with *this particular* person (or mark as generally shareable)
   - Evryn Team QA access acknowledged via consent forms
   - Default-private rule: always assume private unless explicit permission
   - Existential consequence framing: "There is no recovery from a user learning you shared something they told you in confidence"

2. **Story lenses framework** (after "Your notes must stand on their own"). Six lenses Evryn maintains for every user:
   - Who they are / What they're looking for / How they came to Evryn / What you've observed / Where you and this user are / What you wonder
   - "Not every entry touches every lens. But if you've had a meaningful interaction and your entry only touches one, you probably missed something."

3. **"Notes from others" protocol** (new subsection after story lenses). `shareable_with_user` protocol:
   - `false` = you know it, cannot reference it with the user in any way
   - `true` = safe to reference, requires `authorized_by` trail
   - "verify you're 100% sure *what* they're authorizing"
   - Felt appeal tying back to the sacred privacy constraint
   - Activity modules carry situation-specific guidance on top of this

### AC0 note written

`docs/sessions/2026-03-23-ac0-note-runtime-scaffold.md` — covers:
1. profile_jsonb runtime scaffold (template for new user records)
2. story_history → separate table (v0.3, flag in ARCHITECTURE.md)
3. `seen_by_subject` → `shareable_with_user` rename (docs only, no migration)
4. Model tier shift: Opus default for all Evryn-as-agent work
5. Adversarial testing note for shareable_with_user protocol

### Naming changes decided

- `seen_by_subject` → `shareable_with_user` (authorization, not awareness)
- "User isolation is absolute" → "User privacy is sacred" (headline)
- Model tier: "Opus default for Evryn, Haiku/deterministic for mechanical extraction"

---

## What Needs to Happen (Priority Order)

### 1. Revise gatekeeper-onboarding.md

Add these sections/changes:

**a. "Before You Start" section** (combined preconditions + data orientation):
- User record exists in Supabase
- Check what you already know about this user — read their `profile_jsonb` (Justin or the Evryn Team may have written notes with `shareable_with_user: false`)
- Information boundary: you know what you were told, but follow the `shareable_with_user` protocol in core.md. For gatekeepers specifically, you can acknowledge that you were given some context to be prepared, but let *them* fill in the specifics.

**b. Expand "Get to Know Them" with conversational framework priming** (from weekend thinking doc `01-onboarding-frameworks.md`):
- Name MI as the backbone ("Consider drawing on Motivational Interviewing techniques, including but not limited to...")
- Reflective listening — reflecting back something slightly deeper than what they said
- Following resistance and silence — what they skip or rush past is informative
- OARS (Open questions, Affirmations, Reflections, Summaries)
- Narrative technique: "Invite specific moments, not self-descriptions" — "Tell me about a time when..." instead of "What do you value?"
- Follow the energy shift — when something lights up or goes quiet, pull that thread
- Graduated vulnerability — start where they're comfortable, match their depth signals
- Framing: this is a *different section* from "Learn Their Criteria" — it sets the mode of conversation that makes the criteria questions land naturally

**c. Flesh out "Introduce Yourself":**
- Anchoring points Evryn should hit: you find people their "right people," you only connect people you trust, their inbox is your starting point for finding great people, you'll get better as you go
- Reference trust-arc-scripts.md for the full "More About Me" sequence if they want to go deeper
- Some of these points go on the "should cover" onboarding list, some on the "if opportunity" list

**d. Two-tier onboarding topic lists:**
- **Should cover** (really try to get these into the first conversation):
  - How Evryn works (brief intro — trust-arc-scripts has the full sequence)
  - Their criteria (the core of this module)
  - Feedback expectations (transactional + training)
  - The validation period and what to expect
  - How to send you emails (setup)
- **If opportunity arises** (add to `onboarding_pending` if not covered):
  - The full trust arc / "More About Me" (if they want to go deeper)
  - The handoff vision (v0.3 end state — lightly hint at it)
  - Their broader needs beyond the inbox (they're a user, not just a gatekeeper)
  - Identity verification expectations (v0.3)

**e. Validation period check-ins** (in "What Happens Next"):
- "I'll check in with you from time to time to see how I'm doing"
- The goal: they sort alongside you, you learn from their feedback, and when they trust your judgment, you can take the pile completely off their plate

**f. Handoff hint** (lighter than current):
- Current version (line 51) describes the full auto-responder/contact-page vision — too much for first conversation
- Lightly hint: "Once you trust my judgment, I can take your inbound completely off your plate" — keep the details for a later conversation
- Move full handoff description to the "if opportunity" list

**g. Cross-user note writing:**
- When the gatekeeper shares information about people in their world (contacts, colleagues, people they've forwarded), write to those users' `profile_jsonb.notes` with proper provenance and `shareable_with_user: false`

**h. After the Conversation — story lenses:**
- Reference the story lenses from core.md when writing gatekeeper_criteria and story
- Remind: this person is a user, the gatekeeper role is how you're interacting now

### 2. Pass on onboarding.md

Incorporate the 14 feedback items from S4 (lines 94-114) plus patterns from gatekeeper-onboarding:

Key changes:
- Fix "Let them lead" (line 22) → gentle guide tension language matching core.md v7
- Add MI/conversational framework priming (same approach as gatekeeper-onboarding)
- Add two-tier onboarding topic lists
- Add `onboarding_pending` guidance
- Add preconditions / "Before You Start"
- Add cross-user note writing guidance
- Work through all 14 feedback items (preserved in S4 lines 94-114, will also be added to identity-writing-brief)
- Note: this is still v0.3 — the pass gets it to "ready for final review when we actually build," not "ship today"

### 3. Update ADR-018 Decision #5

Add note: the *analytical* framing (transactional + training) describes the two concerns feedback serves. The identity doc's *presentation order* (training value → transactional need) is intentional persuasion architecture — lead with benefit, close with obligation. This is not a conflict; it's the difference between analysis and voice.

### 4. Fix identity-writing-brief staleness

- Line 178: gatekeeper-onboarding.md status → "DONE (v3, approved)"
- Line 198: conversation.md status → "DONE (v2, approved)"
- Add cross-cutting concerns checklist to the writing principles
- Add "before writing, read related modules" to each content spec
- Move S4's 14 onboarding feedback items into the onboarding.md content spec

### 5. Update conversation.md

After gatekeeper-onboarding and onboarding passes are done:
- Add cross-user note writing guidance
- Verify it carries forward patterns established in the onboarding modules
- Check against the cross-cutting concerns checklist

### 6. Write three internal-reference files (pre-go-live)

**a. feedback-guidance.md** (highest priority):
- Two flows: transactional lifecycle (gold → delivered → matched/passed/no_gk_response) and training calibration
- How Evryn asks for feedback (gentle, consistent, not aggressive)
- Feedback quality spectrum (from "reject" to "reject because X" to "reject because X, and that's probably true generally")
- Cross-user feedback routing: gatekeeper feedback about a contact goes to contact's `profile_jsonb.notes` with `shareable_with_user: false`
- Follow-up cadence and Evryn's judgment framework for checking on delivered items
- Sources: ADR-018 Decision #5, learning-levels-and-instrumentation.md §"The Approval Gate as Training Interface"

**b. trust-arc-scripts.md:**
- Near copy-paste from v0.1 "More About Me" sequence (Prompts_Scripts_v1.0.md lines 26-77)
- Adapt to script-as-skill: give Evryn the beats + reasoning, not word-for-word scripts
- The order matters — each point builds on the last
- Include: what Evryn's about, privacy model, pricing model, aligned incentives, trust mechanics, the shop owner framing
- Referenced by: gatekeeper-onboarding.md, conversation.md, onboarding.md

**c. company-context.md** (public-knowledge/):
- Sanitized Hub — public-safe, lower-resolution view of Evryn-the-company
- Cannot contain: internal strategy, financials, team dynamics, agent architecture
- Must include: freshness timestamp + 7-day staleness instruction
- For when users ask "what are you?" / "how does this work?" / "who built you?"

### 7. Propose ARCHITECTURE.md updates

- `seen_by_subject` → `shareable_with_user` in the jsonc spec (lines 234-242)
- `story_history` → flag as separate table in target state
- Model tier language shift
- profile_jsonb scaffold template as the canonical spec
- (AC1 proposes; Justin approves; may need AC0 coordination)

### 8. Create S5 / retire S4

- Move S4 to `sessions/historical/`
- This doc (S5) becomes the active session doc
- Verify all S4 content is captured in persistent docs before retiring

---

## Decisions Made This Session

- `seen_by_subject` → `shareable_with_user` (authorization framing, not awareness)
- "User isolation is absolute" → "User privacy is sacred" (headline + expanded protocol)
- Feedback ordering in gatekeeper-onboarding.md is intentional: training value → transactional need (persuasion architecture). ADR-018 to be updated to prevent future conflicts.
- Model tier: Opus default for all Evryn-as-agent work. Sonnet only for formulaic tasks with Opus Publisher review. Haiku/deterministic for mechanical extraction.
- Story lenses framework: six categories Evryn maintains for every user
- profile_jsonb runtime scaffold: initialized template, not empty `{}`
- story_history → separate table when Reflection Module is built (v0.3)
- Conversational framework priming (MI, narrative techniques, graduated vulnerability) goes into onboarding modules directly, not a separate internal-reference file
- Cross-cutting concerns checklist for identity-writing-brief
- "Before writing a module, read related modules" pattern for content specs
- Cross-user note writing: Evryn can and should write to User B's profile during conversation with User A, using proper provenance and `shareable_with_user: false`

---

## Modules Status Table

| Module | Type | Status | Notes |
|--------|------|--------|-------|
| `core.md` | Core | **Updated this session** | Story lenses, shareable_with_user protocol, user privacy rewrite |
| `activities/triage.md` | Activity | Done (v3) | Reviewed, approved, dry-run tested |
| `activities/conversation.md` | Activity | Done (v2) — needs update | Cross-user note writing, carry forward onboarding patterns |
| `activities/gatekeeper-onboarding.md` | Activity | Done (v3) — revision planned | See §1 above for full revision spec |
| `activities/onboarding.md` | Activity | Draft — pass planned | v0.3, 14 feedback items + MI priming + alignment pass. See §2 above |
| `situations/operator.md` | Situation | Done | Reviewed, approved |
| `situations/gatekeeper.md` | Situation | Done | Reviewed, approved |
| `situations/new-contact.md` | Situation | Not started | v0.3. Real version, not stub. |
| `situations/regular-user.md` | Situation | Not started | v0.3. Real version, not stub. |
| `public-knowledge/company-context.md` | Knowledge | Not started | **Pre-go-live.** Sanitized Hub. |
| `internal-reference/feedback-guidance.md` | Reference | Not started | **Pre-go-live, highest priority.** Two-flow spec. |
| `internal-reference/trust-arc-scripts.md` | Reference | Not started | **Pre-go-live.** v0.1 "More About Me" as skill. |
| `internal-reference/canary-procedure.md` | Reference | Not started | v0.3. |
| `internal-reference/crisis-protocol.md` | Reference | Not started | v0.3. |
| `internal-reference/contact-capture.md` | Reference | Not started | v0.3. |

---

## To Resume (Reading List for a Fresh Instance)

Read in order. First 5 are full reads (short, critical). Rest are selective.

**Full reads:**
1. `_evryn-meta/docs/hub/roadmap.md` — the Hub. Always first.
2. `_evryn-meta/docs/hub/trust-and-safety.md` — trust loop, canary principle, crisis protocols.
3. `_evryn-meta/docs/hub/user-experience.md` — onboarding flows, Training Mode, anticipation mode.
4. `evryn-backend/docs/identity-writing-brief.md` — the working spec for all identity files.
5. `evryn-backend/identity/core.md` — the voice (v7+, updated this session).
6. This session doc.
7. All existing identity files (see modules table above for paths).

**Selective reads:**

| # | File | Lines | What's there |
|---|------|-------|-------------|
| 8 | `evryn-backend/docs/ARCHITECTURE.md` | 1-50 | Overview |
| 8 | `evryn-backend/docs/ARCHITECTURE.md` | 225-256 | profile_jsonb spec (note: `seen_by_subject` rename pending) |
| 8 | `evryn-backend/docs/ARCHITECTURE.md` | 430-540 | Identity Composition + trigger model |
| 8 | `evryn-backend/docs/ARCHITECTURE.md` | 608-624 | Onboarding Patterns |
| 9 | `_evryn-meta/docs/decisions/018-gold-to-match-bilateral-reframe.md` | Full | Status lifecycle, Decision #5 (feedback) |
| 10 | `evryn-backend/docs/BUILD-EVRYN-MVP.md` | 60-143 | Critical Principles + The Workflow |
| 11 | `evryn-backend/docs/BUILD-EVRYN-MVP.md` | 450-480 | Schema + Memory Scaling |
| 12 | `_evryn-meta/docs/hub/detail/gatekeeper-approach.md` | Full | Gatekeeper operational playbook |
| 13 | `evryn-team-workspace/shared/projects/product/research/2026.03.02 learning-levels-and-instrumentation.md` | Full | Feedback quality, approval gate as training interface |
| 14 | `evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/Evryn_0.1_Prompts_Scripts_v1.0.md` | Full | v0.1 scripts (source for trust-arc-scripts.md) |

**Weekend thinking docs** (evaluate against full context, don't rubber-stamp):
- `_evryn-meta/docs/sessions/2026-03-23-weekend-thinking/01-onboarding-frameworks.md` — MI/conversational frameworks for onboarding. Evaluated by AC1: strong add, integrate into "Get to Know Them" sections.

**AC0 coordination:**
- `_evryn-meta/docs/sessions/2026-03-23-ac0-note-runtime-scaffold.md` — runtime scaffold spec for DC
- AC2 was working weekend thinking docs into source-of-truth files — check if done before duplicating work

---
