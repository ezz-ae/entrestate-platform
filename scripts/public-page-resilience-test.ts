/**
 * A PUBLIC TENANT PAGE MAY NOT 500 BECAUSE A QUERY THREW.
 *
 * Turning on wildcard DNS made every tenant host publicly reachable for the
 * first time, and two pages fell over the same afternoon:
 *
 *   /            SELECTed freehold_site_blog_posts, which is created lazily by
 *                the blog editor and absent from a tenant schema → 42P01 →
 *                the entire homepage lost over a section with nothing in it.
 *   /developers  SELECTed freehold_site_developer_profiles, which lives only
 *                in the shared schema → 500 on 100% of tenants, on a page
 *                linked from the header and footer of every other page.
 *
 * Only TWO tables are provisioned into a tenant schema
 * (CATALOG_COPY_TABLES in lib/tenancy/provision.ts) while lib/ reads dozens,
 * so "is this table provisioned?" is the wrong question — nearly none are.
 * The rule that actually holds is about the READER: anything a public,
 * unauthenticated tenant page awaits must degrade to empty rather than throw,
 * because the alternative is losing a whole page to an optional section.
 *
 * A reader satisfies this by guarding ITSELF (try/catch, the posture of
 * getLandingMap in lib/inventory-data.ts) or by every call site catching. The
 * first is strongly preferred: /developers/[slug] had `.catch(() => [])` at
 * the call site and degraded correctly, while the listing page died on the
 * same table in the same request — a guard on the reader travels with the
 * table instead of waiting to be rediscovered.
 *
 * Pure source analysis — no model, no database, no network. Runs in
 * `pnpm guards`.
 */
import { readFileSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))

/**
 * Pages a tenant serves to anyone with the address — no session, no cookie.
 * `/freehold-intelligence/**` is deliberately absent: it sits behind auth, and
 * a crash there is a different (and lesser) problem than a crash a prospect or
 * a search engine can reach.
 */
const PUBLIC_PAGES = [
  'app/page.tsx',
  'app/developers/page.tsx',
  'app/developers/[slug]/page.tsx',
  'app/areas/page.tsx',
  'app/areas/[slug]/page.tsx',
  'app/blog/page.tsx',
  'app/projects/page.tsx',
]

/** `import { a, b as c } from '@/lib/x'` → [{ file, names }]. */
function libImports(src: string): Array<{ mod: string; names: string[] }> {
  const out: Array<{ mod: string; names: string[] }> = []
  const re = /import\s*\{([^}]+)\}\s*from\s*["']@\/(lib\/[^"']+)["']/g
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    const names = m[1]
      .split(',')
      .map((n) => n.split(/\s+as\s+/)[0].trim())
      .filter((n) => n && !n.startsWith('type '))
    out.push({ mod: m[2], names })
  }
  return out
}

/** The body of `export async function NAME(...)`, brace-matched. */
function functionBody(src: string, name: string): string | null {
  const decl = new RegExp(`export\\s+async\\s+function\\s+${name}\\s*[(<]`)
  const at = src.search(decl)
  if (at === -1) return null
  const open = src.indexOf('{', src.indexOf(')', at))
  if (open === -1) return null
  let depth = 1
  let i = open + 1
  while (depth > 0 && i < src.length) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') depth--
    i++
  }
  return src.slice(open, i)
}

const readSrc = (rel: string): string | null => {
  // A bare directory path resolves to its index — statSync guards against
  // readFileSync(dir) throwing EISDIR on module paths like '@/lib/tenancy'.
  for (const p of [join(ROOT, rel), join(ROOT, `${rel}.ts`), join(ROOT, `${rel}.tsx`),
                   join(ROOT, rel, 'index.ts'), join(ROOT, rel, 'index.tsx')]) {
    if (existsSync(p) && statSync(p).isFile()) return readFileSync(p, 'utf8')
  }
  return null
}


/**
 * A page AND every server component it renders, transitively.
 *
 * Scanning page files alone was a hole big enough to miss the outage this
 * suite was written for: the homepage's blog read lives in
 * components/blog-section.tsx, a server component the page merely renders, so
 * the unguarded call was invisible from app/page.tsx. Proven by deleting the
 * real guard and watching this suite pass.
 *
 * 'use client' components are skipped: they cannot query the database at all,
 * so a throw there is not this failure mode.
 */
function serverTree(entry: string): Array<[string, string]> {
  const out: Array<[string, string]> = []
  const seen = new Set<string>()
  const queue = [entry]
  while (queue.length) {
    const rel = queue.shift()!
    if (seen.has(rel)) continue
    seen.add(rel)
    const src = readSrc(rel)
    if (!src) continue
    // A client component runs in the browser; its imports are not server reads.
    if (rel !== entry && /^\s*["']use client["']/m.test(src)) continue
    out.push([rel, src])
    const re = /from\s*["']@\/(components\/[^"']+)["']/g
    let m: RegExpExecArray | null
    while ((m = re.exec(src))) queue.push(m[1])
  }
  return out
}

console.log('\n── every reader behind a public tenant page fails soft ──')
{
  const offenders: string[] = []
  let audited = 0

  for (const page of PUBLIC_PAGES) {
    for (const [file, pageSrc] of serverTree(page)) {
    for (const { mod, names } of libImports(pageSrc)) {
      const libSrc = readSrc(mod)
      if (!libSrc) continue

      for (const name of names) {
        const body = functionBody(libSrc, name)
        // Not an exported async function here (a const, a type, a re-export):
        // nothing to judge.
        if (body === null) continue
        // Only functions that actually touch the database can throw 42P01.
        if (!/\bquery\s*[<(]/.test(body)) continue
        audited++

        const guardsItself = /\btry\s*\{/.test(body)
        // Every await of it on this page catches — weaker, but honest.
        const callSites = [...pageSrc.matchAll(new RegExp(`${name}\\s*\\([^)]*\\)`, 'g'))]
        const everyCallCatches =
          callSites.length > 0 &&
          callSites.every((m) => {
            const after = pageSrc.slice(m.index! + m[0].length, m.index! + m[0].length + 40)
            if (/^\s*\.catch\s*\(/.test(after)) return true
            // Promise.allSettled hands back a status per entry, so a rejection
            // there is a handled outcome. Look for the ENCLOSING allSettled —
            // a fixed look-back missed it whenever the array spanned lines,
            // and reported a page that degrades correctly as a defect.
            const before = pageSrc.slice(0, m.index!)
            const settledAt = before.lastIndexOf('Promise.allSettled([')
            if (settledAt === -1) return false
            // Still inside that array only if it has not been closed since.
            return !before.slice(settledAt).includes('])')
          })

        if (!guardsItself && !everyCallCatches) {
          const via = file === page ? page : `${page} → ${file}`
          offenders.push(`${via} → ${mod}:${name}() queries the database and neither guards itself nor is caught`)
        }
      }
    }
    }
  }

  check('at least one public page reader was audited', audited > 0, `audited ${audited}`)
  check(
    `no unguarded database reader behind a public page (${audited} audited)`,
    offenders.length === 0,
    offenders.join('\n      '),
  )
}

console.log(
  failures
    ? `\n${failures} public-page resilience rule(s) broken.`
    : '\nA public tenant page survives an empty database.',
)
process.exit(failures ? 1 : 0)
