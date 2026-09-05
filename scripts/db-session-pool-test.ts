/**
 * THE POOL SPEAKS SESSION MODE — never a transaction-mode pooler.
 *
 * The incident, 2026-09-05: a request on entrestate.com, schema pinned to
 * the default by runWithDefaultSchema, created entrestate_accounts and
 * inserted the account INSIDE t_mahmoud — because the connection string
 * pointed at Neon's `-pooler` host (PgBouncer, transaction mode), where the
 * session-level search_path this module sets on checkout does not survive
 * to the next statement. The vendor's rows inside a customer's schema; and
 * the mirror — a customer's query on the shared schema, or another
 * tenant's — is the same bug with the roles swapped.
 *
 * What this file keeps:
 *   · the pooled hostname is rewritten to the direct one, whatever the env
 *     says, and everything else in the URL — credentials, database, query —
 *     is untouched;
 *   · the pool is bounded (POOL_MAX) with an idle timeout, because direct
 *     connections count against the compute's max_connections;
 *   · the search_path contract stays session-level and per-checkout — the
 *     thing that made the direct host mandatory is still the design.
 *
 * Pure — no network. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sessionModeConnectionString, POOL_MAX } from '../lib/db'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

console.log('\n── the pooled host becomes the direct host ──')
{
  // Made-up credentials — the shape of a Neon URL, nothing real.
  const pooled = 'postgresql://someone:s3cr%40t@ep-example-name-a1b2c3d4-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
  const direct = sessionModeConnectionString(pooled)
  check('-pooler is removed from the hostname', direct.includes('@ep-example-name-a1b2c3d4.c-4.us-east-1.aws.neon.tech/'), direct)
  check('credentials, database and query travel untouched', direct.startsWith('postgresql://someone:s3cr%40t@') && direct.endsWith('/neondb?sslmode=require&channel_binding=require'))
  check('a direct URL is returned as it came', sessionModeConnectionString(direct) === direct)
  const compute = 'postgresql://u:p@ep-example-name-a1b2c3d4-vgz-pooler.c-4.us-east-1.aws.neon.tech/neondb'
  check('a compute-pinned pooled host is rewritten too', sessionModeConnectionString(compute).includes('@ep-example-name-a1b2c3d4-vgz.c-4.'), sessionModeConnectionString(compute))
  const other = 'postgresql://u:p@db-pooler.example.com/app'
  check('a host that is not Neon is left alone — the rule is about Neon\'s pooler, not the word', sessionModeConnectionString(other) === other)
  check('the local dev URL is left alone', sessionModeConnectionString('postgresql://postgres:postgres@localhost:5432/dev') === 'postgresql://postgres:postgres@localhost:5432/dev')
}

console.log('\n── the pool is bounded, and the rewrite is wired ──')
{
  const src = stripComments(read('lib/db.ts'))
  check('the pool takes the rewritten string', /const direct = sessionModeConnectionString\(rawConnectionString\)/.test(src))
  check('the pool is bounded with an idle timeout', /max: POOL_MAX,\s*idleTimeoutMillis: POOL_IDLE_MS/.test(src) && POOL_MAX >= 2 && POOL_MAX <= 10)
  check('search_path is still set per checkout, session-level — the contract the direct host exists for',
    /set_config\('search_path', \$1, false\)/.test(src) && /clientSchema\.get\(client\) !== searchPath/.test(src))
}

if (failures > 0) {
  console.error(`\n${failures} pool rule(s) broken.`)
  process.exit(1)
}
console.log('\nSession mode, direct host, bounded pool — the search_path a request sets is the search_path its queries run under.\n')
