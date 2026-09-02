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

  /**
   * THE OWNER'S RULING (2026-09-02), verbatim: "ENTRESTATE مش مفتوح للناس
   * عشان يستخدموه… متكتبش خطوات التسطيب، اكتب مواصفات وفايدة المشروع."
   *
   * The repository is public so the product's claims can be CHECKED, not so
   * the product can be installed. A README that opens with `pnpm install`
   * tells a jury, an investor and a competitor that this is software to
   * download — the wrong thing about the business, published on the front
   * page. So: specifications and value, never setup steps.
   */
  const INSTALL_STEPS = [
    /^\s*(pnpm|npm|yarn|bun)\s+(install|i)\b/m,
    /^\s*(pnpm|npm|yarn|bun)\s+dev\b/m,
    /^\s*git\s+clone\b/m,
    /^\s*cp\s+\.env\.example/m,
    /localhost:3000/,
    /##\s*(getting started|run it|installation|setup|quick ?start)/i,
  ]
  const offending = INSTALL_STEPS.filter((re) => re.test(readme)).map(String)
  check('the README carries no installation steps — it is a specification, not a download', offending.length === 0, offending.join(' | '))
  check('…and says plainly that the product is not installable', /not open-source software and it is not installable/i.test(readme))
  check('…states what the system is FOR before how it is built', readme.indexOf('What the system is for') < readme.indexOf('## Stack'))
  check('…carries the specification table with its implementing modules', readme.includes('Specifications, and what the code actually holds') && readme.includes('lib/freehold/lead-rate.ts'))
  check('…and asserts ownership rather than an open licence', /Proprietary/.test(readme) && /grants no licence/i.test(readme))

  /**
   * THE EVIDENCE STANDARD, applied outward.
   *
   * An external review of these documents named the real defect precisely: a
   * reader cannot tell a shipped feature from a roadmap item, so they end up
   * doubting BOTH. The repository already had the cure — docs/spec/README.md
   * grades every claim — it just was not applied to the front page.
   *
   * So the README's capability table must carry a status on every row, use
   * the SAME legend as the truth table (one vocabulary, not two), and must
   * not be all-green: a table with no PARTIAL and no SPEC-ONLY row is either
   * a lie or a table nobody re-checked. Both are worth failing a build over.
   */
  const LEGEND = ['IMPLEMENTED', 'PARTIAL', 'SPEC-ONLY', 'CLIENT-RUNTIME']
  for (const level of LEGEND) check(`the README defines "${level}" before using it`, readme.includes(level), level)
  const rows = readme.split('\n').filter((l) => l.startsWith('| **') && l.includes('|'))
  const untagged = rows.filter((l) => !LEGEND.some((v) => l.includes(v)))
  check(`all ${rows.length} capability rows carry a status`, untagged.length === 0, untagged.map((l) => l.slice(0, 48)).join(' | '))
  check('…and the table is not all-green — the honest rows are present', /\*\*PARTIAL\*\*/.test(readme) && /\*\*SPEC-ONLY\*\*/.test(readme))
  check('…AIMAS is stated as unbuilt rather than implied', /AIMAS[\s\S]{0,400}no code in this repository/i.test(readme))
  check('…and the campaign figures are attributed to the client runtime', /CLIENT-RUNTIME/.test(readme))

  // The pitch lives in its own file, so the README stays the record.
  const vision = read('COMMERCIAL-VISION.md')
  check('the commercial argument has its own document', vision.length > 500)
  check('…which says outright that it is not a description of shipped code', /not be read\s*\n?as a description of shipped code|argument, not the record/i.test(vision))
  check('…and defers to the README and the truth table', vision.includes('README.md') && vision.includes('docs/spec/README.md'))
  check('the README hands the pitch off rather than carrying it', readme.includes('COMMERCIAL-VISION.md'))
  check('…points at the Terminal repo and the ADR that governs the pair', readme.includes('Entrestate_os') && readme.includes('docs/adr/0001-two-repositories.md'))
  check('…keeps the frozen-identifier explanation', /frozen historic identifiers/.test(readme))
  check('…and still names the enforced gauntlet', readme.includes('pnpm guards'))

  const deploy = read('DEPLOYMENT.md')
  check('the deployment playbook lists the brand defaults that actually ship', deploy.includes('`Entrestate` | All visible naming'))
  check('…and does not promise another company\'s behaviour as the default', !/runs exactly as the original/i.test(deploy))
}

console.log('\n── the specification documents grade themselves ──')
{
  /**
   * The specs are what a jury reads most closely, and they carried the same
   * defect the README did — plus contradictions that cost nothing to find:
   * a heading that said "10 Core Engines" above a list of twelve, a status
   * line claiming ACTIVE PRODUCTION against a CLIENT's host, a duplicated
   * Purpose/Core Logic block, two sections both labelled "D", a gauntlet
   * listing two of its four steps, and an evidence table graded with four
   * words (BUILT / INTEGRATED / INTELLIGENT / AUTOMATED) that could not be
   * ranked against each other.
   *
   * A specification is allowed to describe what is not built. It is not
   * allowed to be unclear about which is which, or to contradict itself.
   */
  const bp = read('docs/spec/system-architecture-blueprint-v14.md')
  check('the blueprint counts its engines consistently', !/\b10 Core Engines\b/.test(bp) && bp.includes('12 Core Engines'))
  check('…does not claim production status against a client host', !/ACTIVE PRODUCTION/.test(bp) && !/freeholdproperty/.test(bp))
  check('…declares itself a design document and defers to the graded tables', /DESIGN SPECIFICATION/.test(bp) && bp.includes('README.md'))
  check('…and states the gauntlet that actually runs, guards included', bp.includes('pnpm guards') && bp.includes('pnpm build'))
  const dupPurpose = (bp.match(/\*\*Purpose\*\*: Turn inventory, audience, and campaign parameters/g) || []).length
  check('…with the duplicated Engine 04 block gone', dupPurpose === 1, `found ${dupPurpose}`)

  const e4 = read('docs/spec/engine-04-creative-v3.md')
  const headings = (e4.match(/^### ([A-Z])\./gm) || []).map((h) => h.slice(4, 5))
  check(`the Engine 04 sections are uniquely lettered (${headings.join('')})`, new Set(headings).size === headings.length, headings.join(''))
  check('…the retired creative routes are marked RETIRED, not BUILT', /RETIRED/.test(e4) && !/\| \*\*BUILT\*\*/.test(e4))
  // Only the STATUS CELLS matter — the paragraph above the table names the
  // retired words deliberately, to say why they were retired.
  const e4Cells = (e4.match(/\|\s*\*\*[A-Z-]+\*\*[^|]*\|\s*$/gm) || []).join(' ')
  check('…its evidence table uses the one legend', e4.includes('**IMPLEMENTED**') && !/\*\*(INTELLIGENT|AUTOMATED|BUILT|INTEGRATED)\*\*/.test(e4Cells), e4Cells.slice(0, 80))
  check('…and the reels row cites the implementation, not the type shim', e4.includes('lib/freehold/gif-encode.ts'))
}

if (failures > 0) {
  console.error(`\n${failures} documentation rule(s) broken.`)
  process.exit(1)
}
console.log('\nEvery document accounted for, the kit checkable, the repo question answered on paper.\n')
