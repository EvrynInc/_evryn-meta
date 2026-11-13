#!/usr/bin/env node
// gmail-guard.mjs — the counsel-mail guard (task T-76; Guards Soren, 2026-11-13).
// Truncation check: the last line of this file should read FULL FILE LOADED.
//
// REQUIREMENT (Justin's Ballot 20, 2026-11-12; Nathan's privileged-material ruling, rule 6): no agent may read the
// body of any message in a Gmail thread that includes an address or domain on the counsel list
// (evryn-team-workspace/shared/projects/legal/counsel-list.md), enforced here, in the tool layer, with tests that
// FAIL if a listed lawyer's body gets through (tests/gmail-guard.test.mjs). Senders, recipients, subjects and dates
// stay readable; every other message stays readable.
//
// WHY A HOOK AND NOT A RULE: a lawyer's advice that reaches the model has likely lost privilege, and that can't be
// undone, so the guard has to act before the model sees text, not after an agent remembers a rule. Gmail returns
// whole threads, so a sender filter can't keep a lawyer's reply out of a thread someone else started.
//
// TWO LAYERS (design §2.2), wired in managed-settings.json for every mcp__claude_ai_Gmail__ tool:
//   PreToolUse  (layer 1, before the fetch): a body-bearing read is DENIED unless this session cleared that thread
//               or message in the last 15 minutes by a METADATA_ONLY read. RAW is always denied.
//   PostToolUse (clearing, and layer 2 after any fetch): a METADATA_ONLY result with no counsel participant clears
//               its ids; ANY result that mentions a counsel address or domain anywhere, or can't be parsed when it
//               carries body text, is REPLACED before the model sees it (updatedToolOutput).
// FAIL CLOSED: any error in the Pre branch denies a body read; any error in the Post branch withholds the result.
// Layer 1's cleared list must be writable by the session's own user, so against a session that forges it, layer 1
// is rule-strength; layer 2 still stops the model seeing what it recognizes. Design §2.3 says what neither catches.

import fs from 'node:fs';
import path from 'node:path';
import { readStdin, loadCounsel, counselHits, preDeny, postContext, postReplace, guardLog, DATA, safeName, now, readJSON } from './lib.mjs';

const P = 'mcp__claude_ai_Gmail__';
const CLEAR_MINUTES = 15;
// Tools that return message text, and the input field naming what they read.
const BODY_TOOLS = { get_thread: 'threadId', get_message: 'messageId', get_draft: 'draftId', download_gmail_attachment: 'messageId' };
const META = 'METADATA_ONLY';

const tool = name => (String(name || '').startsWith(P) ? String(name).slice(P.length) : null);
const ledgerFile = session => path.join(DATA, 'gmail-cleared', `${safeName(session)}.json`);
// cleared: participants checked by a metadata read. bodyChecked: a body read passed layer 2 clean (an attachment
// download needs this: a lawyer's PDF forwarded inside an ordinary message has no counsel participant, and its
// base64 bytes can't be scanned, so only a clean read of the forwarding message's text clears it; review probe B).
function ledger(session) { return { cleared: {}, counsel: {}, bodyChecked: {}, ...readJSON(ledgerFile(session), {}) }; }
function saveLedger(session, l) { fs.mkdirSync(path.dirname(ledgerFile(session)), { recursive: true }); fs.writeFileSync(ledgerFile(session), JSON.stringify(l)); }
const fresh = (map, id) => !!id && map[id] && now() - new Date(map[id]) < CLEAR_MINUTES * 60000;
const isCleared = (l, id) => !l.counsel[id] && fresh(l.cleared, id);

// Does this call return body text? A metadata read doesn't; search_threads does unless its view is metadata or ids.
function bodyBearing(t, input) {
  if (t === 'download_gmail_attachment') return true;
  if (t in BODY_TOOLS) return (input?.messageFormat || 'PLAIN_TEXT') !== META;
  if (t === 'search_threads') return !['THREAD_VIEW_METADATA_ONLY', 'THREAD_VIEW_IDS_ONLY'].includes(input?.view);
  if (t === 'list_drafts') return input?.view === 'DRAFT_VIEW_FULL';
  return false;
}

// The result's text, whatever container the MCP layer used.
function resultText(resp) {
  if (resp == null) return '';
  if (typeof resp === 'string') return resp;
  if (Array.isArray(resp)) return resp.map(b => (typeof b === 'string' ? b : b?.text ?? JSON.stringify(b))).join('\n');
  if (Array.isArray(resp.content)) return resultText(resp.content);
  return JSON.stringify(resp);
}
// Put replacement text back in the same container shape the model would have received.
function reshape(resp, text) {
  if (Array.isArray(resp)) return [{ type: 'text', text }];
  if (resp && typeof resp === 'object' && Array.isArray(resp.content)) return { ...resp, content: [{ type: 'text', text }] };
  return text;
}
const tryJSON = s => { try { return JSON.parse(s); } catch { return null; } };
const idsIn = text => [...String(text).matchAll(/"(?:id|threadId|messageId)"\s*:\s*"([A-Za-z0-9_-]{6,})"/g)].map(m => m[1]);
// Only "id" fields: a message's own metadata names its thread, but clearing that thread would let a body read of the
// whole thread through when nobody checked the thread's other messages (review probe A). So a metadata read clears
// the id it was asked about, plus the ids of the messages it actually returned, and never a threadId found inside.
const ownIdsIn = text => [...String(text).matchAll(/"id"\s*:\s*"([A-Za-z0-9_-]{6,})"/g)].map(m => m[1]);

// A stub that keeps what the rule allows (ids, dates, senders, subjects) and nothing a lawyer wrote.
function stub(text, why) {
  const j = tryJSON(text);
  // Drop every field that can carry what someone wrote; keep the rest (ids, dates, people, subjects, labels).
  const drop = ['snippet', 'plaintextBody', 'htmlBody', 'body', 'raw', 'attachments', 'attachmentIds', 'text', 'content', 'data', 'payload', 'parts'];
  const walk = o => Array.isArray(o) ? o.map(walk) : (o && typeof o === 'object') ? Object.fromEntries(Object.entries(o).filter(([k]) => !drop.includes(k)).map(([k, v]) => [k, walk(v)])) : o;
  const kept = j ? JSON.stringify(walk(j)) : '(the result could not be parsed, so nothing from it is shown)';
  return `[WITHHELD by the counsel-mail guard: ${why}. Bodies, snippets and attachments are removed. Don't try another way to read it; Justin reads counsel mail himself in Gmail. What the rule allows you to see follows.]\n${kept}`;
}

// search_threads: remove the snippet from any thread with a counsel participant, or whose result lists fewer
// messages than the thread holds (the unlisted ones can't be checked). Subjects stay. Returns null if unparseable.
function redactSearch(text, entries) {
  const j = tryJSON(text); if (!j) return null;
  if (j && typeof j === 'object' && !Array.isArray(j) && !Object.keys(j).length) return { text, changed: 0 };   // {} = no results
  const threads = Array.isArray(j) ? j : (j.threads || j.items);
  if (!Array.isArray(threads)) return null;                            // a shape we don't know: withhold (review finding 8)
  let changed = 0;
  for (const th of threads) {
    const msgs = th.messages || [];
    const partial = (th.messageCount ?? msgs.length) > msgs.length;
    if (partial || counselHits(JSON.stringify(th), entries).length) {
      for (const m of msgs) if ('snippet' in m) { delete m.snippet; changed++; }
      if ('snippet' in th) { delete th.snippet; changed++; }
      th.counselGuard = partial ? 'snippet removed: not every message in this thread was listed, so it could not be checked' : 'snippet removed: this thread includes counsel';
    }
  }
  return { text: JSON.stringify(j), changed };
}

function pre(p) {
  const t = tool(p.tool_name); const input = p.tool_input || {};
  if (!t || !bodyBearing(t, input)) return null;                      // allow: nothing to check
  if (input.messageFormat === 'RAW') return preDeny('Counsel-mail guard: RAW format is never allowed (the guard cannot check it). Use METADATA_ONLY, then PLAIN_TEXT once it is cleared.');
  if (!(t in BODY_TOOLS)) return null;                                 // search and list_drafts are checked after, in layer 2
  const { entries, readAny } = loadCounsel();
  if (!readAny) return preDeny('Counsel-mail guard: the counsel list could not be read, so no message body may be opened until it can. Tell the Admiral.');
  const id = input[BODY_TOOLS[t]];
  const l = ledger(p.session_id);
  if (t === 'download_gmail_attachment') {
    if (!l.counsel[id] && fresh(l.bodyChecked, id)) return null;
    guardLog({ guard: 'gmail', event: 'pre-deny', session: p.session_id, tool: t, id });
    return preDeny(`Counsel-mail guard: read this message's text first (messageFormat "METADATA_ONLY", then "PLAIN_TEXT"). Its attachments can be downloaded for ${CLEAR_MINUTES} minutes after its text has been read and found clean, because a lawyer's attachment forwarded inside an ordinary email can only be recognized from the forward's text.`);
  }
  if (isCleared(l, id)) return null;
  guardLog({ guard: 'gmail', event: 'pre-deny', session: p.session_id, tool: t, id });
  const what = t === 'get_draft' ? 'draft' : t === 'get_thread' ? 'thread' : 'message';
  return preDeny(`Counsel-mail guard: read this ${what} with messageFormat "METADATA_ONLY" first. If no listed lawyer is on it, the guard clears it for ${CLEAR_MINUTES} minutes and this read will go through. (For an attachment, read its message with METADATA_ONLY first.)`);
}

function post(p) {
  const t = tool(p.tool_name); const input = p.tool_input || {};
  if (!t) return null;
  const { entries, readAny } = loadCounsel();
  const text = resultText(p.tool_response);
  const body = bodyBearing(t, input);
  if (!readAny && body) return postReplace(reshape(p.tool_response, '[WITHHELD by the counsel-mail guard: the counsel list could not be read. Tell the Admiral.]'));
  const hits = counselHits(text, entries);
  const l = ledger(p.session_id);

  if (!body) {                                                          // no body asked for
    const metadataRead = (t in BODY_TOOLS && input.messageFormat === META) || t === 'search_threads' || t === 'list_drafts';
    if (hits.length) {
      const all = [...new Set([input.threadId, input.messageId, input.draftId, ...idsIn(text)].filter(Boolean))];
      all.forEach(i => { l.counsel[i] = now().toISOString(); }); saveLedger(p.session_id, l);
      guardLog({ guard: 'gmail', event: 'counsel-marked', session: p.session_id, tool: t, ids: all });
      const note = `Counsel-mail guard: this includes counsel (${hits.join(', ')}). Don't open any message in it; Justin reads it in Gmail. Senders, subjects and dates are fine.`;
      // A metadata read carries only the fields the rule allows. Any other tool (labels, trash, drafts) may echo text,
      // and no schema says it doesn't, so its result is replaced, not just annotated (review probe G).
      return metadataRead ? postContext(note) : postReplace(reshape(p.tool_response, stub(text, `it includes counsel (${hits.join(', ')})`)), note);
    }
    if (t in BODY_TOOLS) {
      const own = [...new Set([input[BODY_TOOLS[t]], ...ownIdsIn(text)].filter(Boolean))];
      own.forEach(i => { l.cleared[i] = now().toISOString(); }); saveLedger(p.session_id, l);
    }
    return null;
  }

  if (t === 'search_threads') {                                         // snippets are body text
    const r = redactSearch(text, entries);
    if (!r) return postReplace(reshape(p.tool_response, stub(text, 'the search result could not be checked')));
    if (r.changed) guardLog({ guard: 'gmail', event: 'snippets-removed', session: p.session_id, count: r.changed });
    return r.changed ? postReplace(reshape(p.tool_response, r.text)) : null;
  }

  if (hits.length) {                                                    // layer 2: a body that names counsel anywhere
    guardLog({ guard: 'gmail', event: 'withheld', session: p.session_id, tool: t, ids: idsIn(text).slice(0, 20), hits });
    return postReplace(reshape(p.tool_response, stub(text, `it includes counsel (${hits.join(', ')})`)));
  }
  if (t === 'get_message' || t === 'get_thread') {                     // a clean body read: its messages' attachments may follow
    [input.messageId, ...ownIdsIn(text)].filter(Boolean).forEach(i => { l.bodyChecked[i] = now().toISOString(); }); saveLedger(p.session_id, l);
  }
  return null;
}

const { payload } = readStdin();
let out = null;
try {
  out = payload.hook_event_name === 'PreToolUse' ? pre(payload) : payload.hook_event_name === 'PostToolUse' ? post(payload) : null;
} catch (e) {
  guardLog({ guard: 'gmail', event: 'ERROR', session: payload.session_id, error: String(e?.message || e).slice(0, 200) });
  const t = tool(payload.tool_name);
  if (payload.hook_event_name === 'PreToolUse' && t && bodyBearing(t, payload.tool_input)) out = preDeny('Counsel-mail guard: the guard hit an error, so this read is refused. Tell the Admiral.');
  if (payload.hook_event_name === 'PostToolUse' && t) out = postReplace(reshape(payload.tool_response, '[WITHHELD by the counsel-mail guard: it hit an error checking this result. Tell the Admiral.]'));
}
if (out) process.stdout.write(out);
process.exit(0);

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
