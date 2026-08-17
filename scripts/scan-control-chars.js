#!/usr/bin/env node
/**
 * scan-control-chars.js — find stray control characters in tracked text files.
 *
 * WHY THIS EXISTS
 * ---------------
 * An agent's file-writing instruction travels as JSON, and JSON natively
 * interprets \uXXXX as a character escape. So an agent writing prose that
 * QUOTES an escape sequence emits the real control character instead of the
 * six-character text. The document ends up CONTAINING the thing it was trying
 * to describe.
 *
 * A NUL additionally makes a file BINARY to grep and to git diff — so every
 * text search silently skips it AND REPORTS SUCCESS. The damage hides itself.
 *
 * Found in the wild 2026-08-17: three instances across eight repos, two of
 * them in AC handoffs, all four known cases (including one introduced while
 * writing the fix) occurring while documenting this exact problem.
 *
 * USAGE
 * -----
 *   node scripts/scan-control-chars.js [repoPath ...]     # defaults to cwd
 * Exit code 1 if anything is found, so it can gate a check.
 *
 * NOTE: this file deliberately contains NO literal control character. The one
 * it searches for is CONSTRUCTED, because every authoring path either strips
 * or interprets it. Never retype a control character — build it.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// TAB, LF, CR are legitimate. Everything else below 0x20, plus DEL, is not.
const ALLOWED = new Set([9, 10, 13]);
const NAMES = { 0: "NUL", 7: "BEL", 8: "BS", 11: "VT", 12: "FF", 27: "ESC", 127: "DEL" };

// Real binaries legitimately contain control bytes. .docx/.xlsx are ZIP
// archives — without this exclusion the scan cries wolf, and a check that
// cries wolf gets ignored, which is worse than no check.
const BINARY_EXT =
  /\.(png|jpe?g|gif|pdf|ico|woff2?|ttf|otf|eot|zip|webp|mp4|mov|mp3|wav|docx|xlsx|pptx|bin|exe|dll)$/i;

function scan(repo) {
  let files;
  try {
    files = execSync("git ls-files", {
      cwd: repo, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
    }).trim().split("\n").filter(Boolean);
  } catch {
    console.log(`  [skip] ${repo} — not a git repo`);
    return [];
  }

  const findings = [];
  let scanned = 0;
  for (const rel of files) {
    if (BINARY_EXT.test(rel)) continue;
    let buf;
    try { buf = fs.readFileSync(path.join(repo, rel)); } catch { continue; }
    scanned++;

    if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
      findings.push({ rel, kind: "UTF-8 BOM", at: 0 });
    }
    for (let i = 0; i < buf.length; i++) {
      const b = buf[i];
      if ((b < 0x20 && !ALLOWED.has(b)) || b === 0x7f) {
        findings.push({ rel, kind: NAMES[b] || `0x${b.toString(16).padStart(2, "0")}`, at: i });
        break; // one finding per file is enough to route it
      }
    }
  }
  console.log(`  scanned ${scanned} tracked text files in ${path.basename(repo)}`);
  return findings;
}

const targets = process.argv.slice(2).length ? process.argv.slice(2) : [process.cwd()];
let total = 0;
for (const t of targets) {
  const found = scan(path.resolve(t));
  total += found.length;
  for (const f of found) console.log(`  WARN  ${f.kind.padEnd(9)} ${f.rel} @byte ${f.at}`);
}
if (!total) console.log("  CLEAN — no stray control characters");
process.exitCode = total ? 1 : 0;
