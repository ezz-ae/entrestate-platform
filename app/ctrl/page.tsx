import Link from 'next/link'
import { readAdminOverview } from '@/lib/ctrl/admin-figures'

export const dynamic = 'force-dynamic'

/**
 * THE OVERVIEW — the company on one screen, every figure a door.
 *
 * Six numbers derived at read time (lib/ctrl/admin-figures.ts), each one
 * linking to the desk that owns it. A figure the database could not answer
 * says so ("—") rather than showing a confident zero.
 */
const n = (f: { n: number; unknown?: boolean }) => (f.unknown ? '—' : f.n.toLocaleString('en-US'))

export default async function AdminOverview() {
  const o = await readAdminOverview()
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
  return (
    <main>
      <p className="eyebrow">{today}</p>
      <h1>Entrestate, today</h1>
      <p className="dim">Every figure opens its desk. Numbers are read from the rows that carry them, never stored.</p>

      <div className="figures">
        <Link href="/ctrl/workspaces" className={`figure${o.workspaces.chase > 0 ? ' attention' : ''}`}>
          <p className="eyebrow">Workspaces</p>
          <p className="n">{n(o.workspaces)}</p>
          <p className="sub">{o.workspaces.active} paying · {o.workspaces.starting} starting{o.workspaces.chase > 0 ? ` · ${o.workspaces.chase} owed a call` : ''}</p>
        </Link>
        <Link href="/ctrl/finance" className="figure">
          <p className="eyebrow">Accounts</p>
          <p className="n">{n(o.accounts)}</p>
          <p className="sub">Entrestate accounts seen on the business site</p>
        </Link>
        <Link href="/ctrl/finance" className="figure">
          <p className="eyebrow">Credit on accounts</p>
          <p className="n">{o.credit.unknown ? '—' : <>AED {o.credit.onAccountsAed}</>}</p>
          <p className="sub">AED {o.credit.landedAed} landed so far, off the bills as they come</p>
        </Link>
        <Link href="/ctrl/finance" className={`figure${o.requests.n > 0 ? ' attention' : ''}`}>
          <p className="eyebrow">Waiting for you</p>
          <p className="n">{n(o.requests)}</p>
          <p className="sub">Ads Coin requests pending a person</p>
        </Link>
        <Link href="/ctrl/coupons" className="figure">
          <p className="eyebrow">Coupons</p>
          <p className="n">{n(o.coupons)}<small>{o.coupons.unknown ? '' : `${o.coupons.live} live`}</small></p>
          <p className="sub">Campaigns minted — coupon sites, gift sites, bait</p>
        </Link>
        <Link href="/ctrl/partners" className={`figure${o.partners.held > 0 ? ' attention' : ''}`}>
          <p className="eyebrow">Partners</p>
          <p className="n">{n(o.partners)}</p>
          <p className="sub">{o.partners.held > 0 ? `${o.partners.held} leads held, unpaid` : 'Nothing held'}</p>
        </Link>
      </div>

      <h2>Desks</h2>
      <div className="card">
        <table>
          <tbody>
            <tr><td><Link href="/ctrl/workspaces">Workspaces</Link></td><td className="dim">Every customer instance — company, address, owner, plan, where its starting period stands.</td></tr>
            <tr><td><Link href="/ctrl/coupons">Coupons &amp; vouchers</Link></td><td className="dim">Mint the marketing system: shared codes for coupon sites, single-use vouchers for gift sites, ad credit as bait.</td></tr>
            <tr><td><Link href="/ctrl/finance">Credit &amp; requests</Link></td><td className="dim">Who holds credit, what landed and what was applied; the Ads Coin requests waiting for a person.</td></tr>
            <tr><td><Link href="/freehold-intelligence/finance/wallets">Ads Coin bank ↗</Link></td><td className="dim">The ledger itself — issue, transfer, approve. The one place money moves.</td></tr>
            <tr><td><Link href="/ctrl/partners">Lead marketplace</Link></td><td className="dim">Partners buying leads at your prices; balances, held leads, mappings.</td></tr>
            <tr><td><Link href="/wl-admin">Access keys ↗</Link></td><td className="dim">White-label access keys — mint, review, revoke.</td></tr>
          </tbody>
        </table>
      </div>
    </main>
  )
}
