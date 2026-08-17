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

console.log(
  failures
    ? `\n${failures} design-token rule(s) broken.`
    : '\nEvery token renders what it says it renders.',
)
process.exit(failures ? 1 : 0)
