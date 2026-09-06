/**
 * THE BUSINESS SITE FITS THE PHONE — locked.
 *
 * The owner opened entrestate.com/business on his phone and the hero crop
 * hung off the right edge: "Each property has a dedicated ad landing p…",
 * the third figure cut in half, the row's buttons past the fold. The cause
 * was one line in the reel — a bare `grid`, whose item min-width is `auto`,
 * so the single column sized itself to the WIDEST frame's min-content
 * instead of to the screen. Everything inside then inherited that lie: the
 * crops were drawn for a desktop column and never measured against 390px.
 *
 * The rules this file keeps, so the phone stays first:
 *
 *   1. THE REEL IS MEASURED BY THE SCREEN. Its column is `minmax(0,1fr)`
 *      and its frames are `min-w-0`. A bare `grid` here is the bug again.
 *   2. A PHONE TURNS A CAROUSEL BY DRAGGING. The reel takes a swipe, and
 *      its dots are 6px of paint inside a 44px target.
 *   3. NO CROP STARTS WIDER THAN THREE COLUMNS. Four figures or five chips
 *      across is a desktop layout; below `sm` a crop has ~300px, and a
 *      four-up grid there wraps words mid-word. Wider grids must be
 *      breakpoint-prefixed (`sm:grid-cols-4`).
 *   4. NOTHING INSIDE A CROP IS WIDER THAN THE COLUMN. A fixed `max-w`
 *      above 17rem must be `sm:`-prefixed; the phone gets the smaller one.
 *   5. THE PAGE KEEPS ITS MARGINS ON A PHONE. The section gutter and the
 *      holder inset both step down below `sm`, because they stack: gutter
 *      + holder + crop padding was 96px of chrome on a 390px screen.
 *   6. NO HERO STACKS TWO LAYERS IN ONE GRID CELL. The rotated collage —
 *      a crop over a whole screenshot — has no phone layout: below `sm`
 *      the layers land on each other. Every product hero is a CropReel.
 *
 * Pure — no network. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const read = (rel: string) => readFileSync(join(process.cwd(), rel), 'utf8')
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1')

const REEL = stripComments(read('components/business/crop-reel.tsx'))
const CROPS = stripComments(read('components/business/crops.tsx'))
const HOLDERS = stripComments(read('components/business/holders.tsx'))
const UI = stripComments(read('components/business/ui.tsx'))

console.log('\n── 1. the reel is measured by the screen, not by its widest frame ──')
{
  check('the stack\'s column is minmax(0,1fr)', REEL.includes('grid grid-cols-[minmax(0,1fr)]'),
    (REEL.match(/className="grid[^"]*"/) ?? [''])[0])
  check('a bare `grid` (item min-width: auto) is not back', !/className="grid"/.test(REEL))
  check('every frame is min-w-0', /col-start-1 row-start-1 min-w-0/.test(REEL))
}

console.log('\n── 2. a phone turns it by dragging, and can hit the dots ──')
{
  check('the reel takes a swipe', REEL.includes('onTouchStart') && REEL.includes('onTouchEnd'))
  check('a swipe is 40px and more horizontal than vertical',
    /Math\.abs\(dx\) < 40 \|\| Math\.abs\(dx\) < Math\.abs\(t\.clientY - start\.y\)/.test(REEL))
  check('a scroll is not a turn: the guard returns before go()',
    REEL.indexOf('clientY - start.y') < REEL.indexOf('go(i +'))
  check('the dot sits in a 44px target', /className="group grid h-11 w-6/.test(REEL))
}

console.log('\n── 3. no crop starts wider than three columns ──')
{
  // Every grid-cols-N in the file, with whatever prefix it carries.
  const wide: string[] = []
  for (const m of CROPS.matchAll(/(^|[\s"'`])((?:[a-z-]+:)*)grid-cols-(\d+)/g)) {
    const prefix = m[2]
    const cols = Number(m[3])
    if (!prefix && cols > 3) wide.push(m[0].trim())
  }
  check('the base grid is never 4+ columns — that width is breakpoint-prefixed', wide.length === 0, wide.join(', '))
  check('the wide layouts are still there, behind sm:', /sm:grid-cols-4/.test(CROPS) && /sm:grid-cols-5/.test(CROPS))
}

console.log('\n── 4. nothing inside a crop is wider than the column ──')
{
  const over: string[] = []
  for (const m of CROPS.matchAll(/((?:[a-z-]+:)*)max-w-\[(\d+(?:\.\d+)?)rem\]/g)) {
    if (!m[1] && Number(m[2]) > 17) over.push(m[0])
  }
  check('an unprefixed max-w is at most 17rem (a 320px screen minus its chrome)', over.length === 0, over.join(', '))
  check('the lead-form phone keeps its full size from sm up', /sm:max-w-\[19rem\]/.test(CROPS))
}

console.log('\n── 5. the page keeps its margins on a phone ──')
{
  check('the section gutter steps down below sm', /px-5 sm:px-6 lg:px-10/.test(UI))
  check('the holder inset steps down below sm', /'p-5 sm:p-8 lg:p-12'/.test(HOLDERS) && /'p-6 sm:p-12 lg:p-16'/.test(HOLDERS))
}

console.log('\n── 6. rows that cannot fit, wrap ──')
{
  // A row of buttons or a sentence beside a chip must be allowed to wrap —
  // on a phone the alternative is a squeezed word or a cut button.
  for (const [what, re] of [
    ['the lead card\'s three actions', /mt-3 flex flex-wrap gap-2">\s*<Btn primary>Call<\/Btn>/],
    ['the microsite\'s address and buttons', /flex flex-wrap items-center justify-between gap-3 rounded-xl/],
    ['the audience\'s lookalike line', /mt-3 flex flex-wrap items-center justify-between gap-2 text-\[13px\]/],
    ['the spend rule and its chip', /flex flex-wrap items-center justify-between gap-2">\s*<span className="text-\[13px\] text-ink">If/],
    ['the reach rows stack their label', /flex flex-col gap-0\.5 bg-surface-2\/60[^"]*sm:flex-row/],
  ] as const) {
    check(`${what} wraps`, re.test(CROPS))
  }
}

console.log('\n── no hero stacks two layers in one cell ──')
{
  // Four product heroes used to overlap a crop and a whole screenshot in one
  // grid cell, each rotated a degree or two. That reads on a laptop and
  // collapses on a phone: below `sm` the two layers land on top of each
  // other, and the screen underneath was 8px type at any width. Each of
  // those heroes is now a CropReel — one crop at a time, at reading size.
  const HERO_PAGES = [
    'app/business/page.tsx',
    'app/business/lead-machine/page.tsx',
    'app/business/leadformer/page.tsx',
    'app/business/meta-for-realtors/page.tsx',
    'app/business/landing-pages/page.tsx',
    'app/business/mega-brokerage/product-page.tsx',
  ]
  for (const rel of HERO_PAGES) {
    const src = stripComments(read(rel))
    check(`${rel.split('/').slice(2).join('/')} leads with the reel`, /<CropReel/.test(src))
    check(`…and stacks nothing behind it`, !/sm:col-start-1 sm:row-start-1/.test(src) && !/sm:-?rotate-[12]/.test(src))
  }
}

if (failures > 0) {
  console.error(`\n${failures} phone rule(s) broken.`)
  process.exit(1)
}
console.log('\nThe site is measured by the phone it is read on.\n')
