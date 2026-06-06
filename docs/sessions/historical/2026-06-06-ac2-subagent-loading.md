# Session — 2026-06-06 (AC2): Subagent loading hardening

**How to use this file:** Ephemeral session record. The durable outputs are already absorbed — orchestration changes into `docs/protocols/ac-orchestration-protocol.md` + DC/QC CLAUDE.mds, the pattern into `AGENT_PATTERNS.md`, the summary into `CHANGELOG.md`. This doc exists to (a) hand the UNVERIFIED bug candidates to AC1, and (b) record the don't-split-QC decision. Delete once AC1 has absorbed the candidates.

---

## What we did

Made subagent startup loading reliable and standardized. Full detail in the protocol + CHANGELOG; the shape:

1. **Standardized the term** "Startup Context Cascade" across AC/DC/QC CLAUDE.mds + the protocol (was three different names; the protocol pointed at none of them).
2. **Binary loading rule + `#cascade-override`.** DC/QC load the full cascade every trip unless the brief carries the literal token `#cascade-override` + an explicit file list. Natural-language framing is explicitly not authorization. The override is the guard-railed escape hatch for genuinely-self-contained or corrupted-part-to-isolate cases (near-never).
3. **"Read and faithfully follow"** is the trigger phrasing that actually makes a subagent load (vs "read," which just reads).
4. **Dropped belt-and-suspenders** cascade enumeration (the binary rule does it); AC enumerates only task-specific additions and watches *those* in the receipts.
5. **AskUserQuestion banned** in AC's CLAUDE.md (hangs, silent deadlock).
6. **`Code/evryn.code-workspace`** created so VS Code Source Control shows all repos + worktrees in one window.

## Experiment results (why we believe it works)

6 subagent spins:
- **Baseline (2 spins):** "read and faithfully follow" alone — both DC and QC loaded their cascades cleanly with no file enumeration. Confirmed the mechanism.
- **Bait (2 spins):** a tempting "just check poll.ts / skip the docs" brief — QC skipped ARCHITECTURE.md (rationalized), DC skipped his entire cascade (gated on "build," and the task was framed as a trace). Exposed the seams.
- **Post-hardening (2 spins):** with the binary rule + broadened trigger + override — QC loaded the full set and *cited* "no `#cascade-override` token, so I loaded the full set"; the override spin loaded exactly its scoped list and acknowledged running scoped; DC's confirming spin loaded all three (Hub+ARCH+BUILD) and the docs caught a brief error he'd have missed code-only.

## Decision: do NOT split QC into full-load / trace-load

Considered giving QC a tiered load like AC (full vs "trace"). **Rejected** — keep "load it all." Reasons:
- The AC analogy doesn't transfer: AC tiers because AC *compounds* (reloads every iteration); QC is one-shot, pays the load once. The main economic driver for tiering is absent.
- A standing tier is an escape hatch that gets rationalized into — exactly the corner-cutting we hardened against. We watched QC do it pre-fix.
- `#cascade-override` IS "trace load" done right: the same narrow-load capability, but gated behind AC's explicit, accountable, per-trip decision instead of a standing option.
- Her doc already has the *future* off-ramp (self-scope when the runtime outgrows full-read) — triggered by runtime *size*, not brief *size*.
- Instead: keep load-it-all; **batch her trips** (protocol note added).

## UNVERIFIED bug candidates for AC1 (evryn-backend)

Surfaced from the bait-test subagents' real code reads, but **not verified against source** — AC1 to confirm in build context before routing/Linear. (Some may be already-known or non-issues.)

1. **`checkStaleItems` ignores the Supabase `error` field** — `src/email/poll.ts` ~L374. Destructures `{ data }` only; a query *error* reads as "nothing stale" → stale `pending_approval` items silently never re-ping, no alert. (Silent-failure class; Mark-live relevant — Evryn appears to ghost.)
2. **`findPendingByShortId` swallows DB errors as "none"** — `src/approval/flow.ts` ~L429 (`if (error || !data) return {status:"none"}`). A transient DB error during an `approve <id>` lookup → the approval silently no-ops, no log-level alert / no `notifyDev`. (Mark-live relevant — approval path.)
3. **Send-succeeds-then-record-fails → double-send on re-approve** — `src/approval/flow.ts` ~L354–371. `sendEmail` has no idempotency key; if `createMessage`/status-write throws *after* a successful send, the item stays `pending_approval`, so an operator re-approve passes the guard and sends a *second* email. Violates "safely re-firable."
4. **Cron checkers fail with only `console.error`, no `notifyDev`** — `checkStaleItems` (poll.ts ~L83) and `drainNotifyQueue` (slack.ts ~L323/329). Self-heals against blips (hourly retry) but no meta-alert if a checker is persistently down → stale items never re-surface, silently.

**Already known / not new (don't chase):** empty-`Message-ID` dedup fail-open at `process.ts:90` (already EVR-71/68); `SEND_ENABLED=false` "confirmed-but-not-sent" (test guard; `true` in prod).

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
