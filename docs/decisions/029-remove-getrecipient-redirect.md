# ADR-029: Remove the `getRecipient()` Redirect

> **Truncation check:** The last line of this file should read `FULL FILE LOADED`. If you don't see that at the bottom, reload or read in sections until you confirm the complete file.

**Status:** Accepted in principle — implementation pending DC Task 4. Framing reviewed by fresh AC instance.
**Date:** 2026-04-27
**Deciders:** Justin, AC

---

## Context

The original safety architecture for protecting against accidentally emailing real Mark during testing was a two-layer design (per `evryn-backend/docs/operator-guide.md`):

1. **Primary safety layer — `getRecipient()` redirect** in `src/email/client.ts`: when `NODE_ENV !== "production"`, ALL outbound emails redirect to `systemtest@evryn.ai` regardless of intended recipient.
2. **Kill switch — `SEND_ENABLED`**: when false, no emails send at all.

This was sound when real-Mark's email might have been embedded in test data or fixtures. But over time:

- **Real Mark's email is verified absent from codebase + DB** (per current-state, 2026-04-24).
- **Mark's record in DB uses `systemtest@evryn.ai` as the email address** during testing (set 2026-04-27 during integration test prep). Any draft Evryn writes to "Mark" naturally goes to `systemtest@evryn.ai` — no redirect needed.
- **DC Tasks 2 and 3 (in flight) close adjacent risks** the redirect was implicitly hedging — the loop bug (sent drafts polled back as inbound) and Evryn drafting on no-reply / system-noise senders. With those closed, the redirect is no longer load-bearing as a defense against bugs in user-record creation that might surface a real address by accident.
- **The redirect causes a real workflow break:** drafts intended for `review@evryn.ai` (= Justin's alias for reviewing approval drafts) get redirected to `systemtest@evryn.ai` along with everything else. Justin can't see the drafts in his normal review inbox; the entire approval-review workflow is broken-by-design while NODE_ENV=development.

This was discovered today (2026-04-27) when investigating why Justin saw no draft emails during the loop bug — the drafts existed and were being sent, but landed at `systemtest@` instead of his review inbox.

## Decision

**Remove the `getRecipient()` redirect entirely.** After the change, `getRecipient()` returns the intended recipient as-is, always. `NODE_ENV` becomes purely descriptive — no longer a behavioral switch for recipient routing.

The remaining safety layers (which are sufficient):

1. **`SEND_ENABLED` kill switch** — unchanged. When false, no emails send.
2. **Approval gate** — every external outbound goes through Justin on Slack first. Structural, not configurable.
3. **Mark's email = `systemtest@evryn.ai` in the DB** — drafts to "Mark" naturally land at the test address. No redirect needed. When real Mark goes live, his email is updated in the DB at that moment (per `SPRINT-MARK-LIVE.md` Pre-Go-Live Cleanup section: kill test-Mark UUID + create fresh real-Mark record).
4. **DC Task 3 (in flight)** — Evryn gets a no-draft Slack-escalation exit for system-noise senders, closing the "she might draft a reply to a real unexpected sender" risk.

## Consequences

**Positive:**
- The review@ approval workflow works correctly during testing — Justin sees draft emails in his actual review inbox.
- Architecture simplifies — one less layer of behavior tied to an env var.
- Eliminates a fix-on-fix temptation (the alternative was to special-case review@ in the redirect logic).

**Negative / risks:**
- Removes a defense-in-depth layer. If for some reason an unexpected real-recipient address slipped into the system *and* the approval gate was bypassed *and* SEND_ENABLED was on — the email would actually send. Three failures would have to compound.
- If real-Mark's email is ever inadvertently re-introduced into the DB or test fixtures (e.g., during the pre-go-live cleanup, if AC creates the new real-Mark record before fully wiping test-Mark — the order matters), there's no redirect to catch it. Mitigation: the Pre-Go-Live Cleanup checklist in `SPRINT-MARK-LIVE.md` and `operator-guide.md` Go-Live Checklist explicitly require Justin to visually verify squeaky-clean state before wiring real-Mark's email.

**Operational:**
- After DC ships the change, `operator-guide.md` needs updates to remove the redirect references (the "Mark Protection (Safety Layers)" section will be reduced from two layers to one — kill switch only — plus the structural approval gate). Captured as an AC follow-up in the DC mailbox note.

## Related

- DC mailbox `evryn-backend/docs/ac-to-dc.md` — Task 4 in current bundle.
- `SPRINT-MARK-LIVE.md` — Pre-Go-Live Cleanup section (the visual-verification step that this decision relies on as the remaining safety mechanism).
- `evryn-backend/docs/operator-guide.md` — Mark Protection (Safety Layers) section needs updating after DC's deploy.

## Open considerations

- **When to revisit this pattern.** The remaining safety stack (approval gate + DB-controlled recipient + kill switch) holds while three constraints hold: a single gatekeeper, all outbound human-reviewed via the approval gate, and the test recipient being controlled at the database level (Mark's record uses `systemtest@evryn.ai` until pre-go-live cleanup). When any of those relax — multiple gatekeepers, autonomous outbound (e.g., expanded autonomy after trust is established with an operator), or matching against external user data the DB can't constrain — revisit whether a recipient-routing guardrail needs to come back. The v0.3+ equivalent might be an "intended-recipient-must-match-an-allow-listed-record" check rather than a blanket NODE_ENV redirect.

- **Doc-update sequencing.** `operator-guide.md` describes the system as it actually runs (operator-facing reference). It updates *after* the redirect removal ships, not before — docs lag implementation when describing reality. ADRs precede implementation (decision captured at decision time); operator and user-facing docs trail implementation (so they describe what is, not what's planned).

- **What the redirect was originally hedging, beyond "real Mark's email might be in the system."** Two further implicit risks: (1) a bug in user-record creation that surfaces an unexpected real-recipient address (e.g., resolving an inbound sender to a real production address that then gets included in some outbound). The loop-bug fix and the no-reply / system-noise escalation exit (DC tasks shipping alongside this ADR) close the practical pathways for this. (2) misconfiguration during testing that bypasses the kill switch. This remains a real but acceptable risk — `SEND_ENABLED` is a single boolean visible in the Railway env panel, easy to verify before any test session.

---

Truncation canary — DO NOT REMOVE: FULL FILE LOADED
