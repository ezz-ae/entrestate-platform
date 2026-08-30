/**
 * Copy design/tokens.css into the build root.
 *
 * This used to write two copies, the second into apps/terminal/app/tokens.css.
 * apps/terminal was a full vendored copy of the Terminal, kept here because the
 * Terminal was believed to build from entrestate-platform/apps/terminal. It
 * never did — the Vercel project entrestate-os builds ezz-ae/Entrestate_os from
 * its root — so that copy was a design token generated into a directory nobody
 * deploys, while the real Terminal's tokens went unmanaged the whole time.
 *
 * Sharing tokens across the two products again needs a published package, not a
 * file written across a repository boundary that does not exist.
 * scripts/design-tokens-test.ts still fails the build if the remaining copy
 * drifts from the source, which is the failure mode a hand-copied file invites.
 *
 * Runs at the head of `pnpm guards`, the same way the chain already opens with
 * gen-app-routes.ts.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
export const TOKEN_SOURCE = 'design/tokens.css'
export const TOKEN_COPIES = ['app/tokens.css']

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
