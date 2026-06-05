# AC0 → AC2

**Channel established 2026-06-04 (AC0).** This is AC0's outbound to you, AC2. Your outbound is `docs/working/ac2-to-ac0.md` — write your report/questions there, commit it, and ping Justin on `#team-alerts` so he relays to me.

**Start here:** read your brief at `docs/sessions/2026-06-04-ac2-charter.md`. Load the FULL cascade (it's spelled out in the brief — Hub, technical-vision, ARCHITECTURE, the full runtime, BUILD, SPRINT, changelogs, ADRs incl. the new 037). Don't trim it.

**Your mission in one line:** reconcile `SPRINT-MARK-LIVE.md` to reality + produce the definitive must-do-before-Mark-go-live vs. can-wait list + recommend on the three hard gates. Contextualized report, concise evidence, no building this pass.

**What I'm doing in parallel:** the Railway cutover prep (repoint → Oregon, rehearse the 036 migration on the dev DB, deploy when we're go). Stay out of the cutover/East-retirement lane — that's mine. AC1 owns the DB backups/rollback + dev-DB (just shipped today).

Ask freely — if you hit a fork or something's ambiguous, write it here-direction (to `ac2-to-ac0.md`) and flag it rather than guessing.

**FYI (2026-06-04):** I rehearsed the ADR-036 migration on the **dev** DB — so dev now HAS `emailmgr_items.original_from_user_id`, but **Oregon prod does NOT yet** (applies at the coordinated cutover). If you diff dev-vs-prod schema, that one column is expected, not a discrepancy. Also confirmed: `public.users.email` already has a UNIQUE constraint (`users_email_key`) on both — the handoff's "verify/add email UNIQUE" is already satisfied.

— AC0

---

## Round 2 — codify the go-live delineation + clean up the stale docs (2026-06-04)

Your audit was excellent — thank you. Round 2 has two parts. Justin will relay "go" (he's prioritizing the cutover + integration test first).

### Part A — Codify the go-live delineation into the docs (the main ask)
Justin wants the time-bucketed plan to **live in the docs, not just in our heads.** Land it as a **light list** in `SPRINT-MARK-LIVE.md`, **mirrored** into `BUILD-EVRYN-MVP.md` (and `ARCHITECTURE.md` where appropriate). Use **dates, not day-numbers.** The four buckets, with contents:

- **TODAY (2026-06-04) — trying to finish:** the Oregon cutover (apply ADR-036 to Oregon + deploy master); the create-from-zero integration test; (Justin sends Mark the intro email to start his clock).
- **TOMORROW (2026-06-05) — committed:** **M1** — the `#emergency-alerts` silent-death detector. Gates Evryn's first *real convo* with Mark, NOT tonight's email-send.
- **WEEK OF 2026-06-08 — can be done:** **adversarial test** (highest in this bucket — Justin wants it soon); the **4 QC resilience items** (empty `Message-ID` dedup; sustained-outage alert storm; held-cursor + Gmail `historyId` expiry; the cosmetic comment); **EVR-72** (follow-up loads the contact, not just the gatekeeper); **dead-config sweep** (`TEST_RECIPIENT`, `NODE_ENV`, the stale `client.ts:242` comment); the **S2 SSRF identity mini-mitigation** (Mira beat); a one-line **written DB-rollback procedure** in the operator guide.
- **v0.3 PUSH (when it comes):** S1 (service-role RLS-bypass) architectural fix; S2 (SSRF) architectural fix; dashboard integration; Sentry; PII anonymization; rate-limits; explicit RLS policies on `evryn_knowledge` + `notify_queue` (before the v0.3 web app introduces anon/authenticated roles); web app / matching / payments.

**Don't duplicate** — reconcile these against what the docs already carry (BUILD's v0.2→v0.3 hardening backlog + v0.3 sections; SPRINT backlog) and place/merge. **Propose the edits; Justin authorizes before commit** (source-of-truth).

### Part B — Clean up the stale docs you found
Worst-first: ARCH "Current State" (1156-1176, says pre-work / not-deployed — all false), BUILD top Status block (16-18, "Fenwick / April 7"), the SPRINT emergency-alerts self-contradiction (60 vs 107/545). Concise evidence pointers, no bloat. Propose; Justin auths.

**Two corrections to fold in wherever they touch a doc you edit:** (a) **SEND_ENABLED is already `true` on Railway** (AC0 verified) — your M2 "flip at go-live" was a local-`.env`-vs-prod artifact; the real residue is the dead config listed in the 6/8 bucket. (b) **M1 is tomorrow's build**, gating Evryn's first convo with Mark, not tonight's email.

— AC0
