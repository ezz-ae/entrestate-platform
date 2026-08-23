/**
 * Landing accent palettes — the contract, locked.
 *
 * The landing builder lets a page pick an accent palette. Its safety story is
 * the same three rules as the front-page builder, restated as assertions:
 *
 *   1. THE REGISTRY IS THE CONTRACT — an unknown / empty key resolves to null
 *      ("no override"), keys are unique, every shade is a real hex.
 *   2. NO PICK RENDERS TODAY'S PAGE — the `gold` entry's shades are EXACTLY
 *      the hexes the public page hardcoded before accents existed, the page
 *      source keeps those hexes as var() fallbacks, and the default gradient
 *      string still carries the shipped 212,175,55 wash byte-identically.
 *   3. THE ACCENT RIDES CSS VARS, NOT FORKED MARKUP — the page root spreads
 *      lpAccentVars, the frozen #D4AF37 literals are gone from the form and
 *      sticky CTA (they now retint with the brand like everything else), and
 *      the store/API persist only registry-sanitized keys.
 *
 * Pure — no model, no database, no network.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  LP_ACCENTS, LP_ACCENT_KEYS, resolveLpAccent, lpAccentVars, lpPalette,
} from '../lib/landing-theme'
import { BRAND } from '../lib/freehold/brand'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

console.log('\n── the registry is the contract ──')
{
  check('unknown key resolves to null (no override)', resolveLpAccent('neon-vapor') === null)
  check('empty / junk keys resolve to null',
    resolveLpAccent('') === null && resolveLpAccent(undefined) === null && resolveLpAccent(42) === null)
  check('a key resolves case-insensitively, trimmed', resolveLpAccent('  EMERALD ')?.key === 'emerald')
  check('keys are unique', new Set(LP_ACCENT_KEYS).size === LP_ACCENTS.length)
  const HEX = /^#[0-9A-Fa-f]{6}$/
  check('every entry carries seven real hexes',
    LP_ACCENTS.every((a) => [a.accent, a.bright, a.mid, a.deep, a.dark, a.darkest, a.dayText].every((c) => HEX.test(c))))
}

console.log('\n── no pick renders today\'s page ──')
{
  // These hexes are what app/lp/[slug] hardcoded before accents existed. If
  // they drift, "no palette" and "yesterday's page" stop being the same thing
  // — that is a design change, made here knowingly, with the page fallbacks.
  const gold = resolveLpAccent('gold')!
  check('gold accent is the shipped #D4AF37', gold.accent === '#D4AF37', gold.accent)
  check('gold bright is the shipped CTA hover #E8C547', gold.bright === '#E8C547', gold.bright)
  check('gold mid is the shipped units band #C9A227', gold.mid === '#C9A227', gold.mid)
  check('gold deep is the shipped stage-2 #9B8020', gold.deep === '#9B8020', gold.deep)
  check('gold dark is the shipped stage-3 #6B5A15', gold.dark === '#6B5A15', gold.dark)
  check('gold darkest is the shipped stage-4 #3D330B', gold.darkest === '#3D330B', gold.darkest)
  check('gold day text is the shipped #8E6D1A', gold.dayText === '#8E6D1A', gold.dayText)

  const vars = lpAccentVars(null)
  check('no accent → only --color-gold = BRAND.accent (nothing else set)',
    Object.keys(vars).length === 1 && vars['--color-gold'] === BRAND.accent, JSON.stringify(vars))

  check('default night gradient keeps the shipped gold wash byte-identically',
    lpPalette('night').bgGradient.includes('rgba(212,175,55,0.18)'))
  check('a chosen accent swaps the wash — no gold residue in its gradient',
    (() => { const g = lpPalette('night', null, resolveLpAccent('emerald')).bgGradient
      return !g.includes('212,175,55') && g.includes('47,163,107') })())
  check('signature keeps its lagoon atmosphere under any accent',
    lpPalette('night', 'signature', resolveLpAccent('burgundy')).bgGradient.includes('rgba(45,180,190'))

  const page = readFileSync(join(process.cwd(), 'app/lp/[slug]/page.tsx'), 'utf8')
  check('page CTA hover falls back to the shipped hex', page.includes('var(--lp-gold-bright,#E8C547)'))
  check('page day text falls back to the shipped hex', page.includes('var(--lp-gold-day-text,#8E6D1A)'))
  for (const [v, hex] of [['--lp-gold-deep', '#9B8020'], ['--lp-gold-mid', '#C9A227'], ['--lp-gold-dark', '#6B5A15'], ['--lp-gold-darkest', '#3D330B']] as const) {
    check(`page shade ${v} falls back to the shipped ${hex}`, page.includes(`var(${v}, ${hex})`))
  }
}

console.log('\n── the accent rides CSS vars, not forked markup ──')
{
  const page = readFileSync(join(process.cwd(), 'app/lp/[slug]/page.tsx'), 'utf8')
  check('the page root spreads lpAccentVars', page.includes('...lpAccentVars(accent)'))
  check('the page resolves the stored key through the registry', page.includes('resolveLpAccent(page.palette)'))

  // The lead form and sticky CTA froze #D4AF37 mid-refactor — they now use the
  // gold utilities so brand overrides AND accent picks retint them too.
  for (const f of ['app/lp/[slug]/_form.tsx', 'app/lp/[slug]/_sticky.tsx']) {
    check(`${f} carries no frozen #D4AF37 literal`,
      !readFileSync(join(process.cwd(), f), 'utf8').includes('#D4AF37'))
  }

  const store = readFileSync(join(process.cwd(), 'lib/landing-pages.ts'), 'utf8')
  check('the store has the palette column', store.includes('ADD COLUMN IF NOT EXISTS palette text'))
  check('the readers sanitize through the registry',
    (store.match(/resolveLpAccent\(row\.palette\)\?\.key \?\? ""/g) ?? []).length >= 2)

  const api = readFileSync(join(process.cwd(), 'app/api/crm/landing-pages/[slug]/route.ts'), 'utf8')
  check('the editor API persists a registry-sanitized key only',
    api.includes('resolveLpAccent(body?.palette)?.key ?? ""') && api.includes('palette = $20'))
}

if (failures > 0) {
  console.error(`\n${failures} landing-accent guard(s) broken.`)
  process.exit(1)
}
console.log('\nThe landing pages recolor; no pick is still yesterday\'s page.\n')
