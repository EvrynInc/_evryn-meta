# ADR-037: Dev/Staging DB + Oregon/us-west-2 Region Conformance + Supabase Pro + Backup Model

**Status:** Accepted — 2026-06-04. Executed on the DB side (prod migrated, dev seeded); production cutover pending (AC0's coordinated deploy).

**Deciders:** Justin + AC1 (the "dev-DB exploratory committee," chartered by AC0's brief `docs/sessions/2026-06-03-dev-db-committee-brief-for-ac1.md`).

---

## Context

The committee was chartered to investigate standing up a **dev/staging database** separate from production (deferred Phase 0d), because once Mark's real data lands there is **no safe surface to rehearse migrations or risky changes** — building one during a live incident is the failure mode that ends the pilot. Investigation surfaced two larger problems:

1. **Region mismatch.** Prod Supabase lived in **us-east-1** while the Railway backend runs in **us-west-2** — every DB call (several per Evryn turn) made a cross-country round trip. Region can't be changed in place; the only fix is migrate to a new project. The cheapest moment to do that is *now*, while prod holds only test data (real-Mark wiped).
2. **Backups were not restorable.** The committed `backups/*.json` "dumps" were a descriptive column *inventory* (no DDL, comments, RLS, functions, extensions) — they could not rebuild the database. The Free plan had no automated backups either.

The Free plan also caps an org at **2 active projects** (prod + the Agents dashboard DB already filled it), so a third (dev) project required a paid plan.

## Decisions

1. **Upgrade the Supabase org to Pro** (~$45/mo all-in: $25 base + a Micro instance per project − $10 credit, across 3 projects). Pro unlocks the project cap **and** turns on automated daily backups.
2. **Conform region to Evryn Product (West Coast) (`us-west-2`)** — co-located with Railway (kills the cross-coast tax), correct for the Seattle launch and the v0.3 real-time web app. **Migrated prod East→Oregon/us-west-2** via a real `pg_dump` restore into a new project, **verified a faithful, UUID-preserving copy** (identical rows, grants, RLS, policies, all column comments).
3. **Dev/staging = a separate Supabase project** (`Evryn Product — Dev`, Oregon/us-west-2), **not** a Supabase branch (a branch is its own billed instance anyway and forces a git/migrations workflow we don't use). Seeded as a faithful mirror of prod.
4. **New backup model (two layers):** Supabase Pro **automated daily backups** (primary, 7-day retention) + periodic real **`pg_dump`** snapshots (portable + long-term archival, covering the ">retention-window" corruption case). This **replaces** the descriptive-JSON dumps. At v0.3+ scale, data-bearing dumps move to encrypted cloud storage, not git.
5. **Dropped the deprecated `emailmgr_queue` table** during migration (it carries zero query load; the migration was the clean moment).
6. **Runtime keys:** use the **legacy `service_role` JWT** (drop-in match for the existing backend); the new `sb_publishable_`/`sb_secret_` key system is deferred to a later deliberate task.

## Consequences

- **Three Supabase projects (all in the Pro org):** `Evryn Product` (Oregon/us-west-2, prod, ref `wvaaqwapueycyxyhxdnh`), `Evryn Product — Dev` (Oregon/us-west-2, dev, ref `maqkdesopsskptpxjbqs`), `Evryn-Agents` (us-east-1, dashboard DB, ref `hpqglvctjcdqoepzrifq`). ~$45/mo.
- **Old East prod** (`maruxkjwlfltlmureqkt`) stays live as the rollback net and is **retired after the cutover** is health-checked. Its faithful `pg_dump` (`evryn-backend/backups/full-public-2026-06-03.sql`) is the archive.
- **The cutover** — Railway env (`SUPABASE_URL`/`SUPABASE_SERVICE_KEY`) repointed to Evryn Product (West Coast), the ADR-036 migration applied to **Oregon/us-west-2** (not East), `railway up`, health-check, then retire East — is owned by **AC0's coordinated deploy**, not this committee.
- **`evryn-backend/.env` shape:** runtime uses one `SUPABASE_URL` + one `SUPABASE_SERVICE_KEY` (= Evryn Product (West Coast)) + the org-level `SUPABASE_ACCESS_TOKEN`. Admin/tooling DB connection strings are `SUPABASE_DB_URL_PROD` / `_DEV` / `_EAST`. The runtime only ever talks to prod; dev is reached only by admin tooling (pg_dump/psql). Dev project API creds live in Bitwarden (not active `.env` lines) for future QC live-testing.
- **Whose job changes** (the "tell everyone whose job changes" requirement):
  - **DC:** schema migrations are now **dev-first** — write → apply to dev (`SUPABASE_DB_URL_DEV`) → verify → apply the same SQL to prod at a coordinated deploy. Backups are now real `pg_dump`s, not JSON.
  - **QC:** can now run **live tests against the dev DB** (a real capability gain — previously limited to static review + no-DB tests).
  - **OC:** owns dev/prod infra + the deploy flow (when active).
- **The Agents DB region/role is an open question** tied to the team-autonomy harness decision (Mastra vs. Vercel Agent, EVR-111) — flagged in the meta-meeting doc; deliberately left untouched for now.

## Migration artifacts

`evryn-backend/backups/` (2026-06-03): `full-public-…sql` (faithful schema+data dump = the archive), `schema-public-…sql` (schema-only), `replicate-to-oregon-…sql` (the restore script: extensions + schema + data, queue dropped). pg_dump/psql via the PostgreSQL 17 client tools; dumps taken over the Session pooler.

## Alternatives considered

- **Free second org for the dev project ($0):** rejected — leaves the prod backup gap open and splits orgs; Justin chose simplicity + uniform fortification at $45/mo.
- **Supabase branching for dev:** rejected — a branch is its own billed instance (no savings for a persistent staging DB) and forces a GitHub/migrations workflow we don't use.
- **Local Docker Supabase:** rejected as *the* staging surface — local-only (Railway/QC can't reach it); fine as a supplemental dev tool.
- **PITR add-on ($100/mo):** not warranted at current scale; daily backups suffice.
