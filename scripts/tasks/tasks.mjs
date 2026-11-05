#!/usr/bin/env node
/**
 * tasks.mjs — the founding team's task list. `node tasks.mjs --help` is the manual.
 * All logic is in lib/cli.mjs; README.md says what this is and how it is gated.
 */
import { run } from './lib/cli.mjs';

process.exitCode = await run(process.argv.slice(2));
