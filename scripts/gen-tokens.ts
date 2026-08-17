/**
 * Copy design/tokens.css into both build roots.
 *
 * apps/terminal has its own package.json, its own lockfile and its own Vercel
 * root directory, and this repo has no pnpm workspace — so the two apps cannot
 * share an import without a build-infrastructure change riding along with a
 * design one. A generated copy keeps the design change shippable on its own,
 * and scripts/design-tokens-test.ts fails the build if the copies ever drift
 * from the source, which is the failure mode a hand-copied file would invite.
 *
 * Runs at the head of `pnpm guards`, the same way the chain already opens with
 * gen-app-routes.ts.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const TOKEN_SOURCE = 'design/tokens.css'
export const TOKEN_COPIES = ['app/tokens.css', 'apps/terminal/app/tokens.css']

const BANNER =
  '/* GENERATED FROM design/tokens.css BY scripts/gen-tokens.ts — DO NOT EDIT.\n' +
  '   Edit the source and re-run `pnpm guards`. */\n'

function main() {
  const src = readFileSync(join(ROOT, TOKEN_SOURCE), 'utf8')
  for (const rel of TOKEN_COPIES) {
    const out = join(ROOT, rel)
    mkdirSync(dirname(out), { recursive: true })
    writeFileSync(out, BANNER + src)
    console.log(`  tokens → ${rel}`)
  }
}

main()
