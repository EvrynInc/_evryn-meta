# Identity Writing S3 — Remaining Work

**Status:** Not started. Picking up from S2 (archived to `historical/`).

**Previous sessions:** S1 wrote core.md (v5 on disk). S2 resolved all 5 open architectural questions (ADRs 012-017), wrote situation modules (operator, gatekeeper) and triage activity module, drafted onboarding (needs rewrite). Full history in `docs/sessions/historical/2026-03-04-identity-writing-s1.md` and `docs/sessions/historical/2026-03-04-identity-writing-s2.md`.

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
2. core.md updates — available modules hub (Evryn can't discover modules without it)
3. conversation.md — DC Day 3 blocker
4. gatekeeper-onboarding.md — needed before Mark goes live
5. Split current onboarding.md — extract gatekeeper content into gatekeeper-onboarding.md, leave regular onboarding as a v0.3 polish pass (~90% done)
6. new-contact.md, regular-user.md, company-context.md, internal-reference files — v0.3, not sprint-blocking

### ⚡ Justin: While AC Writes, Set Up DC Credentials

AC has significant writing time where Justin is waiting. Use that time to prep DC's environment — when identity files are done, DC can start immediately with no gap.

**Already in `.env` (confirmed):** Gmail OAuth (evryn@evryn.ai), Supabase URL + service key, Slack webhook, Mark protection flags.

**Still needed for DC Day 2:**
- [x] **`ANTHROPIC_API_KEY`** — in `.env` (copied from `evryn-team-agents/.env`). Not in config.ts yet — DC will add it.
- [ ] **Slack Socket Mode setup** — Day 2 upgrades from webhook to Socket Mode (two-way). Go to the Slack app settings → Socket Mode → enable. This gives you an **App-Level Token** (`SLACK_APP_TOKEN`, starts with `xapp-`). You'll also need the **Bot User OAuth Token** (`SLACK_BOT_TOKEN`, starts with `xoxb-`). DC will add these to config.ts.
- [ ] **Railway project** — create a project for evryn-backend if not already done. DC deploys from CLI.

---

## To Resume

**Read these docs in this order:**
1. `_evryn-meta/docs/hub/roadmap.md` — the Hub. Always load this first.
2. `evryn-backend/docs/identity-writing-brief.md` — the working spec for all identity files
3. `evryn-backend/identity/core.md` — the voice everything must match (v5 on disk)
4. `evryn-backend/docs/BUILD-EVRYN-MVP.md` — the workflow Evryn follows
5. `evryn-backend/docs/ARCHITECTURE.md` — Identity Composition section (~line 439), honor Required Context demands
6. `_evryn-meta/docs/hub/detail/gatekeeper-approach.md` — gatekeeper operational playbook (needed for gatekeeper-onboarding module)
7. `_evryn-meta/docs/hub/detail/gatekeeper-flow.md` — end-to-end gatekeeper lifecycle
8. `_evryn-meta/docs/research/learning-levels-and-instrumentation.md` — feedback/learning architecture
9. `_evryn-meta/docs/hub/user-experience.md` — onboarding flows, Training Mode, anticipation mode
10. `_evryn-meta/docs/hub/trust-and-safety.md` — trust loop, canary principle, crisis protocols
11. **All three v0.1 historical files** in `evryn-backend/docs/historical/Evryn_0.1_Instructions_Prompts_Scripts/` — treat as an early prototype to study and extract useful patterns from. The language in Prompts & Scripts was chosen very carefully. Beautiful Language has early match calibration ("magic of duds"), refund promise, and tone guidelines. Description & Instructions has conversation flows and abuse handling. **Critical for onboarding workflow structure** — the v0.1 progression (acknowledge → introduce → get them talking → Smart Curiosity → "More About Me" → contact capture → close gracefully) is the reference model for what "clear sense of direction" means.
12. The completed identity files on disk: `identity/situations/operator.md`, `identity/situations/gatekeeper.md`, `identity/activities/triage.md`, `identity/activities/onboarding.md` (first draft, needs rewrite — read to understand what went wrong)
13. Claude Agent SDK skills docs (fresh from web):
    - `https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview`
    - `https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices`
14. This doc

**SDK Skills alignment is RESOLVED** — don't re-investigate. The full analysis is in the ADR-012 addendum (`_evryn-meta/docs/decisions/012-trigger-composed-identity.md`). Summary: Skills format principles adopted (concise, operational, progressive disclosure, degrees of freedom); Skills loading mechanism not needed (our trigger composition + on-demand tool reads already does what Skills does, but better scoped). Read the SDK docs to absorb the *format* principles, not to question the *architecture*.

---

## Open Questions (Must Resolve First)

### Module Shape / Format (S2 Open Question #2 — still open)

**The question:** What should identity modules look like structurally? Current drafts read like personality guides. They should read more like "a job description meets a workflow" — operational instructions that Evryn can USE.

**What we learned from SDK skills best practices:**
- Shape should be: what's the goal, what are the steps, what does success look like, what tools/references do you have, what do you escalate
- "Success criteria" should include the relationship/vibes stuff — that IS Evryn's job
- Assume the LLM is already smart — only add what it doesn't know
- Set appropriate degrees of freedom (high for relationship stuff, low for approval workflows)
- Include conditional workflows where the path forks
- Reference deeper material (internal-reference files) one level deep

**This needs to be captured in a persistent doc** (identity-writing-brief.md or a new "module format guide") so every module gets built to the same shape.

### core.md Check

Confirm these are explicit enough in core.md:
- **Available modules hub** — situations AND activities Evryn can pull on demand (excluding operator — security boundary). Without this, Evryn won't know modules exist when she needs them mid-conversation.
- **"Gentle guide" quality** — may need to be made more explicit (see onboarding feedback #4 below for Justin's full description)
- **Smart Curiosity DNA** — the orientation (hold areas softly in mind, stay curious), not the full 11-item checklist. Partially there but may need strengthening.

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
| Internal reference files | Reference | Not started | canary-procedure, crisis-protocol, trust-arc-scripts, smart-curiosity-full, contact-capture, feedback-guidance, cultural-trust-fluency (v0.3+ — five culture group table from S1 offload list) |

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
