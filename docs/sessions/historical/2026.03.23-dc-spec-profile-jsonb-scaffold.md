# DC Spec: profile_jsonb Runtime Scaffold

**Origin:** AC1 notes from identity writing sessions (2026-03-23, 2026-03-25)
**Purpose:** Live spec for DC's profile_jsonb initialization task (SPRINT-MARK-LIVE.md, DEFERRED→6)
**Owned by:** AC0 (orchestrator)

---

## Section Status

| # | Section | Status | Notes |
|---|---------|--------|-------|
| 1 | profile_jsonb runtime scaffold | **LIVE — DC spec** | Template below. Updated with `confidence_audit` and `follow_ups`. |
| 2 | story_history → separate table | DONE | Absorbed into ARCHITECTURE.md breadcrumb (v0.3 `story_versions` table). |
| 3 | seen_by_subject → shareable_with_user | DONE | Renamed across all live docs. |
| 4 | Model tier flag | DONE | ADR-020 written. Sprint task in SPRINT-MARK-LIVE.md. |
| 5 | Adversarial testing note | DONE | Protocol at `evryn-backend/tests/adversarial-test-v02.md`. |

---

## 1. profile_jsonb Runtime Scaffold

When the trigger creates a new user record (or when Evryn creates one during triage), `profile_jsonb` should be initialized with this template — not an empty `{}`:

```jsonc
{
  "_meta": {
    "story_hygiene": "Append with date stamps. Never overwrite or compress existing content. Each entry should be rich enough that a future version of you could understand this person from the profile alone.",
    "story_lenses": "Who they are, what they're looking for, how they came to Evryn, what you've observed, what you wonder.",
    "notes_protocol": "notes with shareable_with_user: false — you know this but cannot reference it with the subject. true — safe to reference openly."
  },
  "story": "",
  "notes": [],
  "roles": [],
  "follow_ups": [],
  "confidence_audit": null
}
```

**Why this matters now:** Without the scaffold, Evryn encounters a bare `{}` and has to rely entirely on the identity doc for structure guidance. The scaffold is belt-and-suspenders — if the identity doc isn't fully loaded (compaction, unexpected code path), the data itself tells Evryn how to maintain it.

**Gatekeeper records** additionally get:
```jsonc
{
  "gatekeeper_criteria": {}
}
```

The `gatekeeper_criteria` key is empty until populated during gatekeeper onboarding.

**`confidence_audit`:** Reflection Module output (v0.3) — natural language self-assessment (confident observations, open questions, tensions/contradictions). Rewritten each reflection cycle. Internal only. Initialized as `null`; populated when the Reflection Module comes online. See ARCHITECTURE.md (Reflection Module section).

---

## 2. story_history → Separate Table (v0.3) — DONE

Absorbed into ARCHITECTURE.md: breadcrumb between `story` and `story_history` in profile_jsonb spec pointing to `story_versions` table at v0.3. Naming rationale in `_evryn-meta/docs/research/v03-design/05-memory-scaling.md`.

---

## 3. seen_by_subject → shareable_with_user — DONE

Renamed across ARCHITECTURE.md, BUILD doc, adversarial test protocol. AC1 updated identity files.

---

## 4. Model Tier Flag — DONE

ADR-020 written. Sprint task in SPRINT-MARK-LIVE.md (DEFERRED→6): `classify.ts:263` Sonnet → Opus.

---

## 5. Adversarial Testing Note — DONE

Protocol at `evryn-backend/tests/adversarial-test-v02.md`. Includes shareable_with_user leak test and Opus/Sonnet comparison.
