/**
 * PHASE 3 OF THE ACCOUNT FOUNDATION — the one wallet, locked.
 *
 * The ruling: Ads Coin is THE account wallet, and coin moves through exactly
 * one door. The failure this suite exists to prevent is the quiet second
 * door — an account page that "just credits the balance" on a form submit,
 * which is how a double-entry ledger stops being one. So the pins are about
 * WHO MAY NOT MOVE MONEY as much as about what renders:
 *
 *   · The account surfaces (lib/account-wallet.ts, /business/account) never
 *     import postTransfer or decideRequest. A top-up is a pending request;
 *     approval lives in the finance screen and moves the coin in the same
 *     breath — that stays the only path.
 *   · One wallet per account, by construction: kind 'broker' + ownerId =
 *     the business-account id rides the existing (kind, owner_id) unique
 *     index; the wallet id derives from the account id, so the find half of
 *     find-or-create is exact.
 *   · The request bounds are real and stated to the person in words.
 *   · The standing word rules hold on the new surfaces.
 *
 * Pure — reads source. Runs in `pnpm guards`.
 */
import fs from 'node:fs'
import path from 'node:path'
import { TOPUP_MIN_AED, TOPUP_MAX_AED } from '../lib/account-wallet'
import { aedToFils, isValidAmount } from '../lib/freehold/wallet'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const SURFACES = ['lib/account-wallet.ts', 'app/business/account/page.tsx', 'app/business/account/actions.ts']

console.log('\n── no second door onto the ledger ──')
{
  for (const rel of SURFACES) {
    const src = stripComments(read(rel))
    check(`${rel} never imports the movement functions`, !src.includes('postTransfer') && !src.includes('decideRequest'), rel)
    check(`${rel} never writes the wallet tables directly`, !/INSERT INTO freehold_wallet(?!_requests)/.test(src) && !src.includes('UPDATE freehold_wallets'), rel)
  }
  const mod = stripComments(read('lib/account-wallet.ts'))
  check('a top-up is a request and nothing else', mod.includes('createRequest({') && !mod.includes("kind: 'issue'"))
  check('the request carries who asked, for the approver', mod.includes('requestedBy: account.email ?? account.id'))
}

console.log('\n── one wallet per account, by construction ──')
{
  const mod = stripComments(read('lib/account-wallet.ts'))
  check('the wallet id derives from the account id', mod.includes('`w_acct_${account.id}`'))
  check("kind 'broker' + ownerId = the account id rides the existing unique index",
    mod.includes("kind: 'broker'") && mod.includes('ownerId: account.id'))
  const walletDb = read('lib/freehold/wallet-db.ts')
  check('…which really is unique in the schema', walletDb.includes('freehold_wallets_owner_uidx') && walletDb.includes('(kind, owner_id) WHERE owner_id IS NOT NULL'))
  check('everything runs on the shared schema', (mod.match(/runWithDefaultSchema\(/g) ?? []).length >= 3)
}

console.log('\n── the bounds are real and spoken ──')
{
  check('AED 100 to 1,000,000', TOPUP_MIN_AED === 100 && TOPUP_MAX_AED === 1_000_000)
  check('the fils conversion stays a valid ledger amount at both ends',
    isValidAmount(aedToFils(TOPUP_MIN_AED)) && isValidAmount(aedToFils(TOPUP_MAX_AED)))
  const mod = stripComments(read('lib/account-wallet.ts'))
  check('out-of-bounds is refused before any wallet work', mod.indexOf('amount_out_of_bounds') < mod.indexOf('ensureAccountWallet(account)', mod.indexOf('requestTopUp')))
  const page = stripComments(read('app/business/account/page.tsx'))
  check('the page states the bounds in words when tripped', page.includes('TOPUP_MIN_AED.toLocaleString()') && page.includes('TOPUP_MAX_AED.toLocaleString()'))
  check('a pending request renders as waiting, never as balance', page.includes('waiting for the team'))
}

console.log('\n── the surface and the words ──')
{
  const page = stripComments(read('app/business/account/page.tsx'))
  check('anonymous gets the Terminal sign-in, not a wall', page.includes('${TERMINAL_URL}/login'))
  check('the balance comes from the ledger read, never a literal', page.includes('readAccountWallet(account)'))
  const actions = stripComments(read('app/business/account/actions.ts'))
  check('the action is session-gated', actions.includes('getTerminalUser()'))
  check('a recorded top-up emails leadership', actions.includes('sendSystemEmail'))
  const nav = read('lib/business/nav.ts')
  check('the account page is in the Company menu', nav.includes("href: '/business/account'"))
  for (const rel of SURFACES) {
    const code = stripComments(read(rel)).replaceAll('"free"', '"__tier__"')
    check(`${rel} obeys the word bans`, !/\bfree\b/i.test(code) && !code.includes('مجان'), rel)
    check(`${rel} never renders the client's name`,
      !/[Ff]reehold(?!_site|_wallet|-intelligence)/.test(code.replace(/from ['"]@\/lib\/freehold\/[^'"]+['"]/g, '').replace(/freehold_(site|wallet)\w*/g, '')), rel)
  }
  const foundation = read('docs/ACCOUNT-FOUNDATION.md')
  check('phase 3 is on the record with the adapters ruling', foundation.includes('Delivered 2026-08-31 — `lib/account-wallet.ts`') && foundation.includes('FEEDERS'))
}

if (failures > 0) {
  console.error(`\n${failures} account-wallet rule(s) broken.`)
  process.exit(1)
}
console.log('\nOne wallet on the one account — and coin still moves through exactly one door.\n')
