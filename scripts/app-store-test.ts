/**
 * THE STORE SELLS DOORS THAT OPEN — locked.
 *
 * The catalogue lays products over the app registry, and three rules keep the
 * two honest. Each has a failure it answers to, so each is asserted:
 *
 *   1. LITE IS A SUBSET. The moment "lite" grants something "full" does not,
 *      they are two products with two codebases and the cheaper one is quietly
 *      the better one — the built-twice pattern, sold to customers.
 *   2. A LIVE PRODUCT OPENS A REAL DOOR. Selling a workspace that does not
 *      exist is the worst thing a store can do; unbuilt products say `planned`.
 *   3. CAPABILITIES ARE THE GATE. Surfaces ask "can(owned, capability)", never
 *      "does the account own product X" — so a bundle added later cannot
 *      require touching every screen.
 *
 * Plus: Leadformer must never grant meta-forms. They are two different products
 * that share a word, and conflating them sells the wrong one.
 *
 * Pure. No DB, no network.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  STORE, validateStore, getProduct, productIds, liveProducts, plannedProducts,
  productsForPlan, productsForApp, grantedCapabilities, can,
  type StoreProduct,
} from '../lib/freehold/app-store'
import { APPS } from '../lib/freehold/apps'
import { CAPABILITY_LABELS, capabilityLabel } from '../lib/freehold/app-store'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

console.log('\n── the catalogue is well-formed ──')
{
  const problems = validateStore()
  check('the shipped catalogue has no problems', problems.length === 0,
    problems.map((p) => `${p.productId}: ${p.problem}`).join(' | '))
  check('product ids are unique', new Set(productIds()).size === STORE.length)
  check('every product names an app or is planned',
    STORE.every((p) => (p.status === 'live' ? !!p.appId : true)))
  check('every live product points at a real app in APPS',
    liveProducts().every((p) => APPS.some((a) => a.id === p.appId)))
  check('every product grants at least one capability and is buyable by some plan',
    STORE.every((p) => p.capabilities.length > 0 && p.plans.length > 0))
  check('every product carries an engine note (so nobody rebuilds what exists)',
    STORE.every((p) => (p.engine ?? '').length > 0))
}

console.log('\n── rule 1: lite is a subset, never a second build ──')
{
  const lites = STORE.filter((p) => p.tier === 'lite')
  check('there is at least one lite product to test', lites.length >= 1)
  for (const lite of lites) {
    const full = getProduct(lite.liteOf!)
    check(`${lite.id} names an existing full sibling`, !!full)
    if (!full) continue
    const fullCaps = new Set(full.capabilities)
    check(`${lite.id} ⊂ ${full.id}`, lite.capabilities.every((c) => fullCaps.has(c)),
      lite.capabilities.filter((c) => !fullCaps.has(c)).join(','))
    check(`${lite.id} is strictly smaller than ${full.id}`,
      lite.capabilities.length < full.capabilities.length)
    check(`${lite.id} and ${full.id} unlock the same workspace (one build, two products)`,
      lite.appId === full.appId, `${lite.appId} vs ${full.appId}`)
  }
  // Meta Ads Lite keeps forms — "lite" means fewer levers, not a crippled core.
  check('Meta Ads Lite still has forms', can(['meta-ads-lite'], 'meta-forms'))
  check('…but not lookalike', !can(['meta-ads-lite'], 'meta-lookalike'))
  check('…and not the deep analysis', !can(['meta-ads-lite'], 'meta-deep-analysis'))
}

console.log('\n── a malformed product is caught, not shipped ──')
{
  const bad: StoreProduct[] = [
    { id: 'x-full', name: 'X', tagline: 't', appId: 'crm', tier: 'full', status: 'live', capabilities: ['meta-campaigns'], plans: ['company'] },
    // lite that grants MORE than its full sibling — the exact rot rule 1 exists for
    { id: 'x-lite', name: 'X Lite', tagline: 't', appId: 'crm', tier: 'lite', status: 'live', capabilities: ['meta-campaigns', 'meta-lookalike'], plans: ['company'], liteOf: 'x-full' },
    // live product pointing at an app that does not exist
    { id: 'ghost', name: 'Ghost', tagline: 't', appId: 'nope', tier: 'full', status: 'live', capabilities: ['meta-campaigns'], plans: ['company'] },
    // lite with no sibling named
    { id: 'orphan', name: 'Orphan', tagline: 't', appId: 'crm', tier: 'lite', status: 'live', capabilities: ['meta-campaigns'], plans: ['company'] },
  ]
  const problems = validateStore(bad)
  check('a lite granting more than full is rejected',
    problems.some((p) => p.productId === 'x-lite' && /lite grants what full does not/.test(p.problem)))
  check('a live product pointing at a non-existent app is rejected',
    problems.some((p) => p.productId === 'ghost' && /not in APPS/.test(p.problem)))
  check('a lite with no full sibling is rejected',
    problems.some((p) => p.productId === 'orphan' && /does not name its full sibling/.test(p.problem)))
}

console.log('\n── rule 3: surfaces gate on capabilities ──')
{
  const owned = ['meta-ads-lite', 'assets']
  const caps = grantedCapabilities(owned)
  check('capabilities union across owned products', caps.has('meta-forms') && caps.has('assets-store'))
  check('an unowned capability is not granted', !caps.has('google-automation'))
  check('an unknown product id is ignored, not crashed', grantedCapabilities(['nope']).size === 0)
  check('owning lite AND full is simply the full set, never a conflict',
    can(['meta-ads-lite', 'meta-for-realtors'], 'meta-lookalike'))
  check('owning nothing grants nothing', grantedCapabilities([]).size === 0)
}

console.log('\n── the two things called "forms" stay apart ──')
{
  const lf = getProduct('leadformer')!
  check('Leadformer exists', !!lf)
  check('Leadformer never grants meta-forms (it is the external form, ours end to end)',
    !lf.capabilities.includes('meta-forms'))
  check('Leadformer grants its own conversational capability',
    can(['leadformer'], 'leadform-conversational') && can(['leadformer'], 'leadform-team'))
  check('a Meta product never grants the Leadformer capabilities',
    !can(['meta-for-realtors'], 'leadform-conversational'))
}

console.log('\n── the store answers the operator’s questions ──')
{
  check('Google Lead Machine can make the pages it requires',
    can(['google-lead-machine'], 'landing-generate') && can(['google-lead-machine'], 'landing-own'))
  check('the ads workspace is sold as several products, built once',
    productsForApp('ads').length >= 4)
  check('a realtor plan sees fewer products than a company',
    productsForPlan('realtor').length < productsForPlan('company').length)
  check('Lead Caller is honestly listed as planned (engine exists, workspace does not)',
    plannedProducts().some((p) => p.id === 'lead-caller'))
  check('every planned product still names the engine it would use',
    plannedProducts().every((p) => (p.engine ?? '').length > 0))
}

console.log('\n── the seven call intents the store sells actually exist ──')
{
  // Lead Caller is sold on seven reasons to call. If the engine ever loses one,
  // the store is selling something that is not there.
  const src = readFileSync(join(process.cwd(), 'lib/freehold/call-templates.ts'), 'utf8')
  for (const intent of ['reengagement', 'first_contact', 'follow_up', 'invitation', 'general_interest', 'qualification', 'launch_announcement']) {
    check(`call intent "${intent}" exists in call-templates.ts`, src.includes(`'${intent}'`))
  }
}

console.log('\n── every capability can be read by a person ──')
{
  // The union is the contract; the labels are the same union said out loud. A
  // capability with no label reaches a customer as a variable name.
  const caps = new Set(STORE.flatMap((p) => p.capabilities))
  const unlabelled = [...caps].filter((c) => !CAPABILITY_LABELS[c] || capabilityLabel(c) === c)
  check('every capability a product grants has a plain-words label',
    unlabelled.length === 0, unlabelled.join(', '))

  // Same rule as the marketing menu: a capability says what the product DOES,
  // never what it achieves. Every number this platform shows is evidence-gated.
  const FIGURE = /(\d[\d,.]*\s*%)|(AED|USD|\$)\s*\d|(\bROI\b)|(\bCPL\b)|(\d+\s*x\b)/i
  const claims = Object.values(CAPABILITY_LABELS).filter((l) => FIGURE.test(l))
  check('no capability label claims a result', claims.length === 0, claims.join(' | '))
}

console.log('\n── the catalogue has a reader ──')
{
  // This file described nine products, enforced three rules about them, and was
  // imported by nothing but its own guard: a catalogue with no storefront is a
  // spreadsheet. The same shape as db-owner deciding correctly while nothing
  // called it, and the copilot naming tables nobody could resolve. So the store
  // is required to have a surface, and the surface is required to be reachable.
  const page = 'app/freehold-intelligence/store/page.tsx'
  const src = (() => { try { return readFileSync(join(process.cwd(), page), 'utf8') } catch { return '' } })()
  check(`${page} exists`, src.length > 0)
  check('…and it reads the catalogue', /from '@\/lib\/freehold\/app-store'/.test(src))
  check('…and it renders the capability labels, not the ids', /capabilityLabel\(/.test(src))
  // Comments stripped first: the page's own header explains that it has no
  // checkout, and a guard that reads its explanation as evidence fails on the
  // fix rather than on the defect.
  const code = src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ')
  check('…and it never offers to charge anybody', !/\b(buy now|checkout|purchase|pay now)\b/i.test(code))

  const app = APPS.find((a) => a.id === 'store')
  check('the store is registered as an app', !!app)
  check('…pointing at the page', app?.href === '/freehold-intelligence/store', app?.href ?? 'missing')
  check('…and gated to the roles that decide what an account owns',
    Array.isArray(app?.roles) && app!.roles!.length > 0 && !app!.roles!.includes('broker'),
    JSON.stringify(app?.roles))
}

if (failures) { console.error(`\n${failures} app-store guard(s) broken.`); process.exit(1) }
console.log('\nThe store sells doors that open, and lite can never quietly become the better product.\n')
