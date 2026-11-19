/**
 * cluster-supabase.mjs — a THROWAWAY local PostgreSQL cluster bootstrapped the way Supabase runs (QC6 NB3):
 * the bootstrap superuser is `supabase_admin`, and `postgres`, the role that owns the schema and that the SQL
 * editor runs Justin's pastes as, is NOT a superuser (createrole, createdb, bypassrls; a member of anon,
 * authenticated and service_role). cluster.mjs's default bootstrap (where postgres IS the superuser) is
 * unchanged for every other suite.
 *
 * Loopback only, trust auth, torn down (stopped and deleted) after. It never reads a .env.
 * Truncation check: the last line of this file should read `FULL FILE LOADED`.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, readFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { findPgTool, runPsql } from '../../lib/pg.mjs';

export { pgToolsAvailable } from './cluster.mjs';

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

export async function startSupabaseShapedCluster() {
  const initdb = findPgTool('initdb');
  const pgCtl = findPgTool('pg_ctl');
  const dir = mkdtempSync(join(tmpdir(), 'evryn-tasks-sbpg-'));
  const data = join(dir, 'data');
  const log = join(dir, 'postgres.log');

  // SEALED-EXEC: followed 2026-08-11 — initdb is an absolute path to the installed PostgreSQL 17 binary (findPgTool never consults PATH or a registry); no network.
  const init = spawnSync(initdb, ['-D', data, '-U', 'supabase_admin', '-A', 'trust', '-E', 'UTF8', '--no-locale', '--no-instructions'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (init.status !== 0) {
    rmSync(dir, { recursive: true, force: true });
    throw new Error(`initdb failed (${init.status}): ${(init.stderr || init.stdout || '').slice(0, 2000)}`);
  }

  const port = await freePort();
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

  const targetFor = (db, user = 'postgres') => ({
    label: 'local (Supabase-shaped)',
    local: true,
    host: '127.0.0.1',
    port: String(port),
    user,
    database: db,
    sslmode: 'disable',
  });
  const psqlAs = (user, db, sql) => runPsql(targetFor(db, user), ['-q', '-A', '-t', '-f', '-'], { input: sql });

  const boot = psqlAs('supabase_admin', 'postgres', `
    create role anon nologin noinherit;
    create role authenticated nologin noinherit;
    create role service_role nologin noinherit bypassrls;
    create role authenticator login noinherit;
    grant anon, authenticated, service_role to authenticator;
    create role postgres login createrole createdb bypassrls;
    grant anon, authenticated, service_role to postgres;`);
  if (boot.status !== 0) {
    stop();
    throw new Error(`bootstrap roles failed: ${boot.stderr.slice(0, 2000)}`);
  }

  function stop() {
    // SEALED-EXEC: followed 2026-08-11 — pg_ctl, absolute path to the installed binary; no network.
    spawnSync(pgCtl, ['-D', data, '-m', 'immediate', '-w', 'stop'], { stdio: 'ignore', windowsHide: true });
    rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  }

  return { dir, port, targetFor, psqlAs, stop };
}

// Truncation canary — DO NOT REMOVE: FULL FILE LOADED
