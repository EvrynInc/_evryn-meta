# Session Doc: Identity Writing S2
**Date:** 2026-03-04
**Participants:** Justin + AC
**Status:** In progress

---

## To Resume This Session

**Read these docs in this order:**
1. `evryn-backend/docs/identity-writing-brief.md` — the working spec
2. `evryn-backend/identity/core.md` — the voice everything must match
3. `evryn-backend/docs/BUILD-EVRYN-MVP.md` — the workflow (being updated this session)
4. `_evryn-meta/docs/hub/detail/gatekeeper-approach.md` — gatekeeper operational playbook (was missing from S1 source list)
5. `_evryn-meta/docs/research/learning-levels-and-instrumentation.md` — feedback/learning architecture
6. This session doc

---

## What Happened in S2 (So Far)

### Phase 1: Module Architecture Restructure (Complete)

Resolved the granularity question from S1 and updated all docs:
- **Operator moved from activities/ to situations/.** Answers "who am I talking to?" not "what am I doing?"
- **Module granularity: Option A.** Lean activity modules (~500-800 tokens) carry judgment. Detailed procedures in `internal-reference/`, pulled via tool.
- **knowledge/ → public-knowledge/ + internal-reference/.** Bright security line.
- **Two new v0.3 situation stubs:** new-contact, regular-user (stubs themselves deferred from sprint)
- **Standardized situation order:** operator, gatekeeper, gold-contact, cast-off, regular-user, new-contact
- **Six docs updated:** ADR-015, ADR-012, ARCHITECTURE.md, identity-writing-brief.md, session doc S1, CHANGELOG.md
- **Committed and pushed** both repos.

### Phase 2: Identity Module Writing (In Progress)

**Completed files:**
- `identity/situations/operator.md` — Justin feedback: removed "What Doesn't Change" section (he may need full access early on), added systemtest@evryn.ai for email format checks (approvals still on Slack)
- `identity/situations/gatekeeper.md` — Justin feedback: removed "Build for One" section
- `identity/activities/triage.md` — ON DISK but needs rewrite (see below)

**Files written but rejected due to sibling errors (need rewrite):**
- `identity/activities/onboarding.md`
- `identity/activities/conversation.md`

### Phase 3: BUILD Doc Workflow Cleanup (Current)

While writing triage.md, Justin identified the BUILD doc's workflow section was missing critical details. Also discovered that `gatekeeper-approach.md` was not in the identity-writing-brief's source list — significant gap.

**Key decisions this phase:**

1. **v0.2 triage output = notify Mark only.** Evryn does NOT reply to original senders in v0.2. She sends gold/edge notifications to Mark. Records everyone (gold, edge, pass) for later outreach. Reply-to-sender is v0.3+ (autoresponder/direct contact phase).

2. **Delivery preferences struck.** No real-time/daily/weekly options. Just send notifications as they come. Simpler, more immediate. If Mark requests batching, accommodate later.

3. **Edge cases go to Mark with humility.** After Justin approves an edge case on Slack, Evryn sends it to Mark with explanation and uncertainty — not claiming it's gold.

4. **Feedback guidance = internal-reference file.** The three-tier feedback quality principle (from learning-levels-and-instrumentation.md) spans onboarding, conversation, and operator contexts. Too broad for one module, not needed every volley → `internal-reference/feedback-guidance.md`.

5. **Precondition checks needed in workflow.** Evryn must verify gatekeeper record + criteria + parseable forward before classifying. If anything fails → escalate to Justin on Slack, don't guess.

6. **Approval flow updated.** Email to systemtest@evryn.ai for format check, approve/reject on Slack (not email-based approval as BUILD doc originally said).

---

## Specific BUILD Doc Changes (Plan Approved)

### The Workflow section (lines 107-119):
- Step 4: Expand to bullets — criteria, context, expectations, feedback importance
- Step 7: Clarify approval flow (systemtest email + Slack approval)
- After step 8: Add 8a — Justin approves/rejects edge cases, approved ones go to Mark with humility
- Step 9: Expand with learning mechanics (training data, implicit signals, explicit feedback requests)
- New step 10: Preconditions and error handling

### Approval gate section (lines 123-127):
- Update to reflect systemtest@evryn.ai + Slack approval (was "via email, not Slack")

### gatekeeper-approach.md:
- Strike delivery preferences section (lines 193-202), replace with simple "send as they come"
- Add phase labels clarifying v0.2 vs v0.3 workflows

### identity-writing-brief.md:
- Add gatekeeper-approach.md to source materials list

---

## Remaining Work

After BUILD doc cleanup:
1. Rewrite `activities/triage.md` to match corrected workflow
2. Write `activities/onboarding.md` and `activities/conversation.md`
3. Write internal-reference files: canary-procedure, crisis-protocol, trust-arc-scripts, smart-curiosity-full, contact-capture, feedback-guidance (NEW)
4. Write `public-knowledge/company-context.md`
5. Commit + push

---

## Source Materials Read This Session

All from S1 list plus:
- `_evryn-meta/docs/hub/detail/gatekeeper-approach.md` — gatekeeper operational playbook (was missing from S1)
- `_evryn-meta/docs/research/learning-levels-and-instrumentation.md` — three-level learning framework, reasoning traces, feedback quality tiers
- `evryn-backend/docs/BUILD-EVRYN-MVP.md` — full read
- `evryn-backend/docs/ARCHITECTURE.md` — pipeline design, memory architecture, approval gate sections
