/**
 * A DESIGN TOKEN MUST RENDER THE COLOUR IT CLAIMS.
 *
 * This repo runs two apps with two colour dictionaries, and the plan to unify
 * them rests entirely on one mechanical move: replace a hardcoded literal with
 * the token that means the same thing. That move is only safe if the token
 * really is the same colour — otherwise every "no-op" codemod silently
 * restyles the product.
 *
 * It was not safe. Three tokens in app/globals.css declared an HSL triple and
 * then named a DIFFERENT hex in their own comment:
 *
 *   --foreground   156 37% 13%  claimed #152E24, rendered #11221C
 *   --background    36 33% 97%  claimed #FAF8F5, rendered #FBFAF9
 *   --primary       41 54% 51%  claimed #C69B3E, rendered #C49645
 *
 * #152E24 is hardcoded 413 times across the public tenant site. Had anyone
 * converted those to `text-foreground` believing the comment, the site would
 * have shifted colour on every one of them, in a diff that looked like a
 * cleanup. The comment was the documentation AND the migration's contract, and
 * it was wrong.
 *
 * Pure arithmetic — no model, no network, no DOM. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

/** CSS `H S% L%` → `#RRGGBB`, the same conversion the browser performs. */
function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100
  const lum = l / 100
  const c = (1 - Math.abs(2 * lum - 1)) * sat
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = lum - c / 2
  const seg = Math.floor(((h % 360) + 360) % 360 / 60)
  const [r, g, b] = [
    [c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x],
  ][seg]
  const to = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0').toUpperCase()
  return `#${to(r)}${to(g)}${to(b)}`
}

console.log('\n── a token renders the colour its comment claims ──')
{
  const src = readFileSync(join(ROOT, 'app/globals.css'), 'utf8')
  // Only tokens that NAME a hex are testable — a token with no claim makes no
  // promise to break.
  const claims = [
    ...src.matchAll(/--([a-z-]+):\s*([\d.]+)\s+([\d.]+)%\s+([\d.]+)%;\s*\/\*[^*]*?(#[0-9A-Fa-f]{6})/g),
  ]
  check('tokens that name a hex were found to check', claims.length > 0, `found ${claims.length}`)

  const liars: string[] = []
  for (const m of claims) {
    const [, name, h, s, l, claimed] = m
    const rendered = hslToHex(Number(h), Number(s), Number(l))
    if (rendered.toUpperCase() !== claimed.toUpperCase()) {
      liars.push(`--${name} renders ${rendered} but its comment claims ${claimed.toUpperCase()}`)
    }
  }
  check(
    `every named token renders its claimed hex (${claims.length} checked)`,
    liars.length === 0,
    liars.join('\n      '),
  )
}

console.log('\n── the colours a migration is allowed to converge on ──')
{
  // WHY: the unification's whole premise is that duplicate colour families
  // collapse onto one value each. These are the survivors, so a token file that
  // stops naming them means somebody re-forked a family without saying so.
  const src = readFileSync(join(ROOT, 'app/globals.css'), 'utf8')
  for (const [hex, role] of [
    ['#152E24', 'the public tenant site ink (hardcoded 413 times — the largest single literal family)'],
    ['#C69B3E', 'the tenant brand gold, the survivor of five competing golds'],
  ] as const) {
    check(`${hex} is still declared as ${role}`, src.toUpperCase().includes(hex), 'not found in app/globals.css')
  }
}

console.log('\n── the semantic ramp reaches the utilities without forking ──')
{
  // WHY: `border-caution/40` only exists if @theme names --color-caution, and
  // a :root variable cannot be referenced from @theme by its own name. So
  // globals.css restates the ten semantic hexes — and this is the check that
  // keeps them the same ten hexes as design/tokens.css.
  const tok = readFileSync(join(ROOT, 'design/tokens.css'), 'utf8')
  const glob = readFileSync(join(ROOT, 'app/globals.css'), 'utf8')
  const theme = glob.slice(glob.indexOf('\n@theme {'), glob.indexOf('\n@theme inline {'))
  const roles = ['positive', 'positive-bright', 'caution', 'caution-bright', 'warning', 'warning-bright', 'danger', 'danger-bright', 'neutral', 'neutral-bright']
  const drift: string[] = []
  for (const r of roles) {
    const a = tok.match(new RegExp(`--color-${r}:\\s*(#[0-9A-Fa-f]{6})`))?.[1]
    const b = theme.match(new RegExp(`--color-${r}:\\s*(#[0-9A-Fa-f]{6})`))?.[1]
    if (!a || !b || a.toUpperCase() !== b.toUpperCase()) drift.push(`${r}: tokens ${a ?? '—'} vs @theme ${b ?? '—'}`)
  }
  check(`the ten semantic roles are utilities, and match design/tokens.css`, drift.length === 0, drift.join('; '))
  check('the family accent is a utility (bg-brand / text-brand / text-brand-ink)',
    /--color-brand:\s*var\(--brand\)/.test(theme) && /--color-brand-ink:\s*var\(--brand-ink\)/.test(theme))
}

console.log('\n── the light ramp IS the Terminal\'s palette ──')
{
  // WHY: the owner's ruling — "the Terminal's colours are soft and beautiful;
  // the business site feels hard; everything has to be one." The light theme
  // is therefore not a light version of this product's ramp; it is the
  // Terminal's :root, value for value (ezz-ae/Entrestate_os app/globals.css).
  const glob = readFileSync(join(ROOT, 'app/globals.css'), 'utf8')
  const light = glob.slice(glob.indexOf('.theme-light {'), glob.indexOf('.theme-light body'))
  for (const [role, hex] of [
    ['--color-app', '#f5f7fa'], ['--color-surface', '#ffffff'], ['--color-ink', '#0f151d'],
    ['--color-ink-muted', '#4a5563'], ['--color-line', '#d5dde7'], ['--brand', '#2f5aa6'],
  ] as const) {
    check(`${role} is the Terminal's ${hex}`, new RegExp(`${role}:\\s*${hex}`, 'i').test(light))
  }
}

console.log('\n── the vendor\'s surfaces wear the Terminal\'s dark room ──')
{
  // WHY: shown a white business site the owner said "the black is good; the
  // idea is the softness of the other design — the edges and the gradations".
  // So the business site is dark, and its dark is the Terminal's .llm-theme,
  // value for value: a card one clear step above the ground, a solid border.
  const glob = readFileSync(join(ROOT, 'app/globals.css'), 'utf8')
  const dark = glob.slice(glob.indexOf('.theme-terminal {'), glob.indexOf('.theme-light {'))
  for (const [role, hex] of [
    ['--color-app', '#07090d'], ['--color-surface', '#0f131a'], ['--color-surface-2', '#141a26'],
    ['--color-ink', '#f8fafc'], ['--color-ink-muted', '#94a3b8'], ['--color-line', '#1f2937'], ['--brand', '#3b82f6'],
  ] as const) {
    check(`${role} is the Terminal's ${hex}`, new RegExp(`${role}:\\s*${hex}`, 'i').test(dark))
  }
  const biz = readFileSync(join(ROOT, 'app/business/layout.tsx'), 'utf8')
  check('the business site wears it by class, whatever the workspace theme', /className="theme-terminal /.test(biz))
  const signup = readFileSync(join(ROOT, 'app/signup/signup-client.tsx'), 'utf8')
  check('…and so does the sign-up screen', /className="theme-terminal /.test(signup))
}

console.log('\n── one token source, generated into both build roots ──')
{
  // WHY: two apps, two package.json files, two Vercel roots and no pnpm
  // workspace. A hand-copied token file is precisely how the two visual
  // languages diverged in the first place, so the copies are generated and
  // then asserted identical rather than trusted.
  const src = readFileSync(join(ROOT, 'design/tokens.css'), 'utf8')
  for (const rel of ['app/tokens.css']) {
    let copy = ''
    try { copy = readFileSync(join(ROOT, rel), 'utf8') } catch { /* reported below */ }
    const body = copy.slice(copy.indexOf('*/') + 2).trimStart()
    check(`${rel} is current with design/tokens.css`,
      body === src.trimStart(),
      copy ? 'drifted — run `npx tsx scripts/gen-tokens.ts`' : 'missing — run `npx tsx scripts/gen-tokens.ts`')
  }
}

console.log('\n── the core holds no brand colour ──')
{
  // WHY: the whole architecture is that structure is achromatic and brand
  // arrives only through the palette. The moment a NEUTRAL is defined as a
  // brand hue, every tenant inherits somebody else's identity in their chrome
  // — which is the state this repo is migrating out of.
  const src = readFileSync(join(ROOT, 'design/tokens.css'), 'utf8')
  const banned = ['#C69B3E', '#D4AC50', '#D4AF37', '#C9A961', '#152E24', '#3a6fb8']
  const neutrals = [...src.matchAll(/--n-\d+:\s*(#[0-9A-Fa-f]{6})/g)].map((m) => m[1].toUpperCase())
  check(`the neutral ramp was found (${neutrals.length} steps)`, neutrals.length >= 8, neutrals.join(' '))
  const branded = neutrals.filter((n) => banned.map((b) => b.toUpperCase()).includes(n))
  check('no neutral step is a brand colour', branded.length === 0, branded.join(' '))

  // WHY: a tenant sets colour AND degree. If a structural role stops mixing the
  // degree in, that surface silently opts out of the tenant's brand and the
  // product looks half-skinned — the exact complaint white-label customers make.
  // WHY --brand and not --color-accent: globals.css already owns
  // --color-accent as shadcn's muted surface colour. One name, two meanings,
  // is how a cascade becomes a coin-flip.
  for (const role of ['--color-app', '--color-surface', '--color-chrome']) {
    const m = src.match(new RegExp(role + ':\\s*([^;]+);'))
    check(`${role} mixes the brand degree`,
      !!m && m[1].includes('--brand-degree') && m[1].includes('--brand'),
      m ? m[1].trim() : 'not declared')
  }
  check('the degree defaults inside the legible range',
    /--brand-degree:\s*([0-9]|1[0-4])%/.test(src),
    (src.match(/--brand-degree:[^;]*/) ?? ['not declared'])[0])
}

console.log(
  failures
    ? `\n${failures} design-token rule(s) broken.`
    : '\nEvery token renders what it says it renders.',
)
process.exit(failures ? 1 : 0)
