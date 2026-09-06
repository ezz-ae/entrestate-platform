/**
 * TARGETECT SAYS WHAT IT HAS NOT BUILT — locked.
 *
 * Targetect is a young product on its own domain, and most of it is written
 * down rather than running. Two lies are available to a page in that position,
 * both of them free and neither of them noisy:
 *
 *   1. A claim marked BUILT whose engine does not exist — or exists with no
 *      guard, or with a guard `pnpm guards` never runs. This repository has
 *      the scar: lib/tenancy/db-owner.ts decided correctly for weeks while
 *      nothing called it, and a lock nobody turns is a comment.
 *   2. A claim that is only specified quietly reaching the page as if it were
 *      a feature. Nothing goes red when a plan is promoted in prose, so the
 *      status is rendered from the same list the page renders, and this suite
 *      proves the page cannot print one without the other.
 *
 * It also holds the two boundaries the product's separateness depends on: the
 * apex (targetect.com serves Targetect, never the brokerage's apartments) and
 * the chrome (no property nav, no WhatsApp bubble from a Dubai brokerage on a
 * page about audience software). And it holds the one that is a decision
 * rather than a mechanism: Targetect is NOT in the Entrestate products menu —
 * the owner's ruling, "it doesn't belong to any of what we have."
 *
 * Pure — reads source, no network, no database. Runs in `pnpm guards`.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Every import is dynamic and inside main(), after the base domain is set:
 * lib/tenancy/config reads NEXT_PUBLIC_TENANT_BASE_DOMAIN once at module load,
 * and a module loaded before it would evaluate the host rules switched off,
 * where every assertion below passes vacuously with `pass`.
 */
let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
const show = (a: unknown) => JSON.stringify(a)

const PAGE = 'app/targetect/page.tsx'
const LAYOUT = 'app/targetect/layout.tsx'
const MODULE = 'lib/targetect/product.ts'

async function main(): Promise<void> {
  process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN = 'entrestate.com'
  const {
    TARGETECT, TARGETECT_ACTS, TARGETECT_CLAIMS, TARGETECT_PAIRS,
    TARGETECT_PROMISE, TARGETECT_IDENTITY_RULE,
  } = await import('../lib/targetect/product')
  const { PRODUCTS, ALL_BUSINESS_ROUTES } = await import('../lib/business/nav')

  console.log('\n── a built claim has an engine, a guard, and a guard that runs ──')
  {
    check('there are claims to check', TARGETECT_CLAIMS.length >= 6, String(TARGETECT_CLAIMS.length))

    const real = TARGETECT_CLAIMS.filter((c) => c.status !== 'specified')
    check('something is actually built', real.length > 0, String(real.length))

    const noEngine = real.filter((c) => !c.engine || !c.guard)
    check('every built or half-built claim names an engine and a guard', noEngine.length === 0,
      noEngine.map((c) => c.title).join(', '))

    const missingFile = real.filter((c) => c.engine && !existsSync(join(process.cwd(), c.engine)))
    check('every named engine exists', missingFile.length === 0,
      missingFile.map((c) => `${c.title} → ${c.engine}`).join(', '))

    const missingGuard = real.filter((c) => c.guard && !existsSync(join(process.cwd(), c.guard)))
    check('every named guard exists', missingGuard.length === 0,
      missingGuard.map((c) => `${c.title} → ${c.guard}`).join(', '))

    // A suite asserting things about a module it never imports is asserting
    // them about something else. Guards import by relative path, pages by the
    // @/ alias; both end in the same specifier, so match the tail.
    const notCovering = real.filter((c) => c.guard && c.engine &&
      !read(c.guard).includes(`${c.engine.replace(/\.ts$/, '')}'`))
    check('every guard imports the engine it is said to hold', notCovering.length === 0,
      notCovering.map((c) => `${c.guard} ↛ ${c.engine}`).join(', '))

    const pkg = read('package.json')
    const unrun = [...new Set(real.map((c) => c.guard!))].filter((g) => !pkg.includes(g))
    check('every guard is wired into pnpm guards', unrun.length === 0, unrun.join(', '))
    check('this suite runs in the gauntlet too', pkg.includes('scripts/targetect-test.ts'))
  }

  console.log('\n── a plan is never dressed as a feature ──')
  {
    const specified = TARGETECT_CLAIMS.filter((c) => c.status === 'specified')
    check('the honest majority is still honest — most of this is written down, not running',
      specified.length > 0, String(specified.length))
    const pointing = specified.filter((c) => c.engine || c.guard)
    check('a specified claim points at no engine — there is nothing to point at',
      pointing.length === 0, pointing.map((c) => c.title).join(', '))

    const half = TARGETECT_CLAIMS.filter((c) => c.status === 'partial')
    const silent = half.filter((c) => !c.missing || c.missing.length < 20)
    check('a half-built claim names the half that is missing', silent.length === 0,
      silent.map((c) => c.title).join(', '))

    // The page must render the status from the same list, or the two drift and
    // the prose wins.
    const page = read(PAGE)
    check('the page renders the claims from the module, never retyped',
      page.includes('TARGETECT_CLAIMS.filter') && page.includes("from '@/lib/targetect/product'"))
    check('…and prints a status beside every one of them',
      /STATUS_LABEL\[claim\.status\]/.test(page) && /'Not built yet'/.test(page))
    check('…and prints the missing half where there is one', /claim\.missing/.test(page))
    check('the promise and the identity rule are on the page in the product’s own words',
      page.includes('TARGETECT_PROMISE') && page.includes('TARGETECT_IDENTITY_RULE') &&
      TARGETECT_PROMISE.includes('Aliaa') && TARGETECT_IDENTITY_RULE.length > 60)

    // A selling surface shows no result. Someone deciding whether to trust the
    // numbers a targeting product will later show them is the last person to
    // sell a plausible one to.
    const shown = [
      ...[...stripComments(page).matchAll(/>([^<>{}\n]+)</g)].map((m) => m[1].trim()),
      ...[...stripComments(page).matchAll(/'([^'\n]{4,})'/g)].map((m) => m[1]),
    ].filter(Boolean)
    const FIGURE = /(\d[\d,.]*\s*%)|(AED|USD|\$|SAR)\s*\d|(\bCPL\b)|(\bROAS\b)|(\bROI\b)|(\d+\s*x\b)|(per lead)/i
    const claims = shown.filter((t) => FIGURE.test(t))
    check('no cost, percentage or multiple is claimed anywhere on the page', claims.length === 0, claims.join(' | '))

    check('all three acts carry claims — spot, reach and touch',
      Object.keys(TARGETECT_ACTS).every((a) => TARGETECT_CLAIMS.some((c) => c.act === a)))
  }

  console.log('\n── it stands alone: its own address, and not in anybody’s menu ──')
  {
    check('the page and its own chrome exist',
      existsSync(join(process.cwd(), PAGE)) && existsSync(join(process.cwd(), LAYOUT)))
    check('the definition lives outside lib/business — it is not a platform product',
      existsSync(join(process.cwd(), MODULE)) && !existsSync(join(process.cwd(), 'lib/business/targetect.ts')))
    check('the page lives outside /business for the same reason',
      TARGETECT.href === '/targetect' && !TARGETECT.href.startsWith('/business'), TARGETECT.href)

    // The owner's ruling: "it doesn't belong to any of what we have."
    check('Targetect is not sold in the Entrestate products menu',
      PRODUCTS.every((p) => p.href !== TARGETECT.href && p.label !== 'Targetect'),
      PRODUCTS.map((p) => p.label).join(', '))
    check('…and is not in the platform site’s route map either',
      !ALL_BUSINESS_ROUTES.includes(TARGETECT.href))

    // It does point back at the two things it works with, and those are real
    // pages of the platform — a dangling door is worse than no door.
    const dangling = TARGETECT_PAIRS.filter((p) => !ALL_BUSINESS_ROUTES.includes(p.href))
    check('what it pairs with are pages that exist', dangling.length === 0,
      dangling.map((p) => `${p.name} → ${p.href}`).join(', '))
  }

  console.log('\n── the apex serves Targetect, and never the apartments ──')
  {
    const { vendorHostAction, PRODUCT_DOORS, BRAND_DOMAINS, VENDOR_PREFIXES } =
      await import('../lib/tenancy/vendor-host')
    const { RESERVED_SUBDOMAINS } = await import('../lib/tenancy/reserved')

    check('targetect.com is one of ours', BRAND_DOMAINS[TARGETECT.domain] === TARGETECT.href, show(BRAND_DOMAINS))
    check('the door inside the platform points at the same page',
      PRODUCT_DOORS[TARGETECT.door] === TARGETECT.href, show(PRODUCT_DOORS[TARGETECT.door]))
    check('no tenant can sign up as the product', RESERVED_SUBDOMAINS.has(TARGETECT.door))
    // Without this the apex rewrites to a path the very next rule redirects
    // away, and the reader lands back on the platform site.
    check('/targetect is a vendor surface, so the page it rewrites to is allowed to render',
      VENDOR_PREFIXES.includes(TARGETECT.href), show(VENDOR_PREFIXES))

    const root = vendorHostAction(TARGETECT.domain, '/')
    check('targetect.com/ serves it and keeps the short address',
      root.kind === 'rewrite' && root.to === TARGETECT.href, show(root))
    for (const h of [`www.${TARGETECT.domain}`, `${TARGETECT.domain}:3000`, 'TargetEct.COM']) {
      const a = vendorHostAction(h, '/')
      check(`${h} does the same`, a.kind === 'rewrite' && a.to === TARGETECT.href, show(a))
    }
    check('targetect.entrestate.com serves it too',
      vendorHostAction(`${TARGETECT.door}.entrestate.com`, '/').kind === 'rewrite')
    check('the page itself renders on the apex rather than bouncing',
      vendorHostAction(TARGETECT.domain, TARGETECT.href).kind === 'pass')
    check('…and on entrestate.com as well',
      vendorHostAction('entrestate.com', TARGETECT.href).kind === 'pass')
    for (const p of ['/projects', '/areas/dubai-marina', '/blog']) {
      const a = vendorHostAction(TARGETECT.domain, p)
      check(`${p} comes back to the product`, a.kind === 'redirect' && a.to === TARGETECT.href, show(a))
    }
    check('a customer’s own domain is still untouched',
      vendorHostAction('freeholdproperty.ae', '/').kind === 'pass')
  }

  console.log('\n── the page wears its own name, not the brokerage’s ──')
  {
    // A visitor who typed targetect.com meeting "Golden Visa", a property nav
    // and an advisor's WhatsApp bubble is the same defect as the front door
    // selling apartments — one layer up, in the layout.
    for (const f of ['components/site-header.tsx', 'components/site-footer.tsx', 'components/whatsapp-float.tsx']) {
      check(`${f} stays off /targetect`, stripComments(read(f)).includes('"/targetect"'))
    }
    const layout = read(LAYOUT)
    check('the layout carries its own header, with its own name', /Targetect\s*<\/Link>/.test(layout))
    check('…and 404s inside a tenant’s instance, like every other vendor surface',
      /tenantSubdomainFromHost\(host\)\) notFound\(\)/.test(layout))
  }

  if (failures > 0) {
    console.error(`\n${failures} Targetect rule(s) broken.\n`)
    process.exit(1)
  }
  console.log('\nTargetect stands on its own address, and says what it has not built yet.\n')
}

void main()
