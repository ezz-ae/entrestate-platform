/**
 * THIS REPOSITORY BUILDS ONE APP, AND IT IS THE ONE IT DEPLOYS.
 *
 * For months it carried `apps/terminal/` — a 1,317-file, 22 MB copy of
 * ezz-ae/Entrestate_os, complete with its own package.json, pnpm-lock.yaml,
 * next.config.mjs, proxy.ts, app/ and lib/. It was vendored on the belief that
 * the Vercel project `entrestate-os` built from
 * entrestate-platform/apps/terminal. It never did: that project builds
 * Entrestate_os from its own root. The Root Directory setting still SAID
 * apps/terminal, which is why the first commit ever pushed to the Terminal's
 * repository failed to deploy with "The specified Root Directory apps/terminal
 * does not exist."
 *
 * A copy nobody deploys is not idle. Five things in this repository read it and
 * reported on it as though it were the product:
 *
 *   · scripts/terminal-price-test.ts froze the paid tiers there. The deployed
 *     file kept `case "realtor": return "team"`, so /checkout?tier=realtor
 *     quoted AED 999 — the brokerage price — for the one-agent product, and
 *     posted it to Tap. The guard asserted that alias was gone, and passed.
 *   · scripts/gen-tokens.ts generated the design tokens into it, so the real
 *     Terminal's tokens went unmanaged while a guard confirmed "both copies" in
 *     sync.
 *   · scripts/lockfile-sync-test.ts checked a package.json/lockfile pair no
 *     install has ever used.
 *   · scripts/terminal-typecheck-ratchet.ts measured type debt nobody ships.
 *   · .github/workflows/ci.yml installed and checked it on every push.
 *
 * Every one of those was green. That is the cost: a vendored copy does not sit
 * quietly, it absorbs the guards meant for the real thing and returns a pass.
 *
 * So: no second application under this root. If the two products must share
 * code, it goes out as a published package, or the repositories merge on
 * purpose with one lockfile and one Vercel project — not by copying a tree in
 * and pointing the tooling at the copy.
 *
 * Pure — filesystem only. Runs in `pnpm guards`.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const cwd = process.cwd()
let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      got: ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

/**
 * A nested application announces itself with its own package.json — that is
 * what makes it a build root rather than a folder of source. Directories that
 * legitimately carry one (a published package, a tool with its own deps) go
 * here WITH the reason, so admitting one stays a decision.
 */
const ALLOWED_NESTED_ROOTS: Record<string, string> = {}

/** Where a vendored app would land. Checked by name as well as by scan. */
const FORBIDDEN_DIRS = ['apps', 'packages/terminal', 'terminal', 'entrestate_os', 'Entrestate_os']

console.log('\n── no second application is vendored under this root ──')
{
  for (const dir of FORBIDDEN_DIRS) {
    check(`${dir}/ does not exist`, !existsSync(join(cwd, dir)),
      `${dir}/ is back — a second app belongs in its own repository`)
  }
}

console.log('\n── nothing nested declares its own build ──')
{
  const skip = new Set(['node_modules', '.next', '.git', '.vercel', 'public'])
  const found: string[] = []
  const walk = (rel: string, depth: number) => {
    if (depth > 3) return
    let entries
    try { entries = readdirSync(join(cwd, rel), { withFileTypes: true }) } catch { return }
    for (const e of entries) {
      if (!e.isDirectory() || skip.has(e.name) || e.name.startsWith('.')) continue
      const child = rel ? `${rel}/${e.name}` : e.name
      if (existsSync(join(cwd, child, 'package.json'))) {
        if (!(child in ALLOWED_NESTED_ROOTS)) found.push(child)
        continue // its contents are its own problem
      }
      walk(child, depth + 1)
    }
  }
  walk('', 0)
  check('no nested package.json outside the allowlist', found.length === 0,
    `${found.join(', ')} — add it to ALLOWED_NESTED_ROOTS with the reason, or move it out`)
}

console.log('\n── the tooling points at this root, not at a copy ──')
{
  // Each of these read the vendored copy. If one names a second root again, the
  // copy came back with it.
  const files: Record<string, string> = {
    'package.json': readFileSync(join(cwd, 'package.json'), 'utf8'),
    'scripts/gen-tokens.ts': readFileSync(join(cwd, 'scripts/gen-tokens.ts'), 'utf8'),
    'scripts/lockfile-sync-test.ts': readFileSync(join(cwd, 'scripts/lockfile-sync-test.ts'), 'utf8'),
    'scripts/design-tokens-test.ts': readFileSync(join(cwd, 'scripts/design-tokens-test.ts'), 'utf8'),
    '.github/workflows/ci.yml': readFileSync(join(cwd, '.github/workflows/ci.yml'), 'utf8'),
  }
  for (const [name, src] of Object.entries(files)) {
    // Comments explain the history on purpose; only live references count.
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*(?:\/\/|#).*$/gm, '')
    check(`${name} does not reach into apps/terminal`, !code.includes('apps/terminal'),
      code.split('\n').find((l) => l.includes('apps/terminal'))?.trim() ?? '')
  }
}

console.log('\n── the price this product quotes still names where it is decided ──')
{
  // The AED 999 on /business/pricing is the Terminal's Team tier, and that
  // literal lives in ezz-ae/Entrestate_os — a boundary no guard here can cross.
  // The least this repository can do is keep the pointer accurate, so the next
  // person changes the deciding file rather than this one.
  const page = readFileSync(join(cwd, 'app/business/pricing/page.tsx'), 'utf8')
  check('the pricing page still quotes the agreed monthly figure',
    page.includes('AED 999 / month'), 'AED 999 not found')
  check('…and the annual figure beside it', page.includes('AED 9,588 / year'), '9,588 missing')
  check('and it names the repository where that number is decided',
    page.includes('Entrestate_os') && page.includes('lib/pricing/plans.ts'),
    'the comment no longer says where to change the price first')

  const onepager = readFileSync(join(cwd, 'scripts/build-onepager.ts'), 'utf8')
  check('the one-pager quotes the same monthly figure',
    onepager.includes('AED 999/month'), 'AED 999 not in build-onepager.ts')
}

if (failures > 0) {
  console.error(`\n${failures} one-build-root rule(s) broken.\n`)
  process.exit(1)
}
console.log('\n  one build root, and the tooling points at it.\n')
