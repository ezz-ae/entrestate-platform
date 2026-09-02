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

console.log('\n── the docs wear this platform\'s name, not the client\'s ──')
{
  /**
   * The owner's finding, verbatim: "مبقاش الريد مي بتقول فريهولد صح" — the
   * README still opened with the client's company name, months after the
   * separation. The docs are read by teammates, prospects and juries; a
   * document that names another company as the product is a defect, not a
   * cosmetic one.
   *
   * The distinction this pin holds: `freehold` as an IDENTIFIER is legal and
   * deliberately frozen (lib/freehold/*, /freehold-intelligence/*,
   * /api/freehold/*, freehold_site_* tables, freehold-logo.png, the
   * client's own repo ezz-ae/ORE, and the Arabic transliteration named in
   * lib/landing-i18n.ts) — renaming those would break the client's upstream
   * merge path, which is the whole argument of ADR 0001. `Freehold` as a
   * BRAND NAME — the product's name, the company in a title, "the Freehold
   * story" — is not.
   */
  // No exemptions — CLAUDE.md included. The separation warning used to shout
  // the client's company name in a heading, which put their brand at the top
  // of a public repository and told every reader this product was theirs. The
  // warning does its job better with the REPOSITORY IDENTIFIER (`ezz-ae/ORE`),
  // which is also the exact string the pre-push check greps for.
  const DOCS = [
    'README.md', 'CHANGELOG.md', 'DEPLOYMENT.md', 'CLAUDE.md',
    ...fs.readdirSync(path.join(ROOT, 'docs')).filter((f) => f.endsWith('.md')).map((f) => `docs/${f}`),
  ]
  // Identifier spellings that stay. Everything else that says the word is copy.
  const IDENTIFIER = /lib\/freehold|components\/freehold|app\/freehold|freehold-intelligence|api\/freehold|freehold_site|freehold_|freehold-logo|freeholdproperty|freehold-whitelabel|ezz-ae\/ORE|`freehold`|فريهولد/i
  const offenders: string[] = []
  for (const rel of DOCS) {
    if (!exists(rel)) continue
    read(rel).split('\n').forEach((line, i) => {
      if (!/freehold/i.test(line)) return
      // Strip every legal identifier spelling, then ask if the word survives.
      const stripped = line.replace(new RegExp(IDENTIFIER.source, 'gi'), '')
      if (/freehold/i.test(stripped)) offenders.push(`${rel}:${i + 1}`)
    })
  }
  check('no document names the client company as this product', offenders.length === 0, offenders.join(', '))

  const claude = read('CLAUDE.md')
  // The rule must stay at full strength; only the client's BRAND leaves.
  check('the separation rule survives, addressed by repo id', /never push, merge, open a pr against, or deploy `ezz-ae\/ORE`/i.test(claude))
  check('…with the pre-push remote check still in the file', claude.includes('git remote -v | grep -q entrestate-platform'))
  check('…and the naming rule written down so it is not undone', claude.includes('repository identifier'))

  const readme = read('README.md')
  check('the README opens as Entrestate', /^# Entrestate/m.test(readme))
  check('…and explains why the freehold path names are frozen rather than hiding them', readme.includes('frozen\nhistoric identifiers') || readme.includes('frozen historic identifiers') || readme.includes('**frozen'))
  check('…points at the Terminal repo and the ADR that governs the pair', readme.includes('Entrestate_os') && readme.includes('docs/adr/0001-two-repositories.md'))
  check('…and states the real gauntlet, guards included', readme.includes('pnpm guards'))

  const deploy = read('DEPLOYMENT.md')
  check('the deployment playbook lists the brand defaults that actually ship', deploy.includes('`Entrestate` | All visible naming'))
  check('…and does not promise another company\'s behaviour as the default', !/runs exactly as the original/i.test(deploy))
}

if (failures > 0) {
  console.error(`\n${failures} documentation rule(s) broken.`)
  process.exit(1)
}
console.log('\nEvery document accounted for, the kit checkable, the repo question answered on paper.\n')
