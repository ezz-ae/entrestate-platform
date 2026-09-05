/**
 * ONE ADMIN — every vendor desk under one roof, locked.
 *
 * The owner: "put it all in one complete admin — it is not consistent with
 * itself: partners here, /ctrl there, keys somewhere else. Coupons are part
 * of Marketing, the wallets are Finance, both inside one integrated panel,
 * and every admin page that exists joins it." And, for every screen: one
 * look — the Terminal's slate.
 *
 * What this file keeps:
 *   · the sidebar (ADMIN_SECTIONS) is the map: every link resolves to a
 *     page in app/, and every admin page under app/ctrl is reachable from
 *     it — a desk outside the roof is a desk nobody finds;
 *   · the skin carries the Terminal palette, value for value, the same
 *     ones .theme-terminal carries in globals.css;
 *   · the figures are derived, read-only: lib/ctrl/admin-figures.ts never
 *     imports a writer — approving a request stays decideRequest's, in the
 *     bank; minting a campaign stays the coupon desk's;
 *   · the words: the starting period is never called a trial on a desk, and
 *     the client's name never appears on an Entrestate surface.
 *
 * Pure — no network. Runs in `pnpm guards`.
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ADMIN_SECTIONS } from '../components/ctrl/admin-nav'
import { periodLabel } from '../lib/ctrl/admin-figures'
import type { SaasTenant } from '../lib/tenancy/store'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

console.log('\n── the sidebar is the map ──')
{
  const links = ADMIN_SECTIONS.flatMap((s) => s.links)
  const titles = ADMIN_SECTIONS.map((s) => s.title)
  check('the sections are the company\'s desks: Company · Marketing · Finance · Partners · Access', titles.join(' · ') === 'Company · Marketing · Finance · Partners · Access', titles.join(' · '))
  check('coupons sit under Marketing; credit and the bank under Finance',
    ADMIN_SECTIONS.find((s) => s.title === 'Marketing')!.links.some((l) => l.href === '/ctrl/coupons')
      && ADMIN_SECTIONS.find((s) => s.title === 'Finance')!.links.map((l) => l.href).join(',') === '/ctrl/finance,/freehold-intelligence/finance/wallets')
  for (const l of links) {
    const page = l.href === '/' ? 'app/page.tsx' : `app${l.href}/page.tsx`
    check(`${l.label} → ${l.href} is a page`, existsSync(join(process.cwd(), page)), page)
  }
  check('links outside /ctrl are marked as leaving the roof', links.every((l) => l.href.startsWith('/ctrl') ? !l.external : l.external === true))

  // Every page under app/ctrl is reachable from the sidebar (directly or as a
  // child of a listed desk).
  const pages: string[] = []
  const walk = (dir: string, url: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) walk(full, `${url}/${entry}`)
      else if (entry === 'page.tsx') pages.push(url || '/ctrl')
    }
  }
  walk(join(process.cwd(), 'app/ctrl'), '/ctrl')
  const listed = new Set(links.map((l) => l.href))
  const reachable = (p: string) => listed.has(p) || [...listed].some((h) => h !== '/ctrl' && p.startsWith(`${h}/`)) || p.startsWith('/ctrl/tenant/')
  for (const p of pages) check(`${p} is under the roof`, reachable(p))
  check('the tenant detail page hangs off the lead marketplace', pages.includes('/ctrl/tenant/[id]') && listed.has('/ctrl/partners'))
}

console.log('\n── one look: the Terminal\'s slate ──')
{
  const css = read('app/ctrl/ctrl.css')
  const pins: Array<[string, string]> = [['--bg', '#11161d'], ['--surface', '#1a232e'], ['--surface-2', '#202b36'], ['--line', '#2f3a46'], ['--text', '#e6ecf3'], ['--dim', '#b2bdca'], ['--accent', '#3a6fb8'], ['--accent-bright', '#4f83c9']]
  for (const [k, v] of pins) check(`${k} is the Terminal's ${v}`, new RegExp(`${k}: ${v}`).test(css))
  check('the old purple is gone', !/#8b5cf6|#0b1220|#121a2b/.test(css))
  check('the display face is the business site\'s serif', /--display: "Iowan Old Style"/.test(css) && /h1 \{ font-family: var\(--display\)/.test(css))
  check('the layout is two columns with a sticky sidebar', /\.ctrl-layout \{ display: grid; grid-template-columns: 232px/.test(css) && /\.ctrl-side \{\s*position: sticky/.test(css))
  const layout = stripComments(read('app/ctrl/layout.tsx'))
  check('the layout renders the sidebar for every desk', /<AdminNav email=\{user\.email \?\? null\} \/>/.test(layout) && /className="ctrl-layout"/.test(layout))
}

console.log('\n── figures are derived, never written ──')
{
  const fig = stripComments(read('lib/ctrl/admin-figures.ts'))
  check('the figures module imports no writer', !/postTransfer|decideRequest|createRequest|mintCampaign|setCampaignStatus|openWallet|INSERT|UPDATE|DELETE/.test(fig))
  check('credit totals are summed from the postings at read time', /SUM\(amount\) FILTER \(WHERE kind = 'grant'\)/.test(fig) && /SUM\(amount\) FILTER \(WHERE kind = 'apply'\)/.test(fig))
  check('a reader that fails says unknown, never a confident zero', /unknown: !tenants\.ok/.test(fig) && /unknown: !pending\.ok \|\| !holders\.ok/.test(fig))
  const finance = stripComments(read('app/ctrl/finance/page.tsx'))
  check('the finance desk decides nothing — every pending line is a link to the bank', /Decide in the bank/.test(finance) && !/action=\{/.test(finance) && !/decideRequest/.test(finance))
  const overview = stripComments(read('app/ctrl/page.tsx'))
  check('every figure on the overview is a door', (overview.match(/<Link href="\/ctrl\/(workspaces|finance|coupons|partners)" className=\{?`?"?figure/g) ?? []).length === 6)
}

console.log('\n── the words ──')
{
  const t = (over: Partial<SaasTenant>): SaasTenant => ({ id: 't', subdomain: 'x', schemaName: 't_x', company: 'X', product: 'p', accent: '', logo: '', plan: 'company' as SaasTenant['plan'], status: 'trial', trialEndsAt: null, createdAt: '2026-09-01T00:00:00Z', ownerEmail: null, ...over })
  const st = (kind: string, daysLeft = 0, daysSince = 0) => ({ kind: kind as 'active', daysLeft, daysSince, endsAt: null })
  check('a paying workspace is "Paying"', periodLabel(t({ status: 'active' }), st('notOnTrial')) === 'Paying')
  check('a paused workspace is "Paused"', periodLabel(t({ status: 'suspended' }), st('notOnTrial')) === 'Paused')
  check('a starting period is said in days, never as a trial', periodLabel(t({}), st('active', 9)) === 'Starting · 9 days left' && periodLabel(t({}), st('endingSoon', 1)) === 'Starting · ends tomorrow' && periodLabel(t({}), st('expired', 0, 3)) === 'Starting period ended 3 days ago')
  for (const rel of ['app/ctrl/page.tsx', 'app/ctrl/workspaces/page.tsx', 'app/ctrl/finance/page.tsx', 'app/ctrl/partners/page.tsx', 'components/ctrl/admin-nav.tsx', 'lib/ctrl/admin-figures.ts']) {
    const src = stripComments(read(rel))
    // "Ads Coin" is the money core's own name (the bank, the wallets); the
    // banned word is coin-as-credit — credit is said in AED. Identifiers and
    // the trial module's path are not words a person reads.
    const words = src.replace(/Ads Coin|trialState|trialsToChase|TrialState|tenancy\/trial|Coins\b|listRequests|CoinRequest/g, '')
    check(`${rel}: never says trial, free, points or coins to a person`, !/\btrial\b|\bfree\b|\bpoints\b|\bcoins?\b/i.test(words),
      (words.match(/.{0,30}(\btrial\b|\bfree\b|\bpoints\b|\bcoins?\b).{0,30}/i) ?? [''])[0])
  }
  const partners = read('app/ctrl/partners/page.tsx')
  check('the partners desk names no client company in its example', !/Freehold Properties/.test(partners) && /Marina Realty/.test(partners))
}

if (failures > 0) {
  console.error(`\n${failures} admin rule(s) broken.`)
  process.exit(1)
}
console.log('\nOne admin, one look, every desk under the roof — and nothing on it moves money.\n')
