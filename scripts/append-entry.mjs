#!/usr/bin/env node
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// append-entry.mjs: add an entry to a shared file, above its truncation canary, under a lock.
//
//   node _evryn-meta/scripts/append-entry.mjs <file> <entry-file>
//   node _evryn-meta/scripts/append-entry.mjs <file> -        (entry comes from stdin)
//
// WHY THIS EXISTS. A script that reads a whole file, changes it and writes it back drops
// whatever another session wrote in between, and nothing errors. Measured 2026-11-04: three
// such loops writing to one file kept 43 of 600 lines; the same loops holding a lock kept 600
// of 600. The Edit tool doesn't have this problem, because it changes only the matching text
// in the file as it stands on disk. Use the Edit tool, or this script, in a shared file.
//
// It inserts above the last line holding the canary, keeps the file's line endings, and takes
// the lock by creating <file>.lock exclusively. It refuses a file with no canary rather than
// guess where the end is. If the lock can't be had in 30 seconds it exits non-zero, so a
// failed write can't pass for a successful one. A lock older than 2 minutes is treated as left
// behind by a dead session, removed, and reported.

import fs from 'node:fs';

const CANARY = 'Truncation canary — DO NOT REMOVE: FULL FILE LOADED';
const WAIT_MS = 30_000;
const STALE_MS = 120_000;

const [, , file, source] = process.argv;
if (!file || !source) {
  console.error('usage: append-entry.mjs <file> <entry-file | ->');
  process.exit(2);
}

const entry = fs.readFileSync(source === '-' ? 0 : source, 'utf8');
if (!entry.trim()) {
  console.error('append-entry: REFUSED, the entry is empty');
  process.exit(2);
}

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const lock = `${file}.lock`;

const started = Date.now();
for (;;) {
  try {
    fs.closeSync(fs.openSync(lock, 'wx'));
    break;
  } catch (err) {
    if (err.code !== 'EEXIST' && err.code !== 'EPERM') throw err;
    let age = 0;
    try {
      age = Date.now() - fs.statSync(lock).mtimeMs;
    } catch {
      continue; // it was released between the two calls
    }
    if (age > STALE_MS) {
      console.error(`append-entry: removing a stale lock, ${Math.round(age / 1000)}s old: ${lock}`);
      try {
        fs.unlinkSync(lock);
      } catch {}
      continue;
    }
    if (Date.now() - started > WAIT_MS) {
      console.error(`append-entry: FAILED, NOTHING WRITTEN. Could not get ${lock} in 30 seconds.`);
      process.exit(1);
    }
    sleep(5 + Math.random() * 20);
  }
}

try {
  const text = fs.readFileSync(file, 'utf8');
  const at = text.lastIndexOf(CANARY);
  if (at < 0) {
    console.error(`append-entry: REFUSED, NOTHING WRITTEN. No truncation canary in ${file}.`);
    process.exitCode = 1;
  } else {
    const nl = text.includes('\r\n') ? '\r\n' : '\n';
    let body = entry.replace(/\r?\n/g, nl);
    if (!body.endsWith(nl)) body += nl;
    fs.writeFileSync(file, text.slice(0, at) + body + text.slice(at));
  }
} finally {
  try {
    fs.unlinkSync(lock);
  } catch {}
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
