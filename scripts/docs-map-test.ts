/**
 * THE DOCUMENTATION MAP, locked.
 *
 * The owner's ask, verbatim: "تقارن كله بكله وتظبط الدوكس بشكل محترم" —
 * every document accounted for, the award kit versioned WITH its
 * verification page, and the repo question answered on paper. What this
 * suite prevents is the quiet rot that made the sweep necessary: a kit
 * claim nobody re-checked, an index linking a file that moved, a "we'll
 * merge the repos someday" that never got its reasons written down.
 *
 * Pure — reads files. Runs in `pnpm guards`.
 */
import fs from 'node:fs'
import path from 'node:path'

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

const ROOT = process.cwd()
const read = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8')
const exists = (rel: string) => fs.existsSync(path.join(ROOT, rel))

console.log('\n── the award kit is versioned with its verification page ──')
{
  const KIT = [
    'docs/award/dubai-it-submission-v16.md',
    'docs/award/executive-qa-v14.md',
    'docs/award/executive-pitch-memo-v14.md',
    'docs/award/jury-presentation-outline-v9.md',
    'docs/award/jury-presentation-script-v9.md',
  ]
  for (const rel of KIT) check(`${rel} is in the repo`, exists(rel), rel)
  const verify = read('docs/award/README.md')
  check('the verification page dates its read against both repos', verify.includes('2026-09-01'))
  check('…carries the word-ban wording fix (the kit says "free"; the surfaces may not)', verify.includes('"free" is banned'))
  check('…corrects the idle-refocus overstatement', verify.includes('Idle re-focus alone does not make a Rate 8'))
  check('…names the real files in place of the claimed ones', verify.includes('components/freehold/lead-rate.tsx'))
  check('…and separates client-runtime telemetry from repo-verifiable claims', verify.includes('client deployment'))
}

console.log('\n── the index links resolve, and the map answers the repo question ──')
{
  const index = read('docs/README.md')
  // Every relative markdown link in the index must point at a real file.
  const links = [...index.matchAll(/\]\(([^)#]+\.md)\)/g)].map((m) => m[1])
  const broken = links.filter((l) => !exists(path.join('docs', l)) && !exists(l.replace(/^\.\.\//, '')))
  check(`all ${links.length} index links resolve`, broken.length === 0, broken.join(', '))
  check('the pre-existing living reference survived the reorganisation', index.includes('ADS-RULES.md') && index.includes('OPERATIONS-RUNBOOK.md'))
  const adr = read('docs/adr/0001-two-repositories.md')
  check('the repo question has its written answer', adr.includes('بدون ما نضيع'))
  check("…with the client's upstream path as the first reason", adr.includes('ezz-ae/ORE') && adr.indexOf('upstream path breaks') < adr.indexOf('Deploy blast radius'))
  check('…the no-commit-lost recipe spelled out', adr.includes('--allow-unrelated-histories'))
  check('…and nothing executed without the owner\'s word', adr.includes("awaiting the owner's word"))
  const spec = read('docs/spec/README.md')
  check('the spec table points at the kit\'s new home', spec.includes('docs/award/'))
}

if (failures > 0) {
  console.error(`\n${failures} documentation rule(s) broken.`)
  process.exit(1)
}
console.log('\nEvery document accounted for, the kit checkable, the repo question answered on paper.\n')
