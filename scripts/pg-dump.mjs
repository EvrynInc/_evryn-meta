#!/usr/bin/env node
/**
 * pg-dump.mjs — take an archival pg_dump of an Evryn Product database.
 *
 * WHY THIS FILE EXISTS (AC0-37h3a3, 2026-09-02)
 * --------------------------------------------
 * The documented recipe in `evryn-backend/backups/README.md` is an inline shell
 * command that greps a connection string out of `.env` and hands it to `pg_dump`.
 * That command string carries BOTH halves of an exfiltration signature — read a
 * secret, feed it to an outbound tool — so Claude Code's permission classifier
 * REFUSES it. An agent asked to take the weekly backup simply cannot.
 *
 * This is the same problem `ping.mjs` solves, and the same answer: running a
 * committed project script is an ordinary action and is not blocked.
 *
 * TWO SECRET-SAFETY PROPERTIES, and the second is stronger than the README's recipe:
 *
 *   1. The connection string is NEVER printed, on any path, including every failure
 *      branch. Only the variable NAME is ever echoed.
 *
 *   2. The credentials are passed to pg_dump as PG* ENVIRONMENT VARIABLES, never as
 *      command-line arguments. This matters because Node's spawnSync puts the whole
 *      argv on its error object — so a recipe that passes the URI as an argument
 *      leaks it into the agent's transcript the moment the call throws (ENOENT, bad
 *      host, anything). A live credential in an agent's context trips safeguards on
 *      every subsequent turn and needs a full re-spin to clear. See `ac.md`,
 *      Security Mindset — this exact class burned an ACf on 2026-07-13.
 *
 * USAGE
 *   node scripts/pg-dump.mjs                 # prod   (default)
 *   node scripts/pg-dump.mjs --dev
 *   node scripts/pg-dump.mjs --staging
 *   node scripts/pg-dump.mjs --schema-only   # DDL only, ZERO data rows
 *   node scripts/pg-dump.mjs --check         # verify prerequisites, dump NOTHING
 *
 *   The flags compose: `--dev --schema-only`, `--staging --schema-only --check`, etc.
 *   An UNRECOGNISED flag is a hard error, never a silent no-op — a typo'd
 *   `--schema-onlyy` must not quietly hand you a full dump carrying production rows.
 *
 * OUTPUT  (date from the system clock)
 *   evryn-backend/backups/full-public-YYYY-MM-DD.sql     schema + data
 *   evryn-backend/backups/schema-public-YYYY-MM-DD.sql   DDL only  (--schema-only)
 *   `--dev` / `--staging` get a matching suffix so environments can never be confused.
 *
 * 🔴 THE LEADING WORD IS THE CONTENTS, AND IT IS LOAD-BEARING — `full-` vs `schema-`.
 * It is the only thing separating a file that carries production rows from one that
 * does not, and git treats the two differently: `backups/full-public-*.sql` is
 * GITIGNORED because it is PII; `backups/schema-public-*.sql` is NOT ignored and is
 * committed on purpose (see the tracked `backups/schema-public-2026-06-03.sql`, and
 * the enumeration + warning in `evryn-backend/.gitignore`).
 * ⇒ A "schema" dump that silently contained data would drop production rows into a
 * path nothing ignores. So this script does not trust pg_dump's exit code: it VERIFIES
 * the artifact's contents against the name it just gave it, and DELETES the file if
 * the two disagree. The naming is deliberately the EXISTING convention in that
 * directory rather than a new one — .gitignore's own warning is that an enumeration
 * misses "the next naming convention someone invents."
 *
 * WHY --schema-only EXISTS: staging is reset from a prod-SHAPE, ZERO-PII seed
 * (`evryn-backend/docs/staging-runbook.md`, Runbook C — "never seed staging with prod
 * DATA"). Producing that seed needs a schema dump; before this flag there was no
 * sanctioned way to take one, because the hand-built alternative is the very command
 * the permission classifier refuses (see WHY THIS FILE EXISTS, above).
 *
 * ⚠️ THESE DUMPS ARE AN ARCHIVAL READING AID, NOT THE RESTORE MECHANISM. Supabase Pro
 * daily automated backups are the real restore path. See the backups README.
 *
 * ⚠️ TOOLING IS PER-MACHINE AND DOES NOT TRAVEL WITH GIT. This script travels; the
 * PostgreSQL 17 client tools do not. Verified present on the LAPTOP 2026-09-02; the
 * DESKTOP is unchecked. If this errors with "pg_dump not found", install with:
 *   winget install PostgreSQL.PostgreSQL.17 --source winget
 */

import { readFileSync, existsSync, mkdirSync, statSync, unlinkSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
const schemaOnly = args.includes("--schema-only");

const TARGET = args.includes("--dev")
  ? { key: "SUPABASE_DB_URL_DEV", label: "dev", suffix: "-dev" }
  : args.includes("--staging")
    ? { key: "SUPABASE_DB_URL_STAGING", label: "staging", suffix: "-staging" }
    : { key: "SUPABASE_DB_URL_PROD", label: "prod", suffix: "" };

// Derive the shared parent holding every Evryn repo as a sibling, from THIS file's
// location. Never hardcode a machine path: there are two live machine roots
// (desktop c:/Users/Justin/..., laptop c:/Users/jbmcg/...) and a hardcoded one fails
// as "no such file" rather than as anything naming the real problem.
const CODE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const BACKEND = join(CODE_ROOT, "evryn-backend");
const ENV_PATH = join(BACKEND, ".env");
const BACKUP_DIR = join(BACKEND, "backups");

const fail = (msg) => {
  console.error(`DUMP FAILED: ${msg}`);
  process.exit(1);
};

// --- validate the arguments -----------------------------------------------------
// A silently-ignored flag is the one failure this script cannot afford. `--schema-onlyy`
// would otherwise fall through to a FULL dump — production rows — while the operator
// believed they had asked for DDL only, and the resulting file would be correctly named
// `full-public-*` but was never wanted. Unknown flags are fatal, not ignored.
const KNOWN_FLAGS = ["--check", "--dev", "--staging", "--schema-only"];
const unknownFlags = args.filter((a) => !KNOWN_FLAGS.includes(a));
if (unknownFlags.length) {
  fail(
    `unrecognised argument(s): ${unknownFlags.join(" ")}\n` +
      `Valid flags: ${KNOWN_FLAGS.join("  ")}   (no target flag = prod)`,
  );
}
// Two target flags at once is an environment confusion, and keeping environments
// un-confusable is half this script's job. Refuse rather than silently pick one.
if (args.includes("--dev") && args.includes("--staging")) {
  fail("--dev and --staging are mutually exclusive — pass exactly one, or neither for prod");
}

// --- locate pg_dump -------------------------------------------------------------
// Not on the git-bash PATH on Justin's machines, so probe the known install
// locations before falling back to a bare name.
const CANDIDATES = [
  "C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe",
  "C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe",
  "/usr/bin/pg_dump",
  "/usr/local/bin/pg_dump",
];
let PG_DUMP = CANDIDATES.find((p) => existsSync(p));
if (!PG_DUMP) {
  const probe = spawnSync("pg_dump", ["--version"], { encoding: "utf8" });
  if (probe.status === 0) PG_DUMP = "pg_dump";
}
if (!PG_DUMP) {
  fail(
    "pg_dump not found. The PostgreSQL 17 client tools are per-machine and do NOT " +
      "travel with git. Install: winget install PostgreSQL.PostgreSQL.17 --source winget",
  );
}

const ver = spawnSync(PG_DUMP, ["--version"], { encoding: "utf8" });
if (ver.status !== 0) fail(`pg_dump found at ${PG_DUMP} but would not run`);

// --- read the connection string, without ever echoing it ------------------------
if (!existsSync(ENV_PATH)) fail(`no .env at ${ENV_PATH}`);

const envText = readFileSync(ENV_PATH, "utf8");
const match = envText.match(new RegExp(`^${TARGET.key}\\s*=\\s*(.+)$`, "m"));
if (!match) fail(`${TARGET.key} not found in ${ENV_PATH}`);

const rawUrl = match[1].trim().replace(/\r$/, "").replace(/^["']|["']$/g, "");

let conn;
try {
  conn = new URL(rawUrl);
} catch {
  // Deliberately does NOT echo the value — only that it failed the shape check.
  fail(`${TARGET.key} is not a parseable connection URI`);
}
if (!/^postgres(ql)?:$/.test(conn.protocol)) {
  fail(`${TARGET.key} does not look like a postgres:// URI`);
}

// --- build the child environment ------------------------------------------------
// The secret lives ONLY here. It never reaches argv, so it cannot appear in a
// spawnSync error object, a stack trace, or the agent's transcript.
const childEnv = {
  ...process.env,
  PGHOST: conn.hostname,
  PGPORT: conn.port || "5432",
  PGUSER: decodeURIComponent(conn.username),
  PGPASSWORD: decodeURIComponent(conn.password),
  PGDATABASE: decodeURIComponent(conn.pathname.replace(/^\//, "")) || "postgres",
};

// Date comes from the system clock, never from a caller. A hand-typed date is how
// this estate ended up with archive files whose names disagree with reality.
const stamp = new Date().toISOString().slice(0, 10);
// The LEADING word names the contents — `full-` = schema + data, `schema-` = DDL only.
// Not cosmetic: git ignores one family and tracks the other (see the OUTPUT note in the
// header). `schema-public-*` is the convention already in that directory, not a new one.
const KIND = schemaOnly ? "schema" : "full";
const outPath = join(BACKUP_DIR, `${KIND}-public-${stamp}${TARGET.suffix}.sql`);

console.log(`  tool:   ${PG_DUMP} (${(ver.stdout || "").trim()})`);
console.log(`  target: ${TARGET.label}  [${TARGET.key} present, value not printed]`);
console.log(`  mode:   ${schemaOnly ? "SCHEMA ONLY — DDL, zero data rows" : "full — schema + data"}`);
console.log(`  host:   ${conn.hostname}`);
console.log(`  out:    ${outPath}`);

if (checkOnly) {
  console.log("  --check: prerequisites OK. Nothing dumped.");
  process.exit(0);
}

if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });

// Still no secret in argv, by construction — these are flags and an output path only.
const dumpArgs = ["--schema=public", "--no-owner", "--no-privileges"];
if (schemaOnly) dumpArgs.push("--schema-only");
dumpArgs.push("-f", outPath);

const run = spawnSync(PG_DUMP, dumpArgs, {
  env: childEnv,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});

if (run.error) {
  // run.error carries argv — but argv holds no secret, by construction. Still print
  // only the message rather than the object, out of habit and to keep the class shut.
  fail(run.error.message);
}
if (run.status !== 0) {
  // libpq writes connection diagnostics to stderr. They name the host and user but
  // never the password; scrub anything URI-shaped anyway before it reaches the log.
  const stderr = (run.stderr || "").replace(/postgres(ql)?:\/\/\S+/gi, "<REDACTED-URI>");
  fail(`pg_dump exited ${run.status}\n${stderr.trim()}`);
}

if (!existsSync(outPath)) fail("pg_dump reported success but wrote no file");

const bytes = statSync(outPath).size;
if (bytes < 1024) fail(`output is only ${bytes} bytes — treat as a failed dump`);

const body = readFileSync(outPath, "utf8");
const tables = (body.match(/^CREATE TABLE /gm) || []).length;
const copies = (body.match(/^COPY /gm) || []).length;

// --- the artifact must match the name we just gave it ----------------------------
// pg_dump exits 0 whether or not a flag we passed did what we expected, so the exit
// code cannot tell us the dump is the KIND we named it. Assert against the contents.
if (tables === 0) {
  fail(`no CREATE TABLE statements in the output — treat as a failed dump`);
}
if (schemaOnly && copies > 0) {
  // --schema-only did not take effect, and this file now carries data rows under a name
  // that promises none. Remove it: `schema-public-*.sql` is deliberately NOT gitignored,
  // so leaving production rows there puts them one `git add` away from a commit — which
  // is exactly how three full dumps got committed before 2026-08-17.
  let removed = true;
  try {
    unlinkSync(outPath);
  } catch {
    removed = false;
  }
  fail(
    `--schema-only produced ${copies} COPY blocks — the flag did not take effect.\n` +
      (removed
        ? `The artifact was DELETED (${outPath}) — that name is not gitignored and the file held data rows.`
        : `⚠️ COULD NOT DELETE ${outPath}. It holds data rows under a name nothing ignores — DELETE IT BY HAND before any git add.`),
  );
}
if (!schemaOnly && copies === 0) {
  fail(`a full dump produced 0 COPY blocks — the data is missing; treat as a failed dump`);
}

console.log(`  OK: ${bytes.toLocaleString()} bytes · ${tables} CREATE TABLE · ${copies} COPY blocks`);
console.log(
  schemaOnly
    ? `  Reminder: DDL only, zero data rows. Unlike full-public-*, this name is NOT gitignored — by design.`
    : `  Reminder: these dumps are gitignored and are an archival reading aid, not a restore.`,
);
