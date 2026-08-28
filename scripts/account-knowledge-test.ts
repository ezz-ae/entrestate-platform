/**
 * THE ACCOUNT KNOWLEDGE STORE NEVER LEAKS AND NEVER FETCHES — locked.
 *
 * This is the horizontal switch: a generic per-account knowledge base the
 * assistant grounds on, so the same engine serves a broker and a dentist. Two
 * invariants make it safe, and are asserted so a later edit can't quietly break
 * them:
 *
 *   1. EVERY read is scoped to account_ref. One account's knowledge must never
 *      be retrievable by another — asserted by reading the module and checking
 *      that every SELECT/DELETE names account_ref.
 *   2. STORE-ONLY. ingest stores text the caller extracted; the module must
 *      never fetch a URL itself (server-side fetch of a user link is SSRF).
 *
 * Plus the pure validation/tokenisation, tested directly. No DB, no network.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validateKnowledge, knowledgeTokens } from '../lib/freehold/account-knowledge'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

console.log('\n── ingest validation (pure) ──')
{
  check('rejects a missing account_ref', validateKnowledge({ kind: 'text', content: 'hi there' }).ok === false)
  check('rejects an unknown kind', validateKnowledge({ accountRef: 'a@b.com', kind: 'audio', content: 'x y' }).ok === false)
  check('rejects empty content', validateKnowledge({ accountRef: 'a@b.com', kind: 'text', content: ' ' }).ok === false)
  check('accepts a valid link/file/text doc',
    validateKnowledge({ accountRef: 'a@b.com', kind: 'link', content: 'our pricing page text' }).ok === true)
}

console.log('\n── message tokenisation (pure) ──')
{
  const toks = knowledgeTokens('What is the BEST price for your Marina villa??')
  check('drops stopwords and short words', !toks.includes('the') && !toks.includes('is') && !toks.includes('for'))
  check('keeps the meaningful terms', toks.includes('marina') && toks.includes('villa') && toks.includes('price'))
  check('caps at 8 tokens', knowledgeTokens('alpha bravo charlie delta echo foxtrot golf hotel india juliet').length <= 8)
}

console.log('\n── the store never leaks across accounts, and never fetches ──')
{
  const src = readFileSync(join(process.cwd(), 'lib/freehold/account-knowledge.ts'), 'utf8')

  // Every data statement over the table must carry the account_ref scope.
  const stmts = src.match(/(SELECT|DELETE)[\s\S]*?freehold_account_knowledge[\s\S]*?(?=`)/gi) || []
  const unscoped = stmts.filter((s) => !/account_ref\s*=\s*\$1/.test(s))
  check('every SELECT/DELETE is scoped to account_ref = $1', unscoped.length === 0,
    unscoped.map((s) => s.replace(/\s+/g, ' ').slice(0, 80)).join(' | '))

  // Store-only: no server-side fetch of a user-supplied URL.
  check('the module fetches nothing (store-only — no SSRF surface)',
    !/\bfetch\s*\(|axios|http\.request|WebFetch|got\(/.test(src))

  // The kind whitelist is exactly link/file/text.
  check("kind is constrained to 'link','file','text'",
    /CHECK \(kind IN \('link','file','text'\)\)/.test(src))
}

if (failures) { console.error(`\n${failures} account-knowledge guard(s) broken.`); process.exit(1) }
console.log('\nThe account teaches the engine its own business — privately, and without the engine ever reaching out on its behalf.\n')
