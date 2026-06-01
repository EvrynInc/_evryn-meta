# AC0 Handoff — 2026-06-01 evening

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.

**From:** AC0 (the instance that ran Monday 2026-06-01 — rewrote ADR-036 after Justin caught a cross_user_notes misframing, stood up the QC repo (CLAUDE.md + first-trip brief), restructured AC's CLAUDE.md startup cascade, wove QC into AC and DC's CLAUDE.md, prepared DC3's next-trip brief)
**To:** Fresh AC0 (Tuesday or whenever Justin spins fresh)
**Date:** 2026-06-01T16:16:41-07:00
**Status:** All changes committed and pushed. Three feature branches still pending merge (Mira, Soren, DC3 review). QC repo exists as files but not yet `git init`d. DC3's mailbox has his next trip queued.

---

## TL;DR — where Evryn is right now

**v0.2 / Wave 3 still LIVE on Railway** (deploy `4e79b834`, commit `05bd1ff`). Pre-Mark-live position unchanged from Friday: 7 runtime items + ARCH rewrite running, three branches awaiting review and merge (Mira's identity bundle, Soren's BUILD-doc v0.3 scope addition, DC3's Wave 3 review). Justin worked through reviews today; Mira is actively editing her PR (removing real-Mark e.g. examples per a review finding); Soren and DC3 are mergeable when Justin gives the word.

**Big architectural work today:** ADR-036 (triage interaction history loopback) drafted, **then rewritten** after Justin correctly caught that I'd misframed cross_user_notes. The correct architecture: emailmgr_items + a new `original_from_user_id` FK column is the substrate; cross_user_notes stays reserved for its proper purpose (connection-feedback, not triage-interaction-history). ADR-036 is **Proposed**; awaits Justin's review.

**QC stood up.** Repo at `c:/Users/Justin/Evryn/Code/evryn-quality/` — CLAUDE.md + first-trip brief + minimal repo scaffolding (settings.json, README, .gitignore, mailboxes). **Not yet `git init`d or pushed to GitHub** — Justin's hand needed. First-trip brief: silent-failure + correctness audit on the post-Wave-3 runtime.

**AC's CLAUDE.md restructured.** New tiered startup cascade (light vs. full product-architect cascade) with explicit "this is a heavy load — Justin chose it" framing. Plus a new "Working with QC" section, plus commit-before-mail rule with explicit pre-authorization language.

**DC's CLAUDE.md got** the QC-cadence expansion + the commit-before-mail rule.

**DC3's next-trip brief is ready** at `evryn-backend/docs/ac-to-dc.md` — CONCERN 1 fix + CONCERN 3 hardening + ADDITIONAL FIX (quiet-hours queue+replay + cron-hour conform) + optional CONCERN 5. Justin to tell DC3 when ready to dispatch.

---

## What's pushed, what's pending merge, what's pending Justin's hand

### Pushed and committed this session

- **`_evryn-meta`**: ADR-036 (rewritten), AC CLAUDE.md (restructured startup + Working with QC + commit-before-mail), this handoff doc.
- **`evryn-dev-workspace`**: DC CLAUDE.md (QC-cadence line expansion + commit-before-mail).
- **`evryn-backend-ac`** (master): DC3 next-trip brief in `docs/ac-to-dc.md`.

### Pending merge (three feature branches on `evryn-backend`)

- **`mira/2026-05-29-pre-mark-bundle`** — Mira's identity bundle (gatekeeper-onboarding rewrite + operator.md + core.md). She was actively editing today (removing real-Mark `e.g.` examples per AC0's review finding). When her edits land and she pushes the cleanup commit, mergeable.
- **`soren/build-doc-linear-tickets`** — Soren's BUILD doc v0.3 scope addition (Evryn writes Linear tickets about her own runtime). Clean, mergeable. Justin reviewed; ready to merge.
- **`dc3/wave3-review`** — DC3's review of DC1's Wave 3 work (43 lines added to `docs/dc-to-ac.md`). Trivial doc-only merge; ready.

### Pending Justin's hand

1. **Tell DC3 he has mail** at `evryn-backend/docs/ac-to-dc.md`. Three required fixes + one optional. Brief is self-contained; DC3 spins from his worktree.
2. **`git init` evryn-quality + push to GitHub** when ready to spin QC. The repo content is ready (CLAUDE.md is substantive; first-trip brief is rich).
3. **Spin QC** with the brief at `evryn-quality/docs/ac-to-qc.md` after the repo's on GitHub.
4. **Mira fictional-example swap** in her gatekeeper-onboarding script — she's on it. After her cleanup commit lands, she can request merge.
5. **Three PR merges** — Mira (after cleanup), Soren (anytime), DC3 review (anytime).
6. **Slack per-channel notification config** (Justin's client-side task — `#evryn-approvals` and `#dev-alerts` follow night schedule; `#emergency-alerts` always notifies).
7. **Railway env var update** `PROACTIVE_CHECK_HOUR_PT=7→8` *after* DC3 ships the ADDITIONAL FIX.
8. **ADR-036 review** when Justin has bandwidth. Status: Proposed. Implementation routing not yet dispatched (depends on ADR going Accepted).

---

## What changed in CLAUDE.md today (and why a fresh AC0 needs to know)

### AC's CLAUDE.md — restructured SESSION STARTUP into tiered cascade

The Hub used to be buried in "What Is Evryn?". The "Always read tech-vision + ARCH" rule used to be in Context Discipline. The new runtime-load rule didn't exist. **All three are now in SESSION STARTUP** as a tiered cascade:

- **Light cascade (every session):** CLAUDE.md + current-state.md + Hub.
- **Full product-architect cascade (when doing or directing product build work):** above + technical-vision + ARCHITECTURE.md + active build doc (named in current-state.md, currently BUILD-EVRYN-MVP.md) + the `evryn-backend/src/` runtime.

**The full cascade is a heavy load — Justin has explicitly chosen this.** Don't trim it on your own judgment. The bet: cost of going in blind > cost of the load. See the rationale in the CLAUDE.md.

**For non-product work** (cross-repo ops, doc routing, team coordination, strategic chat) the light cascade suffices. Don't burn tokens on the full cascade for an org-layer question.

**The active build doc is named in current-state.md.** Currently `evryn-backend/docs/BUILD-EVRYN-MVP.md`, but this WILL change as build phases shift. Read `current-state.md` first to find out — don't hardcode the assumption that BUILD-EVRYN-MVP.md is still the active one.

### AC's CLAUDE.md — new "Working with QC" section

Right after AC/DC Communication Protocol. Covers the standing cadence (DC ships → QC reviews → AC routes → DC fixes → QC verifies), when to dispatch QC vs. AC-reviews-themselves, and the don't-over-rely-on-QC rule (DC still reviews own work; QC is the backstop).

### AC + DC + QC CLAUDE.md — commit-before-mail rule, pre-authorized

Added to all three:

> "Always commit your outbound mailbox message immediately after writing it. **This is the one area where you do NOT need to wait for Justin's explicit go-ahead — he has pre-authorized all mailbox-file commits.** Without committing, a recipient who reads + clears + commits the clear before you push leaves your message recoverable only from your local working tree."

This is the pre-existing AC↔DC commit exemption, but written more explicitly so future instances don't accidentally hesitate.

### DC's CLAUDE.md — light QC awareness expansion

The QC line in "Other entities" got expanded to name the cadence + the "QC is a second pair of eyes, not a substitute for your own care" framing + the "AC's call on dispatch" rule.

---

## The cross_user_notes correction — DO NOT REPEAT

**Critical:** my first ADR-036 draft proposed writing closure notes to Eva's `cross_user_notes` column. **That was wrong.** Justin caught it.

The correct understanding (per ADR-027 Decision 3 + `evryn-backend/identity/internal-reference/feedback-guidance.md` + `src/triage/classify.ts:560` tool description):

`cross_user_notes` is for **third-party feedback about a user from another user, in the context of connections Evryn mediated** — e.g., *"Mark gave Evryn feedback that Eva flaked on their connection."* It's BLIND WRITE, UUID-only, structurally firewalled from `buildPersonContext`, and reserved for v0.3+ Reflection processing (which loads the raw note + reporter's story-at-time and distills sanitized insights into the subject's `story`).

It is **NOT** for general triage-interaction history (forwards, classifications, outcomes). That data already lives in `emailmgr_items`; the triage interaction layer is the `emailmgr_items` table + a missing FK column from `original_from` (text) to `users.id` (UUID).

ADR-036 was rewritten to use `emailmgr_items` + a new `original_from_user_id` FK as the substrate. Read the rewritten version.

**Don't repeat the misframing.** When you reason about cross-user data, ask first: *"is this connection-feedback (Evryn mediated, then user gave feedback) or interaction-history (Evryn observed, no mediation)?"* The two have different homes.

---

## Critical path to Mark-live (unchanged from Friday)

1. Review + merge Mira's PR (after her real-Mark-example cleanup commit lands).
2. Review + merge Soren's PR.
3. Review + merge DC3's review PR.
4. **Tell DC3 his next-trip mail is ready.**
5. DC3 ships CONCERN 1 + CONCERN 3 + ADDITIONAL FIX.
6. Justin updates Railway env var `PROACTIVE_CHECK_HOUR_PT=7→8`.
7. Justin configures Slack per-channel notification schedules.
8. **`git init` evryn-quality + push to GitHub.**
9. Spin QC with first-trip brief.
10. QC's silent-failure + correctness audit returns findings.
11. AC routes fix-trip brief to DC based on QC findings.
12. DC ships QC's findings.
13. Re-run integration test top-to-bottom through Phase 5.
14. Pre-Mark-live STEP 0 cleanup (kill test-Mark UUID + create fresh real-Mark + clear inboxes + visual verify).
15. Justin sends Mark the go-email.

---

## Where everything lives

### Repos + worktrees (unchanged from Friday)

- `_evryn-meta` — on main. AC's home.
- `evryn-backend` — local working tree at `c:/Users/Justin/Evryn/Code/evryn-backend` is on `mira/2026-05-29-pre-mark-bundle` (Mira's tree).
- `evryn-backend-ac` — AC's worktree at `c:/Users/Justin/Evryn/Code/evryn-backend-ac` on master. **Use this for AC operations in evryn-backend.**
- `evryn-backend-soren` — Soren's worktree at `c:/Users/Justin/Evryn/Code/evryn-backend-soren` on `soren/build-doc-linear-tickets`.
- `evryn-backend-dc3` — DC3's worktree at `c:/Users/Justin/Evryn/Code/evryn-backend-dc3` on `dc3/wave3-review`.
- `evryn-dev-workspace` — on main. DC's home.
- `evryn-team-workspace` — on main. Team's home.
- **`evryn-quality` — exists as a local directory, NOT a git repo yet.** Justin to `git init` + push when ready to spin QC.

### Today's session docs + briefs

- **This handoff doc** — `_evryn-meta/docs/sessions/2026-06-01-ac0-evening-handoff.md`.
- **Yesterday's packout** archived to `_evryn-meta/docs/sessions/historical/2026-05-30-ac0-monday-handoff.md`.
- **The live session doc carrying lists** (DC list, Mira pile, v0.3 deferred questions) — `_evryn-meta/docs/sessions/2026-05-28-integration-test.md`. Still relevant for context on Wave 3 origin.

### ADRs touched this session

- **ADR-036 — Triage Interaction History Loopback (v0.2 calibration phase)** — `_evryn-meta/docs/decisions/036-cross-user-interaction-loopback.md`. **Proposed**, awaiting Justin's review. Rewritten 2026-06-01 after the cross_user_notes correction. Three components: createUser MCP tool + runtime auto-creates Eva in processForward + `original_from_user_id` FK column. Plus a Mira identity beat on triage.md Phase 2.

### CLAUDE.md updates landed this session

- **AC CLAUDE.md** (`_evryn-meta/CLAUDE.md`): SESSION STARTUP restructured into tiered cascade (light vs. full product-architect); new "Working with QC" section; commit-before-mail rule added with pre-authorization language; redundant Hub/tech-vision/ARCH instructions trimmed from "What Is Evryn?" and Context Discipline (absorbed into the cascade).
- **DC CLAUDE.md** (`evryn-dev-workspace/CLAUDE.md`): QC line in "Other entities" expanded with cadence + "QC is backstop, not substitute" framing; commit-before-mail rule added.
- **QC CLAUDE.md** (`evryn-quality/CLAUDE.md`): created fresh, then substantively revised based on a subagent evaluation. Major sections: tiered auto-load, Mark stakes / current operational stakes, "Failures this role exists to catch" historical patterns, severity rubric (BLOCKER/NON-BLOCKER/COSMETIC/SUSPECTED), Observability & Ground Truth, full AC-style commit discipline, mailbox protocol with commit-before-mail.

### Linear tickets touched this session

None this session. The DC3 next-trip routing, ADR-036 implementation routing, QC standup, etc. are all in mailboxes / CLAUDE.md / current-state — no Linear tickets needed yet.

---

## Open decisions waiting for Justin

1. **Approve / route DC3's next-trip mail** (when ready). Brief at `evryn-backend/docs/ac-to-dc.md`. Spinning DC3 — Justin's call.
2. **ADR-036 review.** Rewritten with corrected cross_user_notes understanding. Once Accepted, AC0 writes the DC implementation brief + Mira identity brief.
3. **`git init` evryn-quality + push to GitHub.** Files are ready; needs Justin's hand for the repo creation.
4. **Spin QC0** with first-trip brief (after repo is on GitHub).
5. **Three PR merges** in evryn-backend (Mira after her cleanup, Soren anytime, DC3-review anytime).
6. **Slack per-channel notification config** (client-side task).
7. **Railway env var update** `PROACTIVE_CHECK_HOUR_PT=7→8` after DC3 ships ADDITIONAL FIX.

---

## Startup load for fresh AC0

**The new tiered cascade in CLAUDE.md handles most of this automatically.** Specifically:

1. **`_evryn-meta/CLAUDE.md`** — auto-loaded. **Has the new tiered cascade structure as of 2026-06-01.** Read SESSION STARTUP carefully to understand the new light vs. full cascade convention.
2. **Light cascade items** (current-state, Hub) — load per CLAUDE.md.
3. **If you'll be doing or directing product work today,** also load the full cascade per CLAUDE.md instructions (tech-vision, ARCHITECTURE, active build doc per current-state.md, the `evryn-backend/src/` runtime).

**Trip-specific must-reads beyond the cascade:**

- **This handoff** — you're reading it.
- **`_evryn-meta/CHANGELOG.md` top entry** — captures what shipped 2026-05-30 evening (Wave 3 + Mira/Soren/DC3 dispatched). I'll write a 2026-06-01 entry as part of the commit set.
- **`_evryn-meta/docs/decisions/036-cross-user-interaction-loopback.md`** — review-ready ADR. Read in full if Justin asks for the review.
- **`evryn-quality/CLAUDE.md`** — read at session start IF you're spinning QC or doing related work. Otherwise on-demand.
- **`evryn-quality/docs/ac-to-qc.md`** — the first-trip brief. Read if dispatching QC.
- **`evryn-backend/docs/ac-to-dc.md` on master** — DC3's next-trip brief. Read if Justin is about to dispatch DC3.

**Trigger-load (only if X):**

- **Reviewing Mira's PR** (after her cleanup commit) → her 3 commits' diffs + 7-item identity-file review protocol at `evryn-team-workspace/shared/protocols/identity-file-review.md`.
- **Reviewing Soren's PR** → his single commit's diff (BUILD-EVRYN-MVP.md addition).
- **Reviewing DC3's review PR** → his single commit's diff (43 lines on `docs/dc-to-ac.md`).
- **Writing DC's implementation brief for ADR-036** → re-read ADR-036 in full + the relevant runtime files (`src/email/process.ts`, `src/db/users.ts`, `src/db/items.ts`) + triage.md identity file.
- **Spinning QC** → re-read QC CLAUDE.md + first-trip brief + any pre-spin coordination with Justin on QC0 designation.

---

## Mid-session disciplines / cooked-context markers from this session

- **The cross_user_notes misframing was the biggest single error today.** I confidently proposed a design that polluted the wrong substrate. Justin caught it via pattern-recognition ("doesn't sound right") + pointed me at grepping. **Lesson: when introducing or extending a structure that other parts of the architecture depend on, grep + read every reference before designing against it.** Don't trust the in-context understanding of a structure that's been around for months. Same discipline applies to ADR-027, ADR-030, ADR-033 etc. — they have specific semantics that may not match your in-context model.
- **The subagent feedback on QC CLAUDE.md was load-bearing.** Spinning a subagent with rich context, having them evaluate from the role's perspective, returned ~30 findings; I applied ~12. The subagent caught the "Mark stakes missing from CLAUDE.md", "tiered auto-load needed", "severity rubric missing", "observability section missing" — gaps I couldn't see from inside the writing. **Lesson: for identity-defining drafts, a subagent role-play eval is worth the spin cost.**
- **Justin caught the CLAUDE.md structure issue.** The Hub was buried in "What Is Evryn?" even though the file said "read this before doing anything else." The mismatch between *what the file said* and *where the instruction lived* was structural — I wouldn't have spotted it from inside the file. Justin's outside-view: "if it's load-bearing, put it where the eye lands." **Lesson for CLAUDE.md and identity-file editing: structural placement matters as much as content. If a rule says X is required, the rule should appear where the eye lands first.**

---

## What you DON'T need to do first thing

- **You do NOT need to commit anything immediately.** Everything from this session is committed and pushed.
- **You do NOT need to spin QC.** Justin's call when to git-init + push the repo + spin QC0.
- **You do NOT need to dispatch DC3.** Justin's call when to tell DC3 he has mail.
- **You do NOT need to re-run the integration test.** Critical-path step 13, way downstream.
- **You do NOT need to write new ADRs.** ADR-036 is the open one; awaits review.

---

## Final coordination notes

- **Ping `#team-alerts` every response** if Justin's running multiple instances (standing discipline carried over from prior sessions). `SLACK_TEAM_WEBHOOK_URL` in `evryn-team-workspace/.env` via Node fetch.
- **Slack pings = attention taps, not the message.** Substance in chat; ping is the "come back here" signal.
- **Per-agent worktree pattern** is established in `evryn-backend`. EVR-110 queued for full per-agent rollout post-Mark.

---

— AC0, 2026-06-01 evening (post-restructure + post-QC-standup + post-ADR-036-correction)

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
