# Identity Writing S3 — Remaining Work

**Status:** In progress. Pre-review groundwork done (S3a). Next action: review existing identity files with Justin, then write remaining modules.

**Previous sessions:** S1 wrote core.md (v5 on disk). S2 resolved all 5 open architectural questions (ADRs 012-017), wrote situation modules (operator, gatekeeper) and triage activity module, drafted onboarding (needs rewrite). Full history in `docs/sessions/historical/2026-03-04-identity-writing-s1.md` and `docs/sessions/historical/2026-03-04-identity-writing-s2.md`.

---

## What Was Done This Session (S3a — March 11)

- Updated `identity-writing-brief.md` extensively — added "What Identity Means" section (bright line: system-side context = identity, user-side input = prompt), "Rewriting Rules" section (pointer comment format, three key constraints, "more Evryn" test), caching/cost note for core.md (signal-to-noise, not token cost), gentle guide requirement (Justin's therapist analogy: "create a safe, fairly wide lane, then let them navigate it"), Smart Curiosity in full decision
- Added rewriting guidelines pointer comment to ALL existing identity files: `<!-- Make NO EDITS to this doc without consulting Rewriting guidelines: docs/identity-writing-brief.md -->`
- Fixed sprint doc dates (days of week off by one throughout, added Day 1 extended framing: Mon March 2 – Wed March 11)

**Key decisions made:**
- **"Identity" naming is correct** — not "system prompt docs." Only core.md and operator.md go in systemPrompt parameter; everything else loads via tool. "Identity" = full operating context on the system side.
- **Smart Curiosity full 11-area framework goes in core.md** — too fundamental to every conversation to be on-demand. `internal-reference/smart-curiosity-full.md` dropped from planned files.
- **"More Evryn" is the rewriting test** — not "sharper" (ambiguous), not "think/act/speak better" (too specific). "More Evryn" is future-proof.
- **Prescriptive > descriptive in instruction docs** — "must stay lean" not "are lean."
- **Gentle guide applies everywhere**, not just onboarding — belongs in core.md.

**Cleanup still needed (batched for review pass):**
- Remove `smart-curiosity-full.md` references from: identity-writing-brief (internal-reference section, ~line 170s), onboarding.md content spec, ARCHITECTURE.md canonical file tree (~line 499)
- Sprint doc Day 4 text still says "Start drafting the message to Mark for Day 5 (Monday)" — should say "(Tuesday)"

---

## Sprint Alignment — March 11

The Mark Live sprint (`evryn-backend/docs/SPRINT-MARK-LIVE.md`) has DC starting Day 2 (triage pipeline) tomorrow. Day 1 scaffolding is already done — `src/` has email poller, Supabase client, Slack notifier, config. Synthetic test fixtures (18 emails) are done too.

**What DC needs from identity writing, and when:**

| Sprint Day | DC Needs | Status |
|------------|----------|--------|
| Day 1 (done) | Nothing — scaffolding complete | DONE |
| Day 2 | core.md (done), triage.md (done), operator.md (done), gatekeeper.md (done) for triage pipeline | READY |
| Day 3 | conversation.md for conversation pathway | **NOT WRITTEN** |
| Go-live (~Mar 18) | gatekeeper-onboarding.md for Mark's first interaction | **NOT WRITTEN** |

**Priority order (sprint-critical first):**
1. **Review existing identity files with Justin.** It's been a week and major structural work happened in between — Justin needs to re-read core.md, operator.md, gatekeeper.md, triage.md, and onboarding.md (first draft) before any new writing. Catch anything that feels off now, not after we've built on top of it.
2. core.md updates — available modules hub (Evryn can't discover modules without it), gentle guide quality, Smart Curiosity in full
3. conversation.md — DC Day 3 blocker
4. gatekeeper-onboarding.md — needed before Mark goes live
5. Split current onboarding.md — extract gatekeeper content into gatekeeper-onboarding.md, leave regular onboarding as a v0.3 polish pass (~90% done)
6. new-contact.md, regular-user.md, company-context.md, internal-reference files — v0.3, not sprint-blocking

### ⚡ Justin: While AC Writes, Set Up DC Credentials

AC has significant writing time where Justin is waiting. Use that time to prep DC's environment — when identity files are done, DC can start immediately with no gap.

**Already in `.env` (confirmed):** Gmail OAuth (evryn@evryn.ai), Supabase URL + service key, Slack webhook, Mark protection flags.

**Still needed for DC Day 2:**
- [x] **`ANTHROPIC_API_KEY`** — in `.env` (copied from `evryn-team-agents/.env`). Not in config.ts yet — DC will add it.
- [x] **Slack Socket Mode setup** — DONE (2026-03-11). Socket Mode enabled, App-Level Token + Bot Token in `.env`, scopes configured (chat:write, channels:history, channels:read, im:history, im:read, groups:read, groups:history, users:read), event subscriptions (message.channels, message.im, message.groups). Legacy webhook retained until Socket Mode code is live.
- [x] **Railway project** — DONE (2026-03-11). Project `evryn-backend` created, CLI installed and linked. DC deploys with `railway up`.

---

## To Resume (Reading List for a Fresh Instance)

Read these in order. The first 6 are full reads (short, critical). The rest are selective.

**Full reads — these set the frame:**
1. `_evryn-meta/docs/hub/roadmap.md` — the Hub. What Evryn is, the business model, the philosophy. Always first.
2. `_evryn-meta/docs/hub/trust-and-safety.md` — trust loop, canary principle, crisis protocols. Critical for tone.
3. `_evryn-meta/docs/hub/user-experience.md` — onboarding flows, Training Mode, anticipation mode. Critical for module writing.
4. `evryn-backend/docs/identity-writing-brief.md` — the working spec for all identity files. Extensively updated this session.
5. `evryn-backend/identity/core.md` — the voice everything must match (v5 on disk, ~1,500 tokens).
6. This session doc (you're reading it).

**Selective reads — system context:**
7. `evryn-backend/docs/ARCHITECTURE.md` — Read lines 1-50 (overview) and lines 430-625 (Identity Composition section). Honor Required Context demands in that section.
8. `evryn-backend/docs/BUILD-EVRYN-MVP.md` — Read lines 1-80 (overview and workflow).
9. `evryn-backend/docs/SPRINT-MARK-LIVE.md` — Skim for Day 2/Day 3 timing and urgency context.

**Existing identity files — read ALL of these (review is the next task):**
10. `evryn-backend/identity/situations/operator.md`
11. `evryn-backend/identity/situations/gatekeeper.md`
12. `evryn-backend/identity/activities/triage.md`
13. `evryn-backend/identity/activities/onboarding.md` (first draft, needs rewrite — read to understand what went wrong)

**Reference material for module writing:**
14. `_evryn-meta/docs/hub/detail/gatekeeper-approach.md` — gatekeeper operational playbook (needed for gatekeeper-onboarding module)
15. `_evryn-meta/docs/hub/detail/gatekeeper-flow.md` — end-to-end gatekeeper lifecycle
16. **All three v0.1 historical files** in `evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/` — early prototype to study. Beautiful Language has match calibration, refund promise, tone guidelines. Description & Instructions has conversation flows and abuse handling. **Critical for onboarding workflow structure** — the v0.1 progression (acknowledge → introduce → get them talking → Smart Curiosity → "More About Me" → contact capture → close gracefully) is the reference model.
17. If *necessary*, read the SDK skills docs to absorb the *format* principles, not to question the *architecture*:
    - `https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview`
    - `https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices`

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

### core.md Updates Needed

Confirm these are addressed in core.md:
- **Available modules hub** — situations AND activities Evryn can pull on demand (excluding operator — security boundary). Without this, Evryn won't know modules exist when she needs them mid-conversation.
- **"Gentle guide" quality** — captured in identity-writing-brief (line 85) with Justin's therapist analogy. Needs to be in core.md too since it applies everywhere.
- **Smart Curiosity in full** — DECIDED: full 11-area framework goes in core.md (see decisions above).

**Already confirmed present in core.md:** Dual-track processing and within-conversation pacing. Don't re-check these — they're in.

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
8. **The "gentle guide" quality may need to live in core.md.** Evryn is your guide — she'll gently guide you through, but you're always in charge of your own journey. This applies everywhere, not just onboarding.
9. **Gatekeeper onboarding should be a separate activity module** (`gatekeeper-onboarding.md`). The workflows are genuinely different: regular onboarding = understand the person for matching; gatekeeper onboarding = understand their judgment for triaging. Different goals, different steps.
10. **Need REAL new-contact.md and regular-user.md, not stubs.** Justin: "we're going to work harder trying to figure out what should be stubbed vs just trying our best to create the real version." Can't properly scope onboarding without knowing what situation module loads alongside it.
11. **Acknowledge what you know about them** during onboarding — but this must pass through the "don't share anything user-to-user without explicit permission" gate. If Justin told Evryn stuff about Mark, she needs to vet what Mark would be comfortable knowing she was told.
12. ~~**gatekeeper.md lifecycle fix needed.**~~ DONE. "What You Know" → "What You Should Know" with framing: if you don't have gatekeeper_criteria yet, you need to find it out via onboarding. Don't triage without it. Module on disk is current.
13. **Precondition checks** needed in all activity modules (like triage has).
14. **Feedback line update:** "Even a one-liner on *why* helps you learn *so* much faster."

---

## Modules to Write

**Before writing more modules:** Resolve module shape/format and core.md check above.

| Module | Type | Status | Notes |
|--------|------|--------|-------|
| `activities/onboarding.md` | Activity | Rewrite needed | First draft on disk has structural problems (see feedback above) |
| `activities/gatekeeper-onboarding.md` | Activity | Not started | NEW — separate from regular onboarding (feedback #9) |
| `activities/conversation.md` | Activity | Not started | |
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
- **emailmgr tagging (user/ignore/bad_actor)** is already implemented in triage.md's "First Call: Who Sent This?" section. Gold/edge/pass is a sub-classification within "user."
- **v0.2 vs v0.3 framing.** v0.2: Evryn is a smart reader (emails at face value + web research). v0.3: Evryn actually meets people (conversations, trust building). Onboarding should set this expectation with the gatekeeper.
- **Approval flow.** All outbound → justin@evryn.ai (email review for formatting) → Slack (approve/notes) → send with Bcc justin@evryn.ai. Slack-only approval because email sender identity can be spoofed; Slack user ID cannot.
