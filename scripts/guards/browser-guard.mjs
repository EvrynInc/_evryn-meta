#!/usr/bin/env node
// browser-guard.mjs — the browser is another way into Justin's mail and Drive; close it (review finding 8; build brief 2's
// revised block; DCG-V, 2026-11-18).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// REQUIREMENT: while the counsel-mail guard is in force, no session (attended or not) may point a browser tool at
// mail.google.com or drive.google.com, because the counsel-mail guard only covers the Gmail connector and a lawyer's
// thread is as readable in a Gmail tab. tests/guards.test.mjs FAILS if a navigation there gets through.
//   PreToolUse  (every Claude in Chrome, built-in browser and computer-use tool): any string in the call's input that
//               names either host is DENIED (navigate, open a tab, a script that sets location, a form field).
//   PostToolUse (same tools): a result that names either host as a page's address is REPLACED, which covers a tab that
//               was already open on Gmail before the call (reading its text, its screenshot description, its tab list).
//
// WHAT IT CAN'T SEE: PostToolUse can't block, so a result-side hook that crashes lets that result through (the
// PreToolUse half has onFailure "block"). A screenshot is an image: the model sees pixels, not text, so a Gmail page
// captured by screenshot on a tab that was already open is NOT caught unless the result also names the URL. A person
// approving a browser prompt, or Justin opening the page himself and pasting it in, is outside any hook. Hosts other
// than these two (docs.google.com, a Google Groups mirror, a forwarding service) are not covered: docs.google.com is the
// candidate to add, and it is Nathan's call (Drive documents open there).

import { readStdin, guardLog, preDeny, postReplace, allStrings } from './lib.mjs';

const HOSTS = /(^|[^a-z0-9.-])(mail\.google\.com|drive\.google\.com)(?![a-z0-9-])/i;
// Result side: only a full address (https://mail.google.com...), so a page that merely mentions Gmail isn't withheld. A page
// that LINKS to Gmail with a full address is withheld too: an over-block, accepted, since the alternative is a hole.
const ADDRESS = /https?:\/\/(mail|drive)\.google\.com(?![a-z0-9-])/i;
// Every browser surface, wherever its server sits: Claude in Chrome, the desktop app's built-in browser (also as
// mcp__remote-devices__Claude_Browser__*), and computer use (mcp__computer-use__*, mcp__remote-devices__computer_*), which
// can open a URL too (QCI finding 10). The template's matcher is the same expression; an extra match only over-blocks.
const BROWSER = /^mcp__.*(claude-in-chrome|claude_browser|computer)/i;

// A string that is a web address is judged by its HOST (so example.com/mail.google.com.html passes); any other text
// (a script, a form value) by whether it names either host anywhere.
const GUARDED_HOST = h => /(^|\.)(mail|drive)\.google\.com\.?$/i.test(h);
function names(s) {
  const t = String(s).trim();
  if (/^[a-z][a-z0-9+.-]*:\/\/\S+$/i.test(t) || /^[a-z0-9-]+(\.[a-z0-9-]+)+(:\d+)?(\/\S*)?$/i.test(t)) {
    try { return GUARDED_HOST(new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(t) ? t : `https://${t}`).hostname); } catch { /* not a URL after all */ }
  }
  return HOSTS.test(t);
}

function pre(p) {
  if (!BROWSER.test(p.tool_name || '')) return null;
  const hit = allStrings(p.tool_input).find(names);
  if (!hit) return null;
  guardLog({ guard: 'browser', event: 'pre-deny', session: p.session_id, tool: p.tool_name });
  return preDeny('Browser guard: browser tools may not open Gmail or Google Drive (mail.google.com, drive.google.com), because a lawyer\'s mail would be readable there with no counsel-mail guard in the way. Use the Gmail connector, which the guard covers. Justin reads counsel mail himself.');
}

function post(p) {
  if (!BROWSER.test(p.tool_name || '')) return null;
  const text = typeof p.tool_response === 'string' ? p.tool_response : JSON.stringify(p.tool_response ?? '');
  if (!ADDRESS.test(text)) return null;
  guardLog({ guard: 'browser', event: 'withheld', session: p.session_id, tool: p.tool_name });
  const stubText = '[WITHHELD by the browser guard: this result came from, or names, a Gmail or Google Drive page. Browser tools may not read those; use the Gmail connector, which the counsel-mail guard covers.]';
  return postReplace(Array.isArray(p.tool_response) ? [{ type: 'text', text: stubText }] : stubText);
}

const { payload } = readStdin();
let out = null;
try { out = payload.hook_event_name === 'PreToolUse' ? pre(payload) : payload.hook_event_name === 'PostToolUse' ? post(payload) : null; }
catch (e) {
  guardLog({ guard: 'browser', event: 'ERROR', session: payload.session_id, error: String(e?.message || e).slice(0, 200) });
  if (payload.hook_event_name === 'PreToolUse') out = preDeny('Browser guard: the guard hit an error, so this browser call is refused. Tell the Admiral.');
  if (payload.hook_event_name === 'PostToolUse') out = postReplace('[WITHHELD by the browser guard: it hit an error checking this result. Tell the Admiral.]');
}
if (out) process.stdout.write(out);
process.exit(0);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
