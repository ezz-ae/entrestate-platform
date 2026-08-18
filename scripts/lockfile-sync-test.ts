/**
 * THE LOCKFILE AND package.json AGREE — locked.
 *
 * A dependency was removed from package.json and pnpm-lock.yaml was left
 * alone. Every gate in `pnpm guards` passed, typecheck passed, and
 * `rm -rf .next && pnpm build` passed — because a local build reuses
 * node_modules and never reinstalls.
 *
 * Vercel does not. It runs `pnpm install --frozen-lockfile`, which refuses when
 * the lockfile does not match package.json. Every deployment after that commit
 * failed in about five seconds, on BOTH projects, production and preview — and
 * nothing in the local gauntlet could see it. The site went stale while four
 * gates reported green.
 *
 * So this is the gate for the thing the other gates structurally cannot check:
 * the gauntlet runs against installed packages, and this runs against the two
 * files that decide what gets installed.
 *
 * IT COVERS BOTH BUILD ROOTS, and that is not symmetry for its own sake. There
 * are two Vercel projects in this repository — `entrestate` at the root and
 * `entrestate-os` with Root Directory `apps/terminal` — each with its OWN
 * package.json and its OWN pnpm-lock.yaml, because there is no pnpm workspace
 * joining them. The incident above hit both projects at once, and the first
 * version of this guard checked only the root. The Terminal half is the more
 * dangerous one to leave open: `pnpm guards`, `pnpm typecheck` and `pnpm i18n`
 * all run against the platform root and mention `apps/terminal` zero times,
 * the Terminal's build sets `typescript: { ignoreBuildErrors: true }`, and it
 * is not the deployment anybody watches. A frozen-lockfile failure there is
 * silent until somebody opens terminal.entrestate.com.
 *
 * Pure — reads four files, no install, no network. Runs in `pnpm guards`.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const cwd = process.cwd()

/**
 * The two build roots. Each is a separate Vercel project with its own
 * package.json + pnpm-lock.yaml pair; neither install can see the other.
 */
const ROOTS = [
  { dir: '.', label: 'platform (Vercel project: entrestate)' },
  { dir: 'apps/terminal', label: 'terminal (Vercel project: entrestate-os)' },
] as const

for (const { dir, label } of ROOTS) {
  console.log(`\n── ${label} ──`)

  const pkgPath = join(cwd, dir, 'package.json')
  const lockPath = join(cwd, dir, 'pnpm-lock.yaml')

  let pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
  let lock: string
  try {
    pkg = JSON.parse(readFileSync(pkgPath, { encoding: 'utf8' }))
    lock = readFileSync(lockPath, { encoding: 'utf8' })
  } catch (e) {
    // A missing pair is a failure, not a skip. A root that loses its lockfile
    // cannot install on Vercel at all, and silently passing here would report
    // green on exactly that.
    fail(`${dir}: package.json and pnpm-lock.yaml are both readable`,
      e instanceof Error ? e.message : String(e))
    continue
  }

  /**
   * The root importer block — what pnpm believes this package.json asks for.
   *
   * Read as a slice rather than parsed as YAML: the `packages:` section further
   * down lists every TRANSITIVE dependency too, so a name found there proves
   * nothing about whether we declared it. `postgres` was still in `packages:`
   * as a sub-dependency of something else the whole time.
   */
  const importersStart = lock.indexOf('importers:')
  const packagesStart = lock.indexOf('\npackages:')
  const importers = importersStart >= 0 && packagesStart > importersStart
    ? lock.slice(importersStart, packagesStart)
    : ''

  check(`${dir}: the lockfile has a readable importers section`,
    importers.length > 0, String(importers.length))

  const declared = [
    ...Object.keys(pkg.dependencies ?? {}),
    ...Object.keys(pkg.devDependencies ?? {}),
  ]
  check(`${dir}: package.json declares dependencies at all`,
    declared.length > 10, String(declared.length))

  // Every name in package.json must appear in the importer block.
  // Names containing @ or / are single-quoted in the lockfile; plain ones are
  // not. Missing that is how the first version of this guard flagged fifty
  // packages that were present — a guard that cries wolf gets deleted.
  const missing = declared.filter((name) => !new RegExp(`\\n\\s{4,}'?${escape(name)}'?:`).test(importers))
  check(`${dir}: every dependency in package.json is in the lockfile`,
    missing.length === 0, missing.join(', '))

  // …and every name in the importer block must be in package.json. THIS is the
  // direction that broke: a package REMOVED from package.json and left in the
  // lockfile, which --frozen-lockfile rejects.
  const declaredSet = new Set(declared)
  const inLock = [...importers.matchAll(/\n {4,}'?([@a-zA-Z0-9][^\s':]*)'?:\n\s+specifier:/g)].map((m) => m[1])
  const stale = inLock.filter((name) => !declaredSet.has(name))
  check(`${dir}: every dependency in the lockfile is still in package.json`,
    stale.length === 0, `stale in lockfile: ${stale.join(', ')}`)

  check(`${dir}: the lockfile lists roughly what package.json does`,
    inLock.length > 0 && Math.abs(inLock.length - declared.length) <= 2,
    `lock=${inLock.length} pkg=${declared.length}`)
}

function escape(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') }

if (failures > 0) {
  console.error(`\n${failures} lockfile rule(s) broken.`)
  console.error('Run `pnpm install --lockfile-only` IN THE ROOT NAMED ABOVE and commit its pnpm-lock.yaml.')
  process.exit(1)
}
console.log('\nBoth roots agree with their lockfiles — both deploys will install.\n')
