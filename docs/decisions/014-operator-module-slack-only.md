# ADR-014: Operator Module — Slack Only (v0.2)

**Status:** Accepted
**Date:** 2026-03-02
**Participants:** Justin + AC

## Context

Evryn has an operator module — the "kitchen pass" that gives Justin admin access (see users by name, review classifications, issue overrides). The question: which channels should be able to trigger operator mode?

Justin can reach Evryn through two channels today: email (Gmail) and Slack. Both can authenticate him. But authentication alone isn't the question — the question is which channel is secure enough for admin access to user data.

## Decision

**Only Justin's verified Slack user ID loads the operator module.** Email from Justin goes through the normal conversation module. Evryn knows who she's talking to (she recognizes Justin's email address), but the kitchen door stays closed.

## Reasoning

**Why Slack is more secure for operator access:**
- Slack authenticates via OAuth with verified user IDs (SOC 2 compliant)
- Email is more vulnerable: header forgery, spoofing, prompt injection in forwarded bodies
- The operator module contains the highest-privilege capabilities — it deserves the highest-security channel

**The nuance:** If Justin emails evryn@evryn.ai, Evryn can be warm and conversational. She recognizes him. But she operates in conversation mode, not operator mode. "She knows who she's talking to, but the kitchen door stays closed unless you come in through Slack."

**At scale (v0.3+):** Could add a custom internal app with 2FA/hardware key for operator access. Slack is sufficient for a single-operator MVP.

## How to think about this

The security model is structural, not instructional. The trigger script (code) decides whether to load the operator module based on the channel and verified identity. Evryn herself never makes this decision — the code already made it before she wakes up. A prompt injection in a forwarded email cannot reach operator mode because the code never loaded it into her context.

## References

- Session doc: `docs/sessions/2026-02-24-pre-work-6-session-1.md` (Session 3 Decision 1)
- Trigger composition: ADR-012
