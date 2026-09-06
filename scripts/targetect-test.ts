/**
 * TARGETECT IS A PRODUCT, NOT A PAGE — locked.
 *
 * Targetect sells one promise: an audience you described, bought on evidence,
 * and answerable afterwards for who it produced. Everything it claims already
 * exists as an engine in this repository, which is the only reason the claims
 * are allowed to be made. The failure mode this suite exists for is the quiet
 * one: an engine gets renamed or absorbed, the page keeps selling it, and
 * nothing anywhere goes red — the page is just text, and text does not break.
 *
 * So every claim in lib/business/targetect.ts names the module that implements
 * it and the suite that holds it, and both files are OPENED here. A claim
 * pointing at a module that no longer exists fails the build, the same rule the
 * app-store catalog runs on. A claim held by a suite that `pnpm guards` does
 * not run is not held at all, so the wiring is checked too — the db-owner
 * lesson: a lock nobody turns is a comment.
 *
 * It also holds the address. Targetect is the first product here with its own
 * apex, and an apex we own that answers with a Dubai property portal is the
 * exact defect lib/tenancy/vendor-host.ts was written for.
 *
 * Pure — reads source, no network, no database. Runs in `pnpm guards`.
 */
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * EVERY import is dynamic and happens inside main(), after the base domain is
 * set. lib/tenancy/config reads NEXT_PUBLIC_TENANT_BASE_DOMAIN once at module
 * load, and the persona library reaches the Meta client and the database
 * behind it — one of which pulls tenancy in. Import anything statically here
 * and the host rules are evaluated switched-off, where every assertion below
 * passes vacuously with `pass`. This suite already failed that way once.
 */

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
const show = (a: unknown) => JSON.stringify(a)

const PAGE = 'app/business/targetect/page.tsx'

async function main(): Promise<void> {
  process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN = 'entrestate.com'
  const {
    TARGETECT, TARGETECT_CAPABILITIES, TARGETECT_STAGES,
    TARGETECT_PERSONA_COUNT, TARGETECT_PERSONA_STACK, TARGETECT_VERTICAL_NOTE,
  } = await import('../lib/business/targetect')
  const { PERSONAS, MAX_STACK } = await import('../lib/freehold/persona-audience')
  const { PRODUCTS, TOUR, nextInTour } = await import('../lib/business/nav')

  console.log('\n── every claim names an engine, and the engine is there ──')
  {
    check('there are claims to check', TARGETECT_CAPABILITIES.length >= 8, String(TARGETECT_CAPABILITIES.length))

    const missingEngine = TARGETECT_CAPABILITIES.filter((c) => !existsSync(join(process.cwd(), c.engine)))
    check('every claim points at a module that exists', missingEngine.length === 0,
      missingEngine.map((c) => `${c.title} → ${c.engine}`).join(', '))

    const missingGuard = TARGETECT_CAPABILITIES.filter((c) => !existsSync(join(process.cwd(), c.guard)))
    check('every claim points at a guard that exists', missingGuard.length === 0,
      missingGuard.map((c) => `${c.title} → ${c.guard}`).join(', '))

    // A suite that asserts things about a module it never imports is asserting
    // them about something else.
    const notCovering = TARGETECT_CAPABILITIES.filter((c) => {
      // Guards import by relative path, pages by the @/ alias; both end in the
      // same specifier, so match the tail rather than either spelling.
      const spec = `${c.engine.replace(/\.ts$/, '')}'`
      return !read(c.guard).includes(spec)
    })
    check('every guard actually imports the engine it is said to hold', notCovering.length === 0,
      notCovering.map((c) => `${c.guard} ↛ ${c.engine}`).join(', '))

    // And a guard nothing runs is a comment. The gauntlet is the pnpm script.
    const pkg = read('package.json')
    const unrun = [...new Set(TARGETECT_CAPABILITIES.map((c) => c.guard))].filter((g) => !pkg.includes(g))
    check('every guard is wired into pnpm guards', unrun.length === 0, unrun.join(', '))

    check('this suite runs in the gauntlet too', pkg.includes('scripts/targetect-test.ts'))

    const stages = new Set(TARGETECT_CAPABILITIES.map((c) => c.stage))
    check('all three stages carry claims — plan, buy and learn',
      stages.size === 3 && Object.keys(TARGETECT_STAGES).every((s) => stages.has(s as never)),
      [...stages].join(', '))
  }

  console.log('\n── the numbers the page prints are the product’s own ──')
  {
    // These two are typed in lib/business/targetect.ts on purpose: importing
    // persona-audience into a public marketing route would drag the Meta
    // client and the database in behind it. The shortcut is only honest while
    // this holds.
    check(`the persona count matches the library (${PERSONAS.length})`,
      TARGETECT_PERSONA_COUNT === PERSONAS.length, String(TARGETECT_PERSONA_COUNT))
    check(`the stack limit matches MAX_STACK (${MAX_STACK})`,
      TARGETECT_PERSONA_STACK === MAX_STACK, String(TARGETECT_PERSONA_STACK))

    const page = read(PAGE)
    check('the page renders the claims from the module rather than retyping them',
      page.includes('TARGETECT_CAPABILITIES.filter') && page.includes("from '@/lib/business/targetect'"))
    check('the learning figure is read from the engine, never typed',
      page.includes('String(LEARNING_EVENTS)') && page.includes("from '@/lib/freehold/learning-phase'"))
    check('the ladder’s rungs are counted from the ladder',
      page.includes('String(LADDER.length)') && page.includes("from '@/lib/freehold/lookalike-ladder'"))
    check('the limit is on the page, in the product’s own words',
      page.includes('TARGETECT_VERTICAL_NOTE') && TARGETECT_VERTICAL_NOTE.length > 60)

    // The site's standing rule: a selling surface shows no result. Someone
    // deciding whether to trust the numbers this product will later show them
    // is the last person to sell a plausible one to.
    const shown = [
      ...[...stripComments(page).matchAll(/>([^<>{}\n]+)</g)].map((m) => m[1].trim()),
      ...[...stripComments(page).matchAll(/'([^'\n]{4,})'/g)].map((m) => m[1]),
      ...[...stripComments(page).matchAll(/`([^`\n]{4,})`/g)].map((m) => m[1]),
    ].filter(Boolean)
    const FIGURE = /(\d[\d,.]*\s*%)|(AED|USD|\$|SAR)\s*\d|(\bCPL\b)|(\bROAS\b)|(\bROI\b)|(\d+\s*x\b)|(per lead)/i
    const claims = shown.filter((t) => FIGURE.test(t))
    check('no cost, percentage or multiple is claimed anywhere on the page', claims.length === 0, claims.join(' | '))
  }

  console.log('\n── the address: an apex, a door, and one canonical page ──')
  {
    check('the page file exists at the canonical path',
      TARGETECT.href === '/business/targetect' && existsSync(join(process.cwd(), PAGE)), TARGETECT.href)

    const { vendorHostAction, PRODUCT_DOORS, BRAND_DOMAINS } = await import('../lib/tenancy/vendor-host')
    const { RESERVED_SUBDOMAINS } = await import('../lib/tenancy/reserved')

    check('targetect.com is one of ours', BRAND_DOMAINS[TARGETECT.domain] === TARGETECT.href, show(BRAND_DOMAINS))
    check('…and the door inside the platform points at the same page',
      PRODUCT_DOORS[TARGETECT.door] === TARGETECT.href, show(PRODUCT_DOORS[TARGETECT.door]))
    check('…and no tenant can sign up as the product', RESERVED_SUBDOMAINS.has(TARGETECT.door))

    const root = vendorHostAction(TARGETECT.domain, '/')
    check('targetect.com/ serves Targetect and keeps the short address',
      root.kind === 'rewrite' && root.to === TARGETECT.href, show(root))
    for (const h of [`www.${TARGETECT.domain}`, `${TARGETECT.domain}:3000`, 'TargetEct.COM']) {
      const a = vendorHostAction(h, '/')
      check(`${h} does the same`, a.kind === 'rewrite' && a.to === TARGETECT.href, show(a))
    }

    const door = vendorHostAction(`${TARGETECT.door}.entrestate.com`, '/')
    check('targetect.entrestate.com serves it too',
      door.kind === 'rewrite' && door.to === TARGETECT.href, show(door))

    for (const p of ['/business/targetect', '/business/pricing', '/signup', '/server', '/api/health']) {
      check(`${p} is left alone on the brand apex`, vendorHostAction(TARGETECT.domain, p).kind === 'pass',
        show(vendorHostAction(TARGETECT.domain, p)))
    }
    // The property site is the reason this module exists. On a brand apex the
    // way back is the brand's own page — somebody who typed targetect.com
    // asked for Targetect, not for the platform's menu.
    for (const p of ['/projects', '/areas/dubai-marina', '/blog', '/about']) {
      const a = vendorHostAction(TARGETECT.domain, p)
      check(`${p} comes back to the product`, a.kind === 'redirect' && a.to === TARGETECT.href, show(a))
    }
    check('a file is never treated as a page route',
      vendorHostAction(TARGETECT.domain, '/og-image.png').kind === 'pass')
    check('a customer’s own domain is still untouched',
      vendorHostAction('freeholdproperty.ae', '/').kind === 'pass')
  }

  console.log('\n── the product is in the menu, and the menu leads somewhere ──')
  {
    const item = PRODUCTS.find((p) => p.href === TARGETECT.href)
    check('Targetect is one of the products', item?.label === 'Targetect', show(item?.label))
    check('…with a panel of its own', item?.preview === 'targetect', show(item?.preview))
    check('…and it is a stop on the reading path', TOUR.includes(TARGETECT.href))
    check('…that does not dead-end', nextInTour(TARGETECT.href) !== null)
    check('the menu panel is rendered',
      /targetect: Targetect,/.test(read('components/business/product-preview.tsx')))
  }

  if (failures > 0) {
    console.error(`\n${failures} Targetect rule(s) broken.\n`)
    process.exit(1)
  }
  console.log('\nTargetect sells what the engines do, from its own address.\n')
}

void main()
