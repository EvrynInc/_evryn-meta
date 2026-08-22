#!/usr/bin/env node
// hooks-coverage.mjs — report (and optionally fix) which repos actually have
// the shared git hooks wired up.
//
// WHY THIS EXISTS, AND IT IS NOT THE OBVIOUS REASON
// ------------------------------------------------
// The pre-commit control-character guard lives in _evryn-meta/.githooks/ and is
// version-controlled, so the HOOK propagates. What does NOT propagate is the
// one line that activates it:
//
//     git config core.hooksPath ../_evryn-meta/.githooks
//
// That is local config, per clone, per machine. So a repo where nobody ran it
// has NO guard -- and there is nothing to notice. No error, no warning, commits
// just sail through unscanned. That is the exact failure shape the guard was
// built to prevent, reappearing one level up in the guard's own installation.
//
// A guard whose COVERAGE is invisible is not a guard you can rely on. This
// script makes coverage a thing you can look at.
//
// USAGE
//   node _evryn-meta/scripts/hooks-coverage.mjs              # report only
//   node _evryn-meta/scripts/hooks-coverage.mjs --install    # set it where missing
//
// Exit code 1 if any active repo is unprotected, so it can gate a check.
//
// Run the report at #sweep, and after any machine switch or fresh clone -- those
// are the two moments coverage silently drops to zero.

import { execSync } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const META = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CODE = resolve(META, "..");
const EXPECTED = "../_evryn-meta/.githooks";
const install = process.argv.includes("--install");

// DYNAMIC enumeration, never a hardcoded list -- a hardcoded list duplicates
// repo-inventory.md and silently omits any repo added after it was written.
// Archived repos live one level down in z.archive/ and are deliberately NOT
// enumerated: they are read-only on GitHub and nothing commits to them.
const repos = readdirSync(CODE)
  .filter((name) => {
    const p = join(CODE, name);
    try { return statSync(p).isDirectory() && existsSync(join(p, ".git")); }
    catch { return false; }
  })
  .sort();

if (repos.length === 0) {
  console.log("  no git repos found — is this being run from the right place?");
  process.exitCode = 1;
}

const unprotected = [];
for (const repo of repos) {
  const path = join(CODE, repo);
  let current = "";
  try {
    current = execSync("git config --get core.hooksPath", {
      cwd: path, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch { current = ""; }           // unset — git exits non-zero, not an error

  if (current === EXPECTED) {
    console.log(`  ✅ protected    ${repo}`);
    continue;
  }

  // A DIFFERENT hooksPath is not the same as an absent one, and quietly
  // overwriting someone's deliberate choice would be its own bug.
  if (current) {
    console.log(`  ⚠️  DIFFERENT   ${repo} — core.hooksPath is "${current}", not "${EXPECTED}". Left alone; decide deliberately.`);
    unprotected.push(repo);
    continue;
  }

  if (install) {
    execSync(`git config core.hooksPath ${EXPECTED}`, { cwd: path });
    console.log(`  🔧 installed    ${repo}`);
  } else {
    console.log(`  🔴 UNPROTECTED  ${repo} — commits here are NOT scanned`);
    unprotected.push(repo);
  }
}

console.log("");
if (unprotected.length && !install) {
  console.log(`  ${unprotected.length} of ${repos.length} repo(s) unprotected. Fix with:`);
  console.log(`      node _evryn-meta/scripts/hooks-coverage.mjs --install`);
  process.exitCode = 1;
} else if (install) {
  console.log(`  Done. Re-run WITHOUT --install to verify — a tool reporting its`);
  console.log(`  own success is not a check.`);
} else {
  console.log(`  All ${repos.length} active repo(s) protected.`);
}
