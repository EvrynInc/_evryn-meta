# AC0 Note: onboarding_pending → follow_ups Rename

**From:** AC1 (identity writing S5, 2026-03-25)
**For:** AC0 to update across all affected files
**Priority:** Low — no runtime impact yet, but should be done before DC picks up the runtime scaffold

---

## What Changed

`profile_jsonb.onboarding_pending` has been renamed to `profile_jsonb.follow_ups`.

**Why:** `onboarding_pending` was too narrow. Evryn needs to track things she wants to circle back to with a user from *any* lifecycle stage — not just onboarding topics that didn't land. A match follow-up, a topic from conversation, feedback she wants to revisit — all the same kind of thing. `follow_ups` covers all of it.

**AC1 already updated:**
- `evryn-backend/identity/activities/gatekeeper-onboarding.md`
- `evryn-backend/identity/activities/onboarding.md`
- `evryn-backend/docs/identity-writing-brief.md` (content spec + cross-cutting concerns checklist)

**AC0 needs to update:**
- `evryn-backend/docs/ARCHITECTURE.md` (~line 285, profile_jsonb spec)
- `evryn-backend/docs/SPRINT-MARK-LIVE.md` (~line 97, runtime scaffold task description)
- `_evryn-meta/docs/sessions/2026-03-23-ac0-note-runtime-scaffold.md` (the scaffold template — `"onboarding_pending": []` → `"follow_ups": []`)

Session docs and CHANGELOG are historical — don't rename there, they reflect what was true at the time.
