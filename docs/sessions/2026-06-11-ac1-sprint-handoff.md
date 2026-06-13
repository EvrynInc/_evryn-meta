# AC1 Handoff — 2026-06-11 — Sprint-doc restructure + Phase-6 persistence

> **Truncation check:** the last line should read `FULL FILE LOADED`. If you don't see it, reload.

**From:** AC0 (2026-06-11) — orchestrating the go-live-gate campaign: I'm running the **M1** and **cost pass-stamp** DC builds in parallel right now, and a **Mira identity batch** is being spun alongside you. The **deploy-bundle convergence + reap is mine.**
**To:** AC1 — you own the **sprint-doc restructure** + the **Phase-6 working-doc persistence**, and you **retire the working docs** at the end.

**You are AC1.** Justin runs multiple AC instances now; sign your pings + any doc stamps as **AC1**. Ping `#team-alerts` via Node `fetch` (`SLACK_TEAM_WEBHOOK_URL` in `evryn-team-workspace/.env`, ASCII-only), prefix `AC1:`.

---

## Load first

Light cascade (`_evryn-meta/CLAUDE.md` auto-loads) + `docs/current-state.md` + the Hub. Then, specific to your task:
- **`docs/sessions/2026-06-11-ac0-handoff.md`** — the campaign handoff. Its **"⚠ FIRST TASK — restructure the sprint doc"** section is **Justin's verbatim spec** for what you're building. Read it carefully — it's the spec, not background.
- **`evryn-backend/docs/SPRINT-MARK-LIVE.md`** — the doc you're closing. Read the whole thing, especially **"Go-Live Delineation — three gates by moment"** (Gate A / Gate B / v0.2 Hardening).
- **`evryn-backend/docs/BUILD-EVRYN-MVP.md`** — the v0.2→v0.3 resilience/hardening backlog (items 1-11), the v0.3 hardening (Phase-6 deferred) section, the Status block (needs reconciliation — see below).
- **The two Phase-6 working docs** (`_evryn-meta/docs/working/2026-06-09-phase6-findings.md` + `2026-06-09-phase6-mira-dispatch.md`) — your consolidation sources.
- **`evryn-team-workspace/shared/projects/product/research/2026.06.11 evryn-cost-analysis.md`** — the cost report (the **7-lever table** is the centerpiece; pull the levers into Steps).

You don't need the full runtime for this — it's a doc-consolidation + organization task. Load runtime files only if a specific Step's status is unclear from the docs.

---

## PRIMARY TASK — `SPRINT-V0.2-HARDENING.md` (Justin's spec)

We passed go-live (Mark's "we're ready" email goes out). **Draw the line: close `evryn-backend/docs/SPRINT-MARK-LIVE.md` and create `evryn-backend/docs/SPRINT-V0.2-HARDENING.md`** as the new active build-focused sprint. The **model** is the whole point — it kills the intra-doc drift the current sprint has. The full spec is in the AC0 handoff's FIRST-TASK section; the load-bearing rules:

1. **ONE canonical Steps list, status-driven.** A single master list of **Steps** (modeled on SPRINT-MARK-LIVE's "Build Record Steps 1-6" — Justin's favorite shape). Each Step carries a **status prefix** (`DONE` / `IN PROGRESS` / `TODO` / `BLOCKED`) at the front, **ordered by believed timeline**, **grouped into phases**. **Exactly one entry per thing** — no item in two places. Status is the *only* signal of where we are; when something ships you flip its status **in place** — **never** duplicate into a separate "done" section (that's the exact drift Justin is killing).
2. **A VERY light "Current State" header — with the rules written into the section itself.** Put the rules in the section: *never a list; never mark anything DONE here; 2-4 lines of "what just shipped / in progress / next."* A low-res pointer, not a competing list.
3. **Link back** to `SPRINT-MARK-LIVE.md` at the bottom ("where we came from — the go-live sprint, closed"). Keep the pointer, lose the bloat.
4. **Consolidate INTO the one list, de-dup as you go:** SPRINT-MARK-LIVE's 3-gate Go-Live Delineation (mostly DONE now) + the v0.2 Hardening bucket + Backlog · BUILD's resilience backlog (items 1-11) · the Phase-6 findings + the Mira-dispatch *residue* (see division below) · the **7 cost levers** · **lean-Reflection (v0.2)** · **M1** (Stage 1 / Stage 2) · the **quiet-hours deploy + table-drop + morning-sweep + C2** · the **cache-hygiene pass** · the **gatekeeper-onboarding runbook** · the **v0.2 maintenance plan** · the **adversarial test**. **Reconcile BUILD ↔ sprint:** BUILD keeps v0.3 scope + architecture; the v0.2-hardening *execution* items move to the sprint (one home each).

**Justin reviews the sprint doc personally before you commit it** (content/structure). Align with him on the *shape* before a full draft if anything's ambiguous — he'd rather align then edit than realign after a misaimed rewrite.

---

## The live state your Steps must reflect (so statuses are honest on day one)

These are **in flight right now** — set their statuses accordingly, don't write them as TODO:
- **Quiet-hours rebuild** — BUILT + QC-GO on `dc/quiet-hours-redesign` (pushed to origin by AC02). NOT deployed — rides the go-live bundle. → `IN PROGRESS` (built, awaiting bundle deploy).
- **M1 Stage 1** (emergency channel) — AC0 has a DC building it now (`dc/m1-emergency-channel`). → `IN PROGRESS`. **M1 Stage 2** (which-conditions-fire + process-crash external watchdog + operator-visibility feed) — design arc AC0 drives, needs a fresh-Soren vet → `TODO`.
- **Cost pass-stamp** (deterministic `record_pass`, the ~$8k/mo lever) — AC0 has a DC building it now (`dc/cost-pass-stamp`). → `IN PROGRESS`. The cost **prevent/bound** split: pass-stamp + Mira note-discipline = PREVENT (Gate B); **lean-Reflection** + **cache-1hr-TTL** + **model-tiering** = BOUND (v0.2 Hardening, fast-follow). Tiering + the synthetic cost-validation batch are **post-bloat-cleanup** (don't measure on bloat).
- **Mira identity batch** (Phase-6 dispatch items) — being spun in parallel (`mira/phase6-identity-batch`). → `IN PROGRESS`. **Make this ONE Step** ("Phase-6 identity/voice batch — Mira") rather than 22 loose items; the detail lives in the dispatch doc until it's persisted/retired.
- **DB wipe / create-from-zero** — DONE.
- **Deploy bundle** (quiet-hours + M1 + cost-fix + Mira-identity + morning-sweep + C2 → one deploy → smoke → `notify_queue` drop) — AC0 owns convergence. → a `TODO` Step, blocked on the builds landing.

---

## Phase-6 working-doc division (your persistence job — then you retire both)

Per Justin's model: **AC0 harvests for Mira; you persist the rest; you retire the working docs once we've both picked them dry.**

**What AC0 harvested → the Mira identity brief (`docs/sessions/2026-06-11-mira-phase6-identity-brief.md`):** essentially the **entire `2026-06-09-phase6-mira-dispatch.md`** — all 22 identity/voice items + the rejection-script v1 + the note template (#22, Mira builds it). The **only** held slice is the v0.3 cross-sell line inside item 16's rejection-script. So from the *Mira dispatch doc*, you do **not** need to re-home the identity beats — they're Mira's batch; just represent it as the single "Phase-6 identity batch — Mira" Step.

**What's left for YOU to persist into BUILD/sprint** (the durable backlog homes):
- **The whole `2026-06-09-phase6-findings.md`** — Findings 1-22 are mostly **runtime/architecture** (the bits Mira's beats *don't* cover). Many are already partially reflected in BUILD's resilience backlog (items 9a-l, 10-11) — **reconcile, don't duplicate**: where a finding already has a BUILD backlog entry, make sure it's a Step (one home) and drop the working-doc as the source. Notable ones to make sure land: Finding 1 (supabase_upsert bypasses lifecycle — the *general* fix; the cost pass-stamp only fixes the pass path), Finding 2 (`updated_at` never advances — higher-impact), Findings 6/7 (Gmail quote-collapse + threading — Mark-experience, week-of-6/8), Finding 10 (real auto-forward format validation — go-live setup), Finding 13 (review@ phantom-user skip — cheap, before-invite), Finding 21 (empty-body known-user warm bounce — Justin's design, deterministic). **Note — F15/F16 have Mira-halves now in Mira's batch** (F15 = don't-echo-your-reply-via-notify_slack; F16 = never-fabricate-an-id); you persist only their *runtime* halves — F15's optional `notify_slack`-gating-out-of-`handleOperatorMessage`, and F16's v0.3 `about_user_id`-validation guard — don't re-home the Mira beats.
- **The note template (#22)** as a Step under the cost lever (Mira builds it; you just give it a tracked home).
- **The v0.3 slivers** (cross-sell HOLD; Finding 22 spam capability; etc.) → the BUILD v0.3 sections.
- **The "operator visibility into the live pipeline" open question** (findings doc, end) — pairs with M1 Stage-2's operator-visibility feed. Make it a Step.

**Then retire both working docs** to `_evryn-meta/docs/working/` → `historical/` (or delete — recoverable from git), once you've confirmed everything's persisted and AC0 confirms the Mira harvest is locked. **Check with AC0 (via Justin) before retiring** — don't retire until both of us have picked them dry.

---

## BUILD ↔ current-state reconciliation (light)

Both `BUILD-EVRYN-MVP.md` Status and `_evryn-meta/docs/current-state.md` still frame **"M1 is the one remaining gate."** That's stale — **the cost-fix (pass-stamp) is now a genuine Gate-B gate too** (Justin + AC02 established this 2026-06-11). Reconcile both to name **M1 + the cost pass-stamp** as the two Gate-B gates. Also: current-state's Infrastructure line says **"main is committed but NOT yet pushed"** — that's wrong (everything's pushed; AC0 verified 2026-06-11). Fix that line. **current-state is AC0's file by default this campaign** — propose your edits to it via Justin or coordinate with AC0 so we don't collide; the SPRINT + BUILD docs are yours.

---

## Coordination / mechanics

- **Worktree:** you work the **sprint + BUILD docs on the canonical `evryn-backend` tree (on `main`)** — docs only, no branch switch, **stage explicit paths** (`git add docs/...`, never `git add -A`), commit on Justin's go. The code/identity worktrees (DCs, Mira) are isolated elsewhere, so you won't collide with them as long as you stay on `main` and don't `git checkout`. The working-doc retire happens in `_evryn-meta` (also on `main`, explicit paths).
- **File ownership this campaign:** AC1 = SPRINT (both) + BUILD + the Phase-6 working-doc persistence/retire. AC0 = `current-state.md` + orchestration + the deploy bundle. Coordinate any current-state edits through AC0.
- **Commit discipline:** no commit without Justin's explicit go in his immediately-preceding message. Source-of-truth docs (BUILD, SPRINT) — he reviews the diff at the pause, then you commit on his go.
- **Ping `#team-alerts` as `AC1:` every response.**

— AC0, 2026-06-11

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
