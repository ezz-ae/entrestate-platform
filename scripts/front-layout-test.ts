/**
 * The front-page builder's contract, locked.
 *
 * The builder lets a manager reorder, hide, recolor and extend the public
 * front pages. Its whole safety story is three rules with a shared spirit
 * (the fallback is the code):
 *
 *   1. THE REGISTRIES ARE THE CONTRACT — the sanitizer drops anything the
 *      registries do not name, and appends any section a stored layout
 *      forgot, so new code always shows and stale rows never crash.
 *   2. AN EMPTY STORE RENDERS TODAY'S SITE — the default palette's hexes are
 *      the exact values the pages hardcoded before the builder existed, and
 *      the published reader returns null (→ built-in order) on any failure.
 *   3. A REGISTERED SECTION MUST RENDER — every key in FRONT_SECTIONS has a
 *      matching entry in its page's sections map, or a layout mentioning it
 *      would silently drop a section of the public site.
 *
 * What is NOT tested here: the DB read/write (needs Postgres) and the visual
 * result (needs a render). Pure — no model, no database, no network.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  FRONT_PAGES, FRONT_SECTIONS, FRONT_BLOCKS, FRONT_PALETTES, DEFAULT_PALETTE,
  sanitizeFrontLayout, defaultFrontLayout, paletteVars,
} from '../lib/freehold/front-layout'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

console.log('\n── the registries are the contract ──')
{
  const hostile = sanitizeFrontLayout('home', {
    palette: 'neon-vapor',
    items: [
      { kind: 'section', type: 'hero' },
      { kind: 'section', type: 'hero' },                       // duplicate
      { kind: 'section', type: 'adminPanel' },                 // unknown section
      { kind: 'block', type: 'iframe', data: { src: 'x' } },   // unknown block
      { kind: 'block', type: 'text', data: { title: '  T ', evil: 'x', body: 'B'.repeat(9000), tone: 'plaid' } },
      'not-an-object',
      { kind: 'block' },                                       // no type
    ],
  })
  check('unknown section keys are dropped', !hostile.items.some((i) => i.type === 'adminPanel'))
  check('unknown block types are dropped', !hostile.items.some((i) => i.type === 'iframe'))
  check('a duplicate section keeps its first appearance only',
    hostile.items.filter((i) => i.kind === 'section' && i.type === 'hero').length === 1)
  check('unregistered data keys are dropped',
    !JSON.stringify(hostile.items.find((i) => i.type === 'text')?.data).includes('evil'))
  check('values are trimmed and length-capped',
    (() => { const d = hostile.items.find((i) => i.type === 'text')?.data ?? {}; return d.title === 'T' && (d.body ?? '').length <= 2000 })())
  check('a select field rejects a value outside its options',
    !(hostile.items.find((i) => i.type === 'text')?.data ?? {}).tone)
  check('an unknown palette falls back to the shipped one', hostile.palette === DEFAULT_PALETTE, hostile.palette)

  const homeKeys = FRONT_SECTIONS.home.map((s) => s.key)
  check('forgotten sections are appended VISIBLE — new code must show, not vanish',
    homeKeys.every((k) => hostile.items.some((i) => i.kind === 'section' && i.type === k && !i.hidden || i.kind === 'section' && i.type === k)),
    hostile.items.map((i) => i.type).join(','))
  check('the appended sections are not hidden',
    hostile.items.filter((i) => i.kind === 'section' && i.type !== 'hero').every((i) => !i.hidden))
  check('garbage in, built-in order out',
    (() => { const g = sanitizeFrontLayout('about', 'garbage'); return g.items.map((i) => i.type).join(',') === FRONT_SECTIONS.about.map((s) => s.key).join(',') })())
}

console.log('\n── an empty store renders today\'s site ──')
{
  // These four hexes are what the pages hardcoded before the builder
  // existed. If they drift, "no layout" and "yesterday's site" stop being
  // the same thing — that is a design change, and it must be made here
  // knowingly, in globals.css AND in FRONT_PALETTES[0], together.
  const v = paletteVars(DEFAULT_PALETTE)
  check('default dark surface is the shipped deep green', v['--fp-dark'] === '#0A1F17', String(v['--fp-dark']))
  check('default light band is the shipped cream', v['--fp-cream'] === '#F2EFE8', String(v['--fp-cream']))
  check('default accent is the shipped gold', v['--fp-accent'] === '#D4AC50', String(v['--fp-accent']))
  check('default soft accent is the shipped pale gold', v['--fp-accent-soft'] === '#F0D792', String(v['--fp-accent-soft']))

  const css = readFileSync(join(process.cwd(), 'app/globals.css'), 'utf8')
  check('globals.css fallbacks agree with the default palette',
    css.includes('var(--fp-dark, #0A1F17)') && css.includes('var(--fp-cream, #F2EFE8)')
    && css.includes('var(--fp-accent, #D4AC50)') && css.includes('var(--fp-accent-soft, #F0D792)'))

  check('every palette carries all four colors',
    FRONT_PALETTES.every((p) => [p.dark, p.cream, p.accent, p.accentSoft].every((c) => /^#[0-9A-Fa-f]{6}$/.test(c))))
  check('palette keys are unique', new Set(FRONT_PALETTES.map((p) => p.key)).size === FRONT_PALETTES.length)

  const src = readFileSync(join(process.cwd(), 'lib/freehold/front-layout.ts'), 'utf8')
  check('the published reader swallows failure and returns null (resilience at the reader)',
    /getPublishedFrontLayout[\s\S]{0,600}catch\s*\{\s*\n?\s*return null/.test(src))

  const def = defaultFrontLayout('services')
  check('the default layout is the registry order, nothing hidden',
    def.items.every((i, idx) => i.kind === 'section' && i.type === FRONT_SECTIONS.services[idx].key && !i.hidden)
    && def.palette === DEFAULT_PALETTE)
}

console.log('\n── a registered section must render ──')
{
  const PAGE_FILE: Record<string, string> = {
    home: 'app/page.tsx',
    about: 'app/about/page.tsx',
    services: 'app/services/page.tsx',
    contact: 'app/contact/page.tsx',
  }
  for (const page of FRONT_PAGES) {
    const src = readFileSync(join(process.cwd(), PAGE_FILE[page]), 'utf8')
    const missing = FRONT_SECTIONS[page].filter((s) => !new RegExp(`^\\s*${s.key}:`, 'm').test(src))
    check(`${page}: every registered section appears in the sections map`,
      missing.length === 0, missing.map((s) => s.key).join(','))
    check(`${page}: reads the published layout and renders through the canvas`,
      src.includes(`getPublishedFrontLayout('${page}')`) && src.includes('FrontCanvas'))
  }

  const render = readFileSync(join(process.cwd(), 'components/front/render.tsx'), 'utf8')
  check('the canvas skips hidden items', /item\.hidden\)\s*return null/.test(render))
  check('the canvas leans closed on an unknown section key', /node \? .*: null/.test(render))

  const blocksSrc = readFileSync(join(process.cwd(), 'components/front/blocks.tsx'), 'utf8')
  for (const type of Object.keys(FRONT_BLOCKS)) {
    check(`generic block '${type}' has a renderer`, new RegExp(`case '${type}':`).test(blocksSrc))
  }
  check('an empty generic block renders nothing (no blank bands on the public site)',
    /return null/.test(blocksSrc))
}

if (failures > 0) {
  console.error(`\n${failures} front-layout guard(s) broken.`)
  process.exit(1)
}
console.log('\nThe front pages rearrange; the code remains the floor they stand on.\n')
