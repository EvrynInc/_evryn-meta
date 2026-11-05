import '../helpers.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EMAIL, PHONE, screenRow } from '../../lib/screen.mjs';

test('email addresses are caught', () => {
  for (const s of ['replied to x@example.com', 'Jane.Doe+tag@mail.co.uk', 'contact: a_b@sub.domain.org.']) {
    assert.ok(EMAIL.test(s), s);
  }
});

test('phone numbers are caught (narrow pattern)', () => {
  for (const s of ['call 206-555-0100', '(206) 555-0100', '206.555.0100', '+1 206 555 0100', '+44 20 7946 0958', '1-800-555-0199']) {
    assert.ok(PHONE.test(s), s);
  }
});

test('the phone pattern does NOT trip on dates, ticket ids, task ids, SHAs, times, versions or counts', () => {
  for (const s of [
    '2026-11-05',
    '11/05/2026',
    '2026-11-05T14:52:00-08:00',
    'EVR-123',
    'EVR-1234 and EVR-5678',
    'T-12',
    'T-1234',
    'commit 8e8fcc6',
    'f09d113 and 7d87ca51c2b4e8a9f0d3c6b1a2e4f5d6c7b8a9e0',
    'v1.2.3',
    '14:52-15:10',
    '$1,000 to $10,000',
    '1000-1200 rows',
    'port 5432 and 6543',
    '192.168.1.100',
    'ballot 114, report #40',
    'migration 001_tasks_columns.sql',
  ]) {
    assert.ok(!PHONE.test(s), `false positive: ${s}`);
    assert.ok(!EMAIL.test(s), `email false positive: ${s}`);
  }
});

test('screenRow: email REFUSES, phone WARNS, across every free-text field', () => {
  const fields = ['title', 'description', 'closing_note', 'signed_ref'];
  for (const f of fields) {
    assert.deepEqual(screenRow({ [f]: 'a@b.co' }).refused, [{ field: f, kind: 'email address' }]);
    assert.deepEqual(screenRow({ [f]: '206-555-0100' }).warnings, [{ field: f, kind: 'phone number' }]);
  }
  assert.equal(screenRow({ tags: ['ok', 'x@y.io'] }).refused[0].field, 'tags');
  assert.equal(screenRow({ links: ['docs/a.md', 'mailto:x@y.io'] }).refused[0].field, 'links');
});

test('screenRow never echoes the matched text', () => {
  const r = screenRow({ closing_note: 'replied to secret.person@example.com' });
  assert.ok(!JSON.stringify(r).includes('secret.person'));
});

test('clean text passes', () => {
  assert.deepEqual(screenRow({ title: 'T-12: wire EVR-123 import', description: 'see docs/x.md, 2026-11-05' }), { refused: [], warnings: [] });
});
