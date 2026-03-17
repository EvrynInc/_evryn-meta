# Identity Writing S4 — Remaining Work

**Status:** In progress. core.md done (v7), operator.md and gatekeeper.md reviewed and approved. Triage.md has gaps (schema questions + doc clarity). Onboarding.md first draft needs rewrite (14 feedback items). conversation.md and gatekeeper-onboarding.md not started.

**Previous sessions:** S1 wrote core.md (v5). S2 resolved architectural questions (ADRs 012-017), wrote situation modules (operator, gatekeeper) and triage activity module, drafted onboarding. S3 did core.md v6+v7 (Justin's full review), reviewed all existing identity files, identified triage.md gaps, updated sprint dates for snow day shift. Full history in `docs/sessions/historical/`.

---

## What Needs to Happen (Priority Order)

1. ~~**Resolve triage schema questions**~~ — DONE. All 5 resolved, see below.
2. ~~**Rewrite triage.md**~~ — DONE. v3 on disk, dry-run tested with fresh instance.
3. ~~**Resolve module shape/format question**~~ — DONE. triage.md is the template. Patterns captured in identity-writing-brief.md.
4. **Write conversation.md** — DC Day 3 blocker (Tue March 17)
5. **Write gatekeeper-onboarding.md** — needed by Day 4 (Wed March 18) for integration test
6. **Review + rewrite onboarding.md** — 14 feedback items (see below)
7. **Write new-contact.md and regular-user.md** — real versions, not stubs

---

## Triage.md Gaps — Must Resolve Before Rewrite

AC walked through triage.md line by line with the lens: "Can Evryn follow this doc and know exactly what to do?" Found 8 gaps in two categories.

### Schema Questions — RESOLVED (S4 session, 2026-03-15)

All five resolved. Decisions below affect field names in triage.md rewrite and DC schema tasks.

1. **Where does first-call classification live?** → New field `emailmgr_items.sender_type` (values: `lead` / `ignore` / `bad_actor`). Dedicated field, not `categories[]` — keeps classifications queryable and `categories[]` available for future tagging. **Naming update (late S4):** Originally `user`, renamed to `lead` to avoid ambiguity — `user` conflicted with the `users` table name, since leads AND bad actors both become user records. `lead` = "real person, potential contact from a gatekeeper's inbox."

2. **Where does gold/pass/edge classification live?** → New field `emailmgr_items.triage_result` (values: `gold` / `pass` / `edge` / null). Null when sender_type isn't `lead`. Two-step classification (sender_type first, triage_result second) is cleaner than a single compound field.

3. **Where do Evryn's notes/impressions live in the user record?** → `users.profile_jsonb.story` — a single growing, append-only narrative. Date-stamped entries. Who they are, what stood out, what you observed, what you wonder, how they came to Evryn. **Merged (late S4):** Originally split into `.story` (narrative) + `.notes` (timestamped array), but the distinction was artificial — it's all the same thing. Also: rename existing `emailmgr_items.summary` → `triage_reasoning`. Also: `profile_jsonb._meta` key carries hygiene instructions ("append with date stamps, never overwrite or compress") as belt-and-suspenders against LLM over-compression.

4. **Does Evryn create or update `emailmgr_items`?** → Trigger creates the emailmgr_item (status: `new`). Evryn updates it (sender_type, triage_result, triage_reasoning, status changes). Triage.md's "use your Supabase tools to create it" is wrong — must say "update."

5. **Who creates the original sender's user record?** → Trigger creates/finds the gatekeeper (forwarder) record. Evryn creates the original sender's user record during triage — the original sender info is in `emailmgr_items.original_from` (trigger-extracted), but the user record creation requires Evryn's judgment (story, classification context). Leads get `users.status = 'lead'`. Bad actors get `users.status = 'bad_actor'` (unambiguous — reasoning stored in `profile_jsonb.story`). **Naming update (late S4):** Originally `restricted` for bad actors, changed to `bad_actor` for clarity — `restricted` was vague and could apply to other situations.

### Doc Clarity (fixable once schema questions are answered)

6. **No status update instructions anywhere.** Triage.md never tells Evryn to update `emailmgr_items.status` — not to `pending_approval` when drafting, not to `escalated` when escalating, not at any step. The whole status lifecycle is invisible in the identity doc.

7. **"Learn immediately" (line 75) is descriptive, not prescriptive.** Says "every signal updates your understanding" but doesn't tell Evryn what to DO. Should be: "After every approval, rejection, or piece of gatekeeper feedback, update your understanding of what 'gold' means for this gatekeeper. Refine `gatekeeper_criteria` if feedback reveals a pattern."

8. **No "check if user already exists" instruction.** The "For all people" section says "Create a record in the users table" — but what if the person already has a record from a previous forward? Evryn needs to check first.

### Flow Decisions — RESOLVED (S4 session, 2026-03-15)

1. **Trigger creates emailmgr_item; Evryn updates it.** Trigger does deterministic extraction (original_from, subject, forwarding note, is_forwarded, clean email body). Evryn does judgment (classification, user record creation, drafting notifications).

2. **Trigger creates/finds gatekeeper record; Evryn creates original sender's user record.** The trigger knows the forwarder (From: header). The original sender is in `emailmgr_items.original_from` (trigger-extracted). Evryn creates the user record because it requires judgment (story, notes, context).

3. **Structured handoff prompt.** The trigger composes Evryn's prompt as structured data + clean email body, not the raw email. Format:
   ```
   Forwarded email from [gatekeeper] (gatekeeper):
   - emailmgr_item_id: [uuid]
   - Original sender: [email from original_from field]
   - Subject: [subject]
   - Gatekeeper's note: [forwarding note, if any]

   Email body:
   [clean parsed body text — NOT content_raw with headers]
   ```
   Principle: everything deterministic is done deterministically. Evryn's intelligence is for judgment, not parsing.

4. **Gatekeeper's forwarding note.** Stored in the messages table (the whole forwarded email including note goes there as a message record). Also extracted by the trigger and included in Evryn's structured handoff prompt.

5. **Post-classification flow.** Gold/edge: Evryn drafts notification email → emails draft to review@evryn.ai → pings Slack → updates status to `pending_approval` → waits for Justin's approval on Slack. Pass: status → `done` (logged, no notification). Ignore/bad_actor: status → `done` (logged).

6. **No separate `body` field in current schema.** `content_raw` stores the full raw email. The clean parsed body is composed by the trigger at runtime for the prompt — not persisted separately. Open question whether a `body` field should be added (goes to DC via sprint doc).

7. **Database renamed.** Supabase project renamed from "n8n prototype" to "Evryn Product." Serves both backend and frontend.

8. **Backups.** Free Supabase plan has no automated backups. Manual backups sufficient at current scale (Mark + test-gatekeeper). DC to set up `evryn-backend/backups/` directory and a dump script. Backup check added to #sweep protocol.

---

## Module Shape / Format — RESOLVED (S4 session, 2026-03-15)

**Resolved:** triage.md IS the template. Nine principles extracted from writing and dry-run testing it, captured in the "Activity Module Patterns" section of `evryn-backend/docs/identity-writing-brief.md`. The brief has been updated with the structural pattern (header → context → preconditions → what you have → your data → phases → security) and all writing principles. Future modules should follow this pattern.

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
| `activities/conversation.md` | Activity | DONE | Written by AC1, wired by DC Day 3 |
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
- **Approval flow.** All outbound → review@evryn.ai (email review for formatting) → Slack (approve/notes) → send with Bcc review@evryn.ai. Slack-only approval because email sender identity can be spoofed; Slack user ID cannot.
- **Email address roles.** `evryn@evryn.ai` (Evryn's sender), `review@evryn.ai` (Justin's draft review inbox), `systemtest@evryn.ai` (test recipient standing in for the fictional gatekeeper during testing).
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
| 14 | `evryn-backend/docs/schema-reference.md` | Full | Current database schema snapshot (what IS, not what ought to be — ARCHITECTURE.md is the target) |

**Fresh reads when we reach specific modules (not loaded yet):**

| File | When needed |
|------|-------------|
| `_evryn-meta/docs/hub/detail/gatekeeper-approach.md` | Writing gatekeeper-onboarding.md |
| `_evryn-meta/docs/hub/detail/gatekeeper-flow.md` | Writing gatekeeper-onboarding.md |
| v0.1 historical files in `evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/` | Writing onboarding.md rewrite |

**SDK Skills alignment is RESOLVED** — don't re-investigate. The full analysis is in the ADR-012 addendum (`_evryn-meta/docs/decisions/012-trigger-composed-identity.md`). Summary: Skills format principles adopted; loading mechanism not needed.

---
