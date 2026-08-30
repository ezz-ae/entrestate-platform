/**
 * THE FRONT DOOR OF THE COMPANY WAS SELLING APARTMENTS — locked.
 *
 * One deployment answers on three kinds of host: a tenant's instance, the
 * vendor's apex, and the reserved product doors. Only the first was ever
 * routed. The other two fell through to the property-marketing site that
 * ships in this codebase, so a visitor to entrestate.com — and to
 * machine.entrestate.com, the address printed on the business card — was met
 * with a Dubai property portal: Golden Visa, off-plan, featured listings.
 *
 * The rule is small and the cost of it silently reverting is the whole
 * funnel, so it is asserted here rather than trusted.
 *
 * Pure — no server. Runs in `pnpm guards`.
 *
 * The imports are dynamic and the work is inside main(): lib/tenancy/config
 * reads NEXT_PUBLIC_TENANT_BASE_DOMAIN once at module load, so the variable
 * has to be set before the module is first evaluated, and cleared before the
 * second copy is loaded for the switched-off case.
 */

import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8')

let failures = 0
const ok = (m: string) => console.log(`  ✓ ${m}`)
const fail = (m: string, got: string) => { failures++; console.error(`  ✗ ${m}\n      got: ${got}`) }
const check = (m: string, cond: boolean, got = '') => (cond ? ok(m) : fail(m, got))
const show = (a: unknown) => JSON.stringify(a)

async function main(): Promise<void> {
  process.env.NEXT_PUBLIC_TENANT_BASE_DOMAIN = 'entrestate.com'
  const { vendorHostAction, PRODUCT_DOORS } = await import('../lib/tenancy/vendor-host')

  console.log('\n── the apex is the platform site, not a property portal ──')
  {
    const root = vendorHostAction('entrestate.com', '/')
    check('entrestate.com/ goes to the platform site',
      root.kind === 'redirect' && root.to === '/business', show(root))

    const www = vendorHostAction('www.entrestate.com', '/')
    check('www does the same', www.kind === 'redirect' && www.to === '/business', show(www))

    check('a port does not defeat it',
      vendorHostAction('entrestate.com:3000', '/').kind === 'redirect')
    check('neither does casing',
      vendorHostAction('EntreState.COM', '/').kind === 'redirect')
  }

  console.log('\n── the property site is not served on a vendor host ──')
  for (const p of ['/projects', '/areas/dubai-marina', '/developers', '/blog', '/tools', '/chat', '/lp/some-tower', '/market']) {
    const a = vendorHostAction('entrestate.com', p)
    check(`${p} → the platform site`, a.kind === 'redirect' && a.to === '/business', show(a))
  }

  console.log('\n── the vendor surface itself passes untouched ──')
  {
    for (const p of ['/business', '/business/pricing', '/signup', '/server', '/privacy', '/terms', '/api/wl/signup']) {
      check(`${p} is left alone`, vendorHostAction('entrestate.com', p).kind === 'pass')
    }
    // An operator must be able to reach the application to run the platform.
    for (const p of ['/freehold-intelligence', '/freehold-intelligence/crm', '/crm']) {
      check(`${p} stays reachable for the operator`, vendorHostAction('entrestate.com', p).kind === 'pass')
    }
    check('files are never treated as page routes',
      vendorHostAction('entrestate.com', '/og-image.png').kind === 'pass')
  }

  console.log('\n── every door the operator is told to use actually opens ──')
  {
    // Reported live: "https://entrestate.com/login, /ctrl — anything — takes you
    // to the business page; the only thing working is /server." The allowlist
    // had not grown with the application, so surfaces built later were being
    // redirected away by a rule written before they existed. Each one below is
    // an address a person is handed — by a commit message, by the proxy's own
    // redirect, or by their own fingers — so each is asserted individually.
    const doors: Array<[string, string]> = [
      ['/login', 'the address people type; app/login/page.tsx sends it to /server'],
      ['/ctrl', 'the partner control plane, named after this very domain'],
      ['/ctrl/projects', 'and everything under it'],
      ['/portal/acme', 'the partner storefront, a capability URL with no login'],
      ['/activate', 'where the proxy sends visitors when WHITE_LABEL is on'],
      ['/wl-admin', 'the vendor key console'],
    ]
    for (const [p, why] of doors) {
      check(`${p} opens — ${why}`, vendorHostAction('entrestate.com', p).kind === 'pass',
        show(vendorHostAction('entrestate.com', p)))
    }

    // /login must not become a second sign-in screen: one file, one redirect.
    const alias = read('app/login/page.tsx')
    check('app/login/page.tsx exists and only redirects', /redirect\('\/server'\)/.test(alias))
    check('…and holds no password field of its own', !/password|input/i.test(alias))
  }

  console.log('\n── the brokerage’s own pages are still not the vendor’s ──')
  {
    // These read as a licensed brokerage — advisory, Golden Visa, the Business
    // Bay office. They are the property site, so they keep redirecting even
    // though they sit next to the vendor routes in app/.
    for (const p of ['/about', '/services', '/contact']) {
      const a = vendorHostAction('entrestate.com', p)
      check(`${p} → the platform site`, a.kind === 'redirect' && a.to === '/business', show(a))
    }
  }

  console.log('\n── product doors keep their short address ──')
  {
    const machine = vendorHostAction('machine.entrestate.com', '/')
    check('machine. serves Lead Machine without changing the address',
      machine.kind === 'rewrite' && machine.to === '/business/lead-machine', show(machine))

    const meta = vendorHostAction('meta.entrestate.com', '/')
    check('meta. serves Meta for Realtors',
      meta.kind === 'rewrite' && meta.to === '/business/meta-for-realtors', show(meta))

    const listing = vendorHostAction('listing.entrestate.com', '/')
    check('listing. serves Listing-to-Landing',
      listing.kind === 'rewrite' && listing.to === '/business/listing-to-landing', show(listing))

    const leadformer = vendorHostAction('leadformer.entrestate.com', '/')
    check('leadformer. serves Leadformer without changing the address',
      leadformer.kind === 'rewrite' && leadformer.to === '/business/leadformer', show(leadformer))

    check('every door points at a page under /business',
      Object.values(PRODUCT_DOORS).every((p) => p.startsWith('/business/')), show(PRODUCT_DOORS))

    // A door's name must be unclaimable, or a tenant could sign up as the
    // product and shadow it. Every door is reserved, checked as a set so a new
    // door added without its reservation fails here rather than in production.
    const { RESERVED_SUBDOMAINS } = await import('../lib/tenancy/reserved')
    const unreserved = Object.keys(PRODUCT_DOORS).filter((d) => !RESERVED_SUBDOMAINS.has(d))
    check('every product door is a reserved subdomain', unreserved.length === 0, unreserved.join(','))

    // A door is only a front page. Deeper paths follow the ordinary rules, so
    // a door cannot become a second, uncanonical copy of the whole site.
    const deep = vendorHostAction('machine.entrestate.com', '/projects')
    check('a door does not mirror the property site either',
      deep.kind === 'redirect' && deep.to === '/business', show(deep))
  }

  console.log('\n── a tenant instance is never touched by these rules ──')
  for (const p of ['/', '/projects', '/lp/some-tower', '/freehold-intelligence']) {
    check(`skyline.entrestate.com${p} passes to the tenancy rules`,
      vendorHostAction('skyline.entrestate.com', p).kind === 'pass')
  }

  console.log('\n── a preview of this deployment is the vendor site ──')
  {
    // This used to assert the opposite, and the opposite was wrong. A preview
    // build answers on <project>-git-<branch>-<scope>.vercel.app, which is
    // neither the apex nor a tenant, so every rule returned `pass` — and `pass`
    // on `/` renders the brokerage property site that ships in this repo. You
    // could not review the vendor surface on the one URL that exists to review
    // it: opening a preview of a branch that changes entrestate.com showed
    // Dubai apartments and a rental-yield headline.
    for (const h of ['entrestate-abc123.vercel.app', 'entrestate-git-products-menu-ezz-dxb.vercel.app']) {
      const root = vendorHostAction(h, '/')
      check(`${h}/ shows the platform site`, root.kind === 'redirect' && root.to === '/business', show(root))
      check(`${h}/business is left alone`, vendorHostAction(h, '/business').kind === 'pass')
      check(`${h}/login opens`, vendorHostAction(h, '/login').kind === 'pass')
      const deep = vendorHostAction(h, '/projects')
      check(`${h} does not serve the property site either`,
        deep.kind === 'redirect' && deep.to === '/business', show(deep))
    }
  }

  console.log('\n── unrelated hosts pass ──')
  {
    // A customer's own domain is theirs. It must never be redirected to ours,
    // whatever this deployment thinks it is.
    for (const h of ['freeholdproperty.ae', 'localhost:3000', 'a.b.entrestate.com']) {
      check(`${h} is left alone`, vendorHostAction(h, '/').kind === 'pass')
    }
    check('a missing host is left alone', vendorHostAction(null, '/').kind === 'pass')
  }

  console.log('\n── switched off, it does nothing at all ──')
  {
    // The client's deployment leaves the base domain unset, and this block is
    // what proves the whole module is inert there.
    //
    // It used to re-import the module with a cache-busting query and the env
    // deleted — which does NOT switch it off: the fresh copy's own
    // `import './config'` resolves to the URL already in the module cache, so
    // TENANT_BASE_DOMAIN stayed set and every assertion here passed vacuously,
    // because the hosts it tested return `pass` under either setting. The
    // preview rule was the first assertion that could tell the difference, and
    // it failed immediately. A separate process is the only honest way to ask.
    const probe = `
      async function main() {
        const { vendorHostAction } = await import(${JSON.stringify(join(process.cwd(), 'lib/tenancy/vendor-host.ts'))})
        const hosts = ['freeholdproperty.ae', 'ore-git-main-somebody.vercel.app', 'entrestate.com']
        const paths = ['/', '/projects', '/blog']
        const out = []
        for (const h of hosts) for (const p of paths) out.push(h + ' ' + p + ' ' + vendorHostAction(h, p).kind)
        console.log(out.join('\\n'))
      }
      void main()
    `
    const probeFile = join(tmpdir(), `vendor-host-off-${process.pid}.ts`)
    writeFileSync(probeFile, probe)
    const env = { ...process.env }
    delete env.NEXT_PUBLIC_TENANT_BASE_DOMAIN
    let lines: string[] = []
    try {
      lines = execFileSync('npx', ['tsx', probeFile], { encoding: 'utf8', env, cwd: process.cwd() })
        .trim().split('\n').filter(Boolean)
    } finally {
      try { unlinkSync(probeFile) } catch { /* best effort */ }
    }

    check('the probe ran', lines.length === 9, lines.join(' | '))
    const wrong = lines.filter((l) => !l.endsWith(' pass'))
    check('with tenancy off, every host and path is untouched — the apex included',
      wrong.length === 0, wrong.join(' | '))
  }

  console.log(
    failures === 0
      ? '\nThe vendor’s own front door shows the vendor’s own product.\n'
      : `\n${failures} failure(s).\n`,
  )
  process.exit(failures === 0 ? 0 : 1)
}

void main()
