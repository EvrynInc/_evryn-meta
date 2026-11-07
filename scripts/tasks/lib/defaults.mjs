/**
 * defaults.mjs — defaults that more than one script applies, each kept in exactly ONE place.
 *
 * DEFAULT_ACCOUNTABLE (Soren-005, Ruling 3, 2026-11-06; Justin's B6 and B7): who is accountable for a task
 * when nobody says. `lucas`, because Justin is accountable only for items he authorized himself, and those
 * are named explicitly (`--accountable justin`, pointing at his words). Used by `tasks add` (lib/cli.mjs)
 * AND by the Linear import (lib/linear.mjs planIssue): before this constant the default lived in both, so
 * changing one silently left the other. A unit test fails if the literal appears anywhere else.
 * Nothing reads raci.a to route, wake or gate: it decides who accepts at close, not whose screen it is on.
 *
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */

export const DEFAULT_ACCOUNTABLE = 'lucas';

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
