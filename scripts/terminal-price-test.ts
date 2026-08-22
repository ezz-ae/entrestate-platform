/**
 * WHAT A CARD GETS CHARGED, LOCKED.
 *
 * apps/terminal/lib/pricing/plans.ts is the only place the paid tiers' amounts
 * exist. That would be unremarkable except for how the money path reads them:
 *
 *   apps/terminal/lib/payments/tap.ts:19-23  getTapAmount() returns
 *     plan.monthlyAed / plan.annualAed STRAIGHT OUT OF THAT FILE, and
 *     createTapCharge posts it to https://api.tap.company/v2/charges as
 *     `amount`. There is no price id, no env var, no second system that has to
 *     agree. Editing a literal in a source file edits what a card is charged.
 *
 * Stripe is safer by accident — it charges whatever the STRIPE_PRICE_* id says
 * and the literal here is only what the page DISPLAYS, so an edit there
 * produces a page that lies about the price rather than a wrong charge. Both
 * are defects; only one of them takes the wrong amount of somebody's money.
 *
 * And until this file existed, nothing guarded it. `pnpm guards` runs its
 * suites over the platform root and mentions `apps/terminal` zero times; the
 * Terminal's own build sets `typescript: { ignoreBuildErrors: true }`
 * (apps/terminal/next.config.mjs:32-34) and has no typecheck script; the root
 * tsconfig excludes `apps` entirely (tsconfig.json:38-41). A price could be
 * changed by a stray edit and every gate in this repository would stay green.
 *
 * WHY THIS READS THE FILE AS TEXT rather than importing the module. The root
 * tsconfig excludes `apps/`, and plans.ts opens with `import type { AppLocale }
 * from "@/i18n/locale"` — a path alias that resolves to a DIFFERENT directory
 * under each of the two tsconfigs. Importing it from here would either fail to
 * resolve or quietly drag the Terminal's module graph into the platform's
 * typecheck. Reading the source is also the stronger assertion: it catches the
 * literal changing however the module is later restructured.
 *
 * Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const PLANS = join(process.cwd(), 'apps/terminal/lib/pricing/plans.ts')
const src = readFileSync(PLANS, 'utf8')

/**
 * THE PRICES, AS AGREED. A change here is a change to a charge, so it belongs
 * in a diff a human reads on purpose — which is the entire job of this file.
 * Numeric separators are stripped before comparison: the source writes 2_988.
 */
const EXPECTED: Record<string, { monthly: string; annual: string }> = {
  free:          { monthly: '0',   annual: '0' },
  pro:           { monthly: '299', annual: '2988' },
  team:          { monthly: '999', annual: '9588' },
  institutional: { monthly: 'null', annual: 'null' },
}

console.log('\n── the four tiers still exist, and only these four ──')
{
  const declared = [...src.matchAll(/^\s*tier: "([a-z]+)",$/gm)].map((m) => m[1])
  check('exactly four tiers are declared', declared.length === 4, declared.join(', '))
  check('…and they are free, pro, team, institutional',
    JSON.stringify(declared) === JSON.stringify(['free', 'pro', 'team', 'institutional']),
    declared.join(', '))
}

console.log('\n── the amounts a card is charged ──')
{
  // Each tier's block runs from its `tier: "x"` line to the next one (or EOF),
  // so an amount can only be read against the tier it actually belongs to.
  const marks = [...src.matchAll(/^\s*tier: "([a-z]+)",$/gm)]
  for (let i = 0; i < marks.length; i++) {
    const name = marks[i][1]
    const from = marks[i].index ?? 0
    const to = i + 1 < marks.length ? (marks[i + 1].index ?? src.length) : src.length
    const block = src.slice(from, to)
    const want = EXPECTED[name]
    if (!want) { fail(`${name}: an unexpected tier appeared`, name); continue }

    const grab = (field: string) => {
      const m = block.match(new RegExp(`${field}:\\s*([0-9_]+|null)`))
      return m ? m[1].replace(/_/g, '') : '(absent)'
    }
    check(`${name}: monthlyAed is ${want.monthly}`, grab('monthlyAed') === want.monthly, grab('monthlyAed'))
    check(`${name}: annualAed is ${want.annual}`, grab('annualAed') === want.annual, grab('annualAed'))
  }
}

console.log('\n── the annual price is a real discount, not a typo ──')
{
  // 12 × monthly with no discount, or MORE than 12 × monthly, are both bugs
  // that read as prices. This is the shape check the literals cannot make.
  for (const [name, want] of Object.entries(EXPECTED)) {
    if (want.monthly === 'null' || want.monthly === '0') continue
    const m = Number(want.monthly)
    const a = Number(want.annual)
    check(`${name}: a year costs less than twelve months`, a < m * 12, `${a} vs ${m * 12}`)
    // A "discount" past half is far likelier to be a missing digit than a deal.
    check(`${name}: …and not so much less that it is a missing digit`, a > m * 6, `${a} vs ${m * 6}`)
  }
}

console.log('\n── the solo product is never quoted the brokerage price ──')
{
  // THE DEFECT THIS CLAUSE ANSWERS. resolvePaidTier used to alias "realtor"
  // and "realtor-pro" to "team", so /checkout?tier=realtor quoted AED 999 —
  // the brokerage tier — for Meta for Realtors, which is the ONE-AGENT product
  // and carries no monthly fee at all. Nothing errored, because a valid tier
  // came back and every caller accepted it.
  check('resolvePaidTier no longer aliases "realtor"',
    !/case "realtor":/.test(src), 'the alias is back')
  check('…nor "realtor-pro"',
    !/case "realtor-pro":/.test(src), 'the alias is back')
  // Kept deliberately: PayPal plan ids in the wild can legitimately carry
  // these, and they name the same thing the institutional tier does.
  check('the institutional aliases are still accepted',
    /case "enterprise":/.test(src) && /case "os":/.test(src))
}

console.log('\n── the display currency is the charged currency ──')
{
  // getTapAmount hands `amount` to Tap alongside a hardcoded currency: "AED"
  // (apps/terminal/lib/payments/tap.ts:50). A badge quoting anything else
  // would be a page promising one currency while the charge is in another.
  const badges = [...src.matchAll(/badge: \{ en: "([^"]+)"/g)].map((m) => m[1])
  const wrong = badges.filter((b) => /[0-9]/.test(b) && !/AED/.test(b))
  check('every badge carrying a number says AED', wrong.length === 0, wrong.join(' | '))
}

console.log('\n── every surface that names a price names the same one ──')
{
  // The AED 999 exists in exactly one deciding place — the Team tier literal
  // this file freezes above. The owner mapped that tier onto Lead Machine, so
  // the vendor pricing page and the one-pager PDF now PRINT it. A price
  // edited in one surface and not the others is a client quoted two numbers
  // by the same company, which is the end of a negotiation.
  const page = readFileSync(join(process.cwd(), 'app/business/pricing/page.tsx'), 'utf8')
  const onepager = readFileSync(join(process.cwd(), 'scripts/build-onepager.ts'), 'utf8')

  check('the pricing page quotes the Team monthly figure',
    page.includes('AED 999 / month'), 'AED 999 not found on the page')
  check('…and the annual figure beside it',
    page.includes('AED 9,588 / year'), '9,588 missing')
  check('the one-pager quotes the same monthly figure',
    onepager.includes('AED 999/month'), 'AED 999 not in build-onepager.ts')

  // The token price is different: the page IMPORTS it from the module the
  // ledger charges by, so it cannot drift — assert the import stays, because
  // replacing it with a retyped 5 would compile and drift silently.
  check('the token price is imported from credits-shared, never retyped',
    page.includes("TOKEN_PRICE_AED } from '@/lib/freehold/credits-shared'") &&
    page.includes('AED ${TOKEN_PRICE_AED} per token'),
    'the page hardcodes the token price')
  check('the one-pager quotes the token price the ledger charges',
    onepager.includes('AED 5 per token'), 'token price missing from the one-pager')

  // Mega Brokerage is priced per setup, deliberately. A number appearing on
  // that card means somebody invented one — there is no deciding literal for
  // it anywhere in the repository.
  const mega = page.slice(page.indexOf("name: 'Mega Brokerage Platform'"), page.indexOf("name: 'Meta for Realtors'"))
  check('Mega Brokerage still carries no invented number',
    /price: null/.test(mega), mega.match(/price: [^,]+/)?.[0] ?? '')
}

console.log('\n── the Terminal pricing page sells the products, not a second catalogue ──')
{
  // The page used to sell Pro/Team/Institutional beside the platform's four
  // products — one company, two price lists. These hold the merge in place.
  const tpage = readFileSync(join(process.cwd(), 'apps/terminal/app/pricing/page.tsx'), 'utf8')
  const products = readFileSync(join(process.cwd(), 'apps/terminal/lib/pricing/products.ts'), 'utf8')

  check('the page renders the product cards module', tpage.includes('PRODUCT_CARDS'))
  // DERIVED, never retyped: the Lead Machine price must be read off the same
  // Team literal this file freezes above — a retyped 999 would drift the day
  // the literal changes.
  check('Lead Machine derives its price from the Team tier literal',
    products.includes('pricingPlans.team.monthlyAed') && products.includes('pricingPlans.team.annualAed'),
    'the products module retypes the price')
  check('the seat derives its price from the Pro literal',
    products.includes('pricingPlans.pro.monthlyAed'))
  check('the token price digit agrees with the ledger',
    products.includes('AED 5 per token'), 'token price missing or changed in products.ts')
  check('Mega Brokerage carries no invented number on this surface either',
    /priceLine: \{ en: "Priced per setup"/.test(products))

  // The only tier checkout the page still emits is the seat. tier=team and
  // tier=institutional stay ACCEPTED by the money code — resolvePaidTier,
  // webhooks, entitlement rows — but nothing on this page sells them.
  check('the only tier checkout emitted is the Pro seat',
    !tpage.includes('tier=team') && !tpage.includes('tier=institutional') &&
    products.includes('/checkout?tier=pro'),
    'a retired tier checkout is being emitted again')
  // Links in the wild deep-link to the old anchors (the upgrade modal did).
  check('the old tier anchors still resolve',
    products.includes('"team"') && products.includes('"institutional"') && tpage.includes('card.aliasAnchor'))
}

if (failures > 0) {
  console.error(`\n${failures} terminal-price rule(s) broken.`)
  console.error('If a price really did change, change EXPECTED in this file in the same commit.\n')
  process.exit(1)
}
console.log('\nNo amount changed without somebody meaning it.\n')
