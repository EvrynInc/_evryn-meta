/**
 * cluster.mjs — a THROWAWAY local PostgreSQL cluster for the acceptance suite: created in a fresh
 * temp directory, listening on loopback only, trust auth, torn down (stopped and deleted) after.
 *
 * It never reads a .env and never connects anywhere but 127.0.0.1.
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findPgTool, runPsql } from '../../lib/pg.mjs';

function freePort() {
  return new Promise((resolvePort, reject) => {
    const srv = createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolvePort(port));
    });
  });
}

export function pgToolsAvailable() {
  try {
    findPgTool('initdb');
    findPgTool('pg_ctl');
    findPgTool('psql');
    return true;
  } catch {
    return false;
  }
}

export async function startCluster() {
  const initdb = findPgTool('initdb');
  const pgCtl = findPgTool('pg_ctl');
  const dir = mkdtempSync(join(tmpdir(), 'evryn-tasks-pg-'));
  const data = join(dir, 'data');
  const log = join(dir, 'postgres.log');

  // SEALED-EXEC: followed 2026-08-11 — initdb is an absolute path to the installed PostgreSQL 17 binary (findPgTool never consults PATH or a registry); no network.
  const init = spawnSync(initdb, ['-D', data, '-U', 'postgres', '-A', 'trust', '-E', 'UTF8', '--no-locale', '--no-instructions'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (init.status !== 0) {
    rmSync(dir, { recursive: true, force: true });
    throw new Error(`initdb failed (${init.status}): ${(init.stderr || init.stdout || '').slice(0, 2000)}`);
  }

  const port = await freePort();
  // stdio 'ignore': postgres inherits pg_ctl's handles, and a piped handle would make spawnSync
  // wait for the server to exit. Output goes to the log file instead.
  // SEALED-EXEC: followed 2026-08-11 — pg_ctl is an absolute path to the installed PostgreSQL 17 binary; no network.
  const start = spawnSync(pgCtl, ['-D', data, '-l', log, '-w', '-t', '60', '-o', `-p ${port} -c listen_addresses=127.0.0.1`, 'start'], {
    stdio: 'ignore',
    windowsHide: true,
  });
  if (start.status !== 0) {
    const tail = existsSync(log) ? readFileSync(log, 'utf8').slice(-2000) : '(no log)';
    rmSync(dir, { recursive: true, force: true });
    throw new Error(`pg_ctl start failed (${start.status}): ${tail}`);
  }

  const urlFor = (db) => `postgresql://postgres@127.0.0.1:${port}/${db}`;
  const targetFor = (db) => ({
    label: 'local',
    local: true,
    host: '127.0.0.1',
    port: String(port),
    user: 'postgres',
    database: db,
    sslmode: 'disable',
  });

  return {
    dir,
    port,
    urlFor,
    targetFor,
    psql(db, sql) {
      return runPsql(targetFor(db), ['-q', '-A', '-t', '-f', '-'], { input: sql });
    },
    stop() {
      // SEALED-EXEC: followed 2026-08-11 — pg_ctl, absolute path to the installed binary; no network.
      spawnSync(pgCtl, ['-D', data, '-m', 'immediate', '-w', 'stop'], { stdio: 'ignore', windowsHide: true });
      rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    },
  };
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
