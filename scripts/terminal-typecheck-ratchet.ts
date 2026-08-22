/**
 * THE TERMINAL'S TYPE DEBT — measured, and not allowed to grow.
 *
 * apps/terminal is the second Vercel project in this repository
 * (`entrestate-os`, Root Directory `apps/terminal`, serving
 * terminal.entrestate.com). It ships today with NO type checking whatsoever:
 *
 *   apps/terminal/next.config.mjs   typescript: { ignoreBuildErrors: true }
 *   apps/terminal/package.json      had no typecheck script until this landed
 *   tsconfig.json:38-41             the root project excludes "apps" entirely
 *   .github/workflows/ci.yml        runs typecheck/i18n/guards/build, all
 *                                   root-scoped — "apps/terminal" appears zero
 *                                   times in the whole workflow
 *
 * Running tsc against it for the first time returned 423 errors. That is a
 * backlog, not a bug to fix in one commit, and pretending otherwise would mean
 * either a red gate everyone learns to ignore or 423 rushed edits to code that
 * currently serves real traffic.
 *
 * So this is a RATCHET, not a gate. It records what the debt was, and fails
 * only when the debt GROWS. Every error fixed lowers the baseline; no error
 * may be added. That turns an unbounded liability into a number that can only
 * go down, which is the most that can honestly be claimed today.
 *
 * WHY IT MATTERS MORE THAN THE COUNT SUGGESTS. The plans merge introduces a
 * module generated into BOTH build roots. In the platform root a drifted or
 * broken copy fails `pnpm typecheck` immediately. In the Terminal root, with
 * ignoreBuildErrors set, it compiles, deploys, and throws on the request — the
 * one failure mode in that whole plan that is silent rather than loud. This
 * ratchet is what makes it loud.
 *
 * LOWERING THE BASELINE IS THE POINT. Fix errors, run this, and put the new
 * (lower) number in BASELINE in the same commit. It refuses to let the number
 * be raised: a commit that needs a higher baseline is a commit adding type
 * errors to a project that cannot check them at build time.
 *
 * Not in `pnpm guards` — it needs apps/terminal/node_modules, which the
 * platform install does not create (there is no pnpm workspace), and it costs
 * minutes rather than milliseconds. It runs in CI as its own step, and locally
 * via `pnpm typecheck:terminal`.
 */
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Measured 2026-08-18 at 423 on the first run; 377 after the 2026-08-22 reinstall of `tsc --noEmit` in apps/terminal.
 * LOWER THIS when you fix errors. Never raise it.
 */
const BASELINE = 377

const dir = join(process.cwd(), 'apps/terminal')

if (!existsSync(join(dir, 'node_modules'))) {
  // Not a pass and not a failure: an uninstalled root proves nothing either
  // way, and exiting 0 silently would let CI report green on a step that never
  // ran. Say what happened and refuse.
  console.error('\n  ✗ apps/terminal/node_modules is missing — nothing was checked.')
  console.error('      Run `pnpm install --frozen-lockfile` inside apps/terminal first.\n')
  process.exit(1)
}

let output = ''
try {
  execSync('npx tsc --noEmit', { cwd: dir, encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 })
} catch (e) {
  // tsc exits non-zero whenever it reports anything, which is the normal case
  // while a backlog exists. The count is the signal, not the exit code.
  const err = e as { stdout?: string; stderr?: string }
  output = `${err.stdout ?? ''}${err.stderr ?? ''}`
}

const errors = (output.match(/error TS\d+/g) ?? []).length

console.log('\n── apps/terminal type debt ──')
console.log(`  baseline ${BASELINE}   now ${errors}`)

if (errors > BASELINE) {
  const added = errors - BASELINE
  console.error(`\n  ✗ ${added} type error(s) added to a project whose build ignores them.`)
  // Name them, or the person reading CI has to reproduce the run to find out.
  const lines = output.split('\n').filter((l) => /error TS\d+/.test(l)).slice(0, 20)
  for (const l of lines) console.error(`      ${l.trim()}`)
  if (lines.length === 20) console.error('      …first 20 shown')
  console.error('\n  Fix them. Do NOT raise BASELINE in scripts/terminal-typecheck-ratchet.ts.\n')
  process.exit(1)
}

if (errors < BASELINE) {
  console.log(`\n  ✓ ${BASELINE - errors} fewer than the baseline.`)
  console.log(`  Lower BASELINE to ${errors} in scripts/terminal-typecheck-ratchet.ts, this commit.\n`)
  // Deliberately a failure. A baseline left stale is a ratchet with slack in
  // it: the errors you just fixed become budget for the next person to spend.
  process.exit(1)
}

console.log('\n  ✓ no type errors added.\n')
