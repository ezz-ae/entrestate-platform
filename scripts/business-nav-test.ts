/**
 * THE PRODUCTS MENU SHOWS THE PRODUCT — locked.
 *
 * The menu used to be five names and five sentences, which asks a reader to
 * imagine five systems. Each product now has a panel that shows what it is, and
 * three things have to stay true or the panel becomes the worst kind of
 * marketing: a picture of something that is not the product.
 *
 *   1. EVERY PRODUCT HAS ONE. A sixth product added to PRODUCTS without a
 *      preview would render an empty half-panel beside its name. This is the
 *      same defect as the vendor-host allowlist and the copilot table names: a
 *      list nobody is forced to update. So the build forces it.
 *   2. NO INVENTED PERFORMANCE. Not one figure in the previews may be a result
 *      — no cost per lead, no yield, no ROI, no AED. This site is read by people
 *      deciding whether to trust the numbers the product will later show them,
 *      and the whole platform is built on evidence-gated figures
 *      (lib/freehold/min-evidence.ts). A plausible number in a nav menu is the
 *      cheapest possible way to throw that away.
 *   3. ONE DEMO, ONE WORDING. The Leadformer conversation appears in the menu
 *      and on the Leadformer page. Two copies drift, and then the product
 *      contradicts itself between the menu and the page one click later.
 *
 * Pure — reads the source. No DB, no network, no rendering.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { PRODUCTS, PLATFORM, COMPANY } from '../lib/business/nav'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

const navSrc = read('lib/business/nav.ts')
const previewSrc = read('components/business/product-preview.tsx')
const shellSrc = read('components/business/shell.tsx')

console.log('\n── every product has a panel, and every panel has a product ──')
{
  const missing = PRODUCTS.filter((p) => !p.preview).map((p) => p.label)
  check('every product names a preview', missing.length === 0,
    `${missing.join(', ')} — add one in lib/business/nav.ts and render it in components/business/product-preview.tsx`)

  // The union is the list of previews that exist; a member nobody uses is a
  // panel written for a product that was renamed or dropped.
  const union = navSrc.slice(navSrc.indexOf('export type PreviewKind'), navSrc.indexOf('export interface NavItem'))
  const kinds = [...union.matchAll(/'([a-z-]+)'/g)].map((m) => m[1])
  check('the union lists at least five previews', kinds.length >= 5, String(kinds.length))

  const used = new Set(PRODUCTS.map((p) => p.preview))
  const orphans = kinds.filter((k) => !used.has(k as never))
  check('no preview exists for a product that does not', orphans.length === 0, orphans.join(', '))

  const unknown = [...used].filter((k) => k && !kinds.includes(k))
  check('no product names a preview that does not exist', unknown.length === 0, unknown.join(', '))

  check('previews are unique — two products cannot share one panel',
    used.size === PRODUCTS.length, `${used.size} previews for ${PRODUCTS.length} products`)

  for (const k of kinds) {
    check(`components/business/product-preview.tsx renders "${k}"`, previewSrc.includes(`'${k}'`) || previewSrc.includes(`${k}:`))
  }
}

console.log('\n── nothing in the panel is a claim about results ──')
{
  // Only rendered TEXT is checked. Tailwind widths and inline styles are full
  // of percentages ("62%", "w-1/2") and none of them is a number shown to a
  // reader, so scanning the whole file would fail on its own layout.
  const textNodes = [...previewSrc.matchAll(/>([^<>{}\n]+)</g)]
    .map((m) => m[1].trim())
    .filter((t) => t.length > 0)
  const stringLiterals = [...previewSrc.matchAll(/'([^'\n]{4,})'/g)]
    .map((m) => m[1])
    .filter((t) => !t.includes('-') || t.includes(' '))
  const shown = [...textNodes, ...stringLiterals]

  check('there is text to check', shown.length > 5, String(shown.length))

  const FIGURE = /(\d[\d,.]*\s*%)|(AED|USD|\$|SAR)\s*\d|(\bCPL\b)|(\bROAS\b)|(\bROI\b)|(\d+\s*x\b)|(per lead)/i
  const claims = shown.filter((t) => FIGURE.test(t))
  check('no percentage, currency, CPL, ROI or multiple appears in the panel',
    claims.length === 0, claims.join(' | '))

  // The Leadformer sample line on the product page quotes a projected yield.
  // It is fine there, in context, next to the explanation. It is not fine in a
  // menu, so the preview stops before it.
  check('the menu conversation stops before the yield line',
    !previewSrc.includes('6.8%'))
}

console.log('\n── one demo, one wording ──')
{
  // The wording now lives in ONE place — LeadformCrop, which the product page
  // renders — and the menu quotes it. Two copies of a demo conversation drift;
  // this one already had, and the copy that stayed behind opened with "Hi —
  // I'm the form", the line the owner called weird.
  const crop = read('components/business/crops.tsx')
  const lines = [
    'Welcome — before I show you the plans, what should I call you?',
    'Nice to meet you, Mohamed. Buying to live in, or to invest?',
  ]
  for (const line of lines) {
    check(`the crop and the menu use the same line: "${line.slice(0, 34)}…"`,
      crop.includes(line) && previewSrc.includes(line))
  }
  // Comments are stripped first: both files explain in a comment WHY the old
  // line is gone, and an explanation of a banned line is not the banned line.
  const noComments = (src: string) =>
    src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')
  check('nobody says "I am the form" any more',
    !/I(’|')m the form/.test(noComments(previewSrc)) &&
    !/I(’|')m the form/.test(noComments(read('app/business/leadformer/page.tsx'))))
}

console.log('\n── the panel is decoration, the link is the meaning ──')
{
  // Pointer and keyboard must select the same way, or the menu works for a
  // mouse and is inert for a tab key.
  check('hovering a product shows it', /onMouseEnter=\{\(\) => setActive/.test(shellSrc))
  check('…and so does focusing it', /onFocus=\{\(\) => setActive/.test(shellSrc))
  // Anchored on the preview itself, not on a class list, so restyling the
  // container cannot quietly drop the aria-hidden with it.
  check('the panel is hidden from screen readers',
    /aria-hidden[^>]*>\s*\{shown\?\.preview/.test(shellSrc))
  check('only the Products group gets the wide panel',
    /g\.label === 'Products' \? \(\s*<ProductsPanel/.test(shellSrc))
}

console.log('\n── the Terminal link points at the Terminal ──')
{
  // It lived at m.entrestate.com while terminal.entrestate.com did not resolve.
  // It resolves.
  check('no stale m.entrestate.com link remains', !navSrc.includes('m.entrestate.com'))
  const terminal = COMPANY.find((i) => i.label === 'Decision Terminal')
  check('the Terminal entry exists and is absolute',
    terminal?.href === 'https://terminal.entrestate.com', terminal?.href ?? 'missing')
  check('it is the only external door in the nav',
    [...PRODUCTS, ...PLATFORM, ...COMPANY].filter((i) => !i.href.startsWith('/')).length === 1)
}

if (failures) { console.error(`\n${failures} business-nav guard(s) broken.`); process.exit(1) }
console.log('\nThe menu shows the product, and never a number it cannot stand behind.\n')
