/**
 * A MODULE NOBODY IMPORTS IS NOT A FEATURE — locked.
 *
 * This codebase's most expensive defect is not a wrong line. It is a correct
 * file that nothing calls, because it looks finished from every angle: the
 * types check, the guard suite passes, the module header explains the rule it
 * enforces, and the behaviour it promises never once happens.
 *
 * It has happened, found and fixed, in this order:
 *
 *   · lib/tenancy/db-owner.ts decided correctly for weeks which deployment owned
 *     a database. Nothing asked it, so a deployment pointed at the client's live
 *     database would simply have worked.
 *   · lib/freehold/app-store.ts described nine products and enforced three rules
 *     about them, and no surface read it, so no customer could see a word.
 *   · lib/freehold/marketing-employee.ts described a hirable employee with her
 *     own lanes, and no chat could reach her.
 *
 * Each was found by a person looking. This makes the build look instead.
 *
 * A module may be dormant on purpose — but then it is named below WITH THE
 * REASON, which is the point: an allowlist entry is a sentence somebody has to
 * write and the next reader can argue with, where silence is not.
 *
 * scripts/ is deliberately NOT counted as a caller. A module imported only by
 * its own guard is the exact shape this exists to catch: rules enforced about
 * code that never runs.
 *
 * Pure — reads imports from source. No DB, no network.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, dirname, normalize, relative } from 'node:path'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got = '') => { failures++; console.error(`  ✗ ${m}${got ? `\n      ${got}` : ''}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const ROOT = process.cwd()

/**
 * Modules that legitimately have no importer, each with the reason. Anything
 * not listed here and not imported is a defect until somebody decides otherwise
 * — and deciding means adding a line here, in writing.
 */
const DORMANT: Record<string, string> = {
  // ── Waiting on a surface that does not exist yet ────────────────────────────
  //
  // The Leadformer conversation runtime is missing: there is a product page, a
  // team, a voice registry and a caller, but no endpoint that runs the form's
  // turns. route() and memberSystemPrompt() are what that runtime will call.
  // Kept rather than deleted because the engine is right and the surface is the
  // missing half — and listed rather than silent so it cannot quietly become
  // permanent.
  'lib/freehold/visual-sales-routing.ts':
    'waiting on the Leadformer conversation runtime — no endpoint runs the form turns yet',

  // ── Found by this guard on the day it was written ───────────────────────────
  //
  // These are not blessed. Each is a real answer to a real question that
  // nothing currently asks, and each line below is the finding, not the excuse.
  // They are listed so the sweep can pass on the defects it was written to stop,
  // and so the next reader inherits a list rather than a search.

  // Its own header calls it "ONE truth for status → colour across the whole
  // app". Nothing imports it, which means the app has as many truths as it has
  // screens. Wiring it is a UI pass, not a bug fix, so it waits — visibly.
  'lib/freehold/status-tones.ts':
    'the single status-colour truth, imported by nothing — the app currently has one per screen',

  // Built for the exact defect its header names: where an ad sends somebody was
  // decided by one expression in three places. The trial that would prove which
  // destination wins is complete and never runs.
  'lib/freehold/destination-trial.ts':
    'the destination trial is complete and unrun — no surface starts or reads one',

  // An honest "connect your accounts" state for ad surfaces, so a demo flag
  // cannot read as real spend. The surfaces it was written for never adopted it.
  'lib/freehold/use-ads-connected.ts':
    'the honest not-connected state for ad surfaces, which those surfaces never adopted',

  // Creative Studio's node graph: the code exporter and the in-memory run log.
  // runs-store keeps runs in a Map, so it could never have survived a serverless
  // instance anyway — wiring it means giving it a table first.
  'lib/creative-studio/code-generator.ts':
    'exports a node graph as AI-SDK code; no surface offers the export yet',
  'lib/creative-studio/runs-store.ts':
    'in-memory run log — needs a table before any surface should depend on it',

  // A Vertex-backed ads expert with an offline fallback, superseded by the
  // coordinator in lib/freehold/coordinator-tools.ts. Two answers to one
  // question is the built-twice pattern; this is the half nothing calls.
  'lib/google/vertex-agent.ts':
    'superseded by the coordinator — kept only until its fallback copy is salvaged',

  // Pure link builders, no credentials, no API. Nothing generates a WhatsApp
  // link through them, so any screen that offers one is building it by hand.
  'lib/whatsapp/links.ts':
    'wa.me link builders nothing calls — screens offering WhatsApp build the URL by hand',
}

/** Every source file that can be a CALLER. scripts/ is excluded on purpose. */
function sourceFiles(): string[] {
  const out: string[] = []
  const walk = (dir: string) => {
    let entries: string[]
    try { entries = readdirSync(dir) } catch { return }
    for (const name of entries) {
      if (name === 'node_modules' || name === '.next' || name.startsWith('.')) continue
      const full = join(dir, name)
      const st = statSync(full)
      if (st.isDirectory()) walk(full)
      else if (/\.(ts|tsx)$/.test(name) && !name.endsWith('.d.ts')) out.push(full)
    }
  }
  for (const d of ['app', 'lib', 'components', 'src']) walk(join(ROOT, d))
  out.push(join(ROOT, 'proxy.ts'))
  return out.filter((f) => { try { return statSync(f).isFile() } catch { return false } })
}

/** Repo-relative module paths an import specifier could mean. */
function candidates(fromFile: string, spec: string): string[] {
  let base: string
  if (spec.startsWith('@/')) base = join(ROOT, spec.slice(2))
  else if (spec.startsWith('.')) base = normalize(join(dirname(fromFile), spec))
  else return []
  return [`${base}.ts`, `${base}.tsx`, join(base, 'index.ts'), join(base, 'index.tsx')]
    .map((p) => relative(ROOT, p))
}

const files = sourceFiles()
const imported = new Set<string>()
// Static imports, `export … from`, and dynamic import() — db.ts reaches the
// ownership check through the last of those, and a scanner that missed it would
// report the lock as dead the day after it was wired.
const SPEC = /(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g

for (const f of files) {
  const src = readFileSync(f, 'utf8')
  for (const m of src.matchAll(SPEC)) {
    for (const c of candidates(f, m[1])) imported.add(c)
  }
}

const libModules = files
  .map((f) => relative(ROOT, f))
  .filter((p) => p.startsWith('lib/') && p.endsWith('.ts'))

console.log('\n── every module in lib/ has a caller, or a written reason ──')
{
  check('there are modules to check', libModules.length > 50, String(libModules.length))

  const orphans = libModules.filter((p) => !imported.has(p) && !(p in DORMANT))
  check(
    'no module in lib/ is built and never called',
    orphans.length === 0,
    orphans.length === 0
      ? ''
      : `${orphans.join('\n      ')}\n\n      Wire it, delete it, or add it to DORMANT in this file WITH the reason.`,
  )

  // The allowlist is the dangerous half: an entry for a module that has since
  // been wired, or was deleted, stops being a decision and becomes decoration.
  const wiredButListed = Object.keys(DORMANT).filter((p) => imported.has(p))
  check('nothing dormant is actually in use', wiredButListed.length === 0,
    `${wiredButListed.join(', ')} — remove the DORMANT entry, it is wired now`)

  const missing = Object.keys(DORMANT).filter((p) => !libModules.includes(p))
  check('nothing dormant has been deleted out from under its reason',
    missing.length === 0, missing.join(', '))

  check('every dormant module states why', Object.values(DORMANT).every((r) => r.trim().length > 20))
}

console.log('\n── the three this exists because of stay wired ──')
{
  // Named individually rather than trusted to the sweep above: each of these
  // passed every other check in the suite while doing nothing at all, and a
  // regression here is invisible in exactly the same way.
  for (const [mod, what] of [
    ['lib/tenancy/db-owner.ts', 'the database ownership lock'],
    ['lib/freehold/app-store.ts', 'the product catalogue'],
    ['lib/freehold/marketing-employee.ts', 'the marketing employee'],
  ] as const) {
    check(`${what} still has a caller`, imported.has(mod), mod)
  }
}

if (failures) { console.error(`\n${failures} orphan-module guard(s) broken.`); process.exit(1) }
console.log('\nNothing in lib/ is finished code that never runs.\n')
