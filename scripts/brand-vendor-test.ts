/**
 * THE PLATFORM WEARS ITS OWN BRAND, AND NEVER SHIPS A CLIENT'S NUMBERS — locked.
 *
 * This repo was forked from a client (Freehold), and for a while its brand
 * defaults were that client's: a deployment that set no env wore the wrong
 * company, and the vendor's own site claimed the client's "19 years / 3,500+
 * projects / RERA ORN". Two rules fix it, and are asserted so they can't rot:
 *
 *   1. THE DEFAULT IDENTITY IS THE PLATFORM (Entrestate) — company, domain and
 *      legal name default to the vendor, never the client. A white-label client
 *      overrides via NEXT_PUBLIC_BRAND_*.
 *   2. BROKERAGE CLAIMS ARE WITHHELD, NOT INVENTED — years in market, projects,
 *      clients and RERA licence default to empty, and no vendor-facing marketing
 *      page hardcodes the client's specific figures. A licensed brokerage sets
 *      its own via env / Web Studio content.
 *
 * Pure — reads brand.ts and the marketing pages. No DB, no network.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

console.log('\n── the default identity is the platform, not the client ──')
{
  const brand = read('lib/freehold/brand.ts')
  check('company defaults to Entrestate', /NEXT_PUBLIC_BRAND_COMPANY,\s*'Entrestate'/.test(brand))
  check('domain defaults to entrestate.com', brand.includes("'entrestate.com'"))
  check('legalName defaults to Entrestate', /NEXT_PUBLIC_BRAND_LEGAL_NAME,\s*'Entrestate'/.test(brand))
  check('no client value survives as a brand default (Freehold / freeholdproperty.ae)',
    !/'Freehold'|'Freehold Property'|'freeholdproperty\.ae'/.test(brand))
  check('brokerage-claim fields default to empty (withheld until a deployment sets them)',
    /NEXT_PUBLIC_BRAND_YEARS,\s*''/.test(brand)
    && /NEXT_PUBLIC_BRAND_PROJECTS,\s*''/.test(brand)
    && /NEXT_PUBLIC_BRAND_CLIENTS,\s*''/.test(brand)
    && /NEXT_PUBLIC_BRAND_RERA_ORN,\s*''/.test(brand))
}

console.log('\n── vendor-facing marketing pages ship no hardcoded client numbers ──')
{
  const FILES = [
    'components/hero-with-motion.tsx',
    'app/about/page.tsx',
    'app/services/page.tsx',
    'components/site-footer.tsx',
    'app/contact/page.tsx',
  ]
  // Freehold's specific, unevidenced claims. They must come from the brand
  // config (and withhold when empty), never be typed into a component.
  const FORBIDDEN = ['3,500', '2,400', '1,530', '28628', '19 yrs', '19 Years', '19 years', 'Nineteen years', 'Freehold Properties LLC']
  for (const f of FILES) {
    const src = read(f)
    const hits = FORBIDDEN.filter((s) => src.includes(s))
    check(`${f} carries no hardcoded client claim`, hits.length === 0, hits.join(', '))
  }
}

if (failures) { console.error(`\n${failures} brand-vendor guard(s) broken.`); process.exit(1) }
console.log('\nThe platform wears Entrestate by default, and a client’s numbers are its own to set.\n')
