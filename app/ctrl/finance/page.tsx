import Link from 'next/link'
import { readFinanceDesk } from '@/lib/ctrl/admin-figures'

export const dynamic = 'force-dynamic'

/**
 * FINANCE — credit and requests, read; the bank, linked.
 *
 * Two things a person running the company wants to see in one place: what
 * is waiting for a decision (Ads Coin requests — top-ups, ad-credit offers,
 * ad-credit coupons), and who holds credit and how much of it has come off
 * bills. The DECISION stays in the finance screen: decideRequest is the one
 * place coin moves (the standing money rule), so every pending line here is
 * a link there, not a button.
 */
const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default async function FinancePage() {
  const d = await readFinanceDesk()
  return (
    <main>
      <p className="eyebrow">Finance</p>
      <h1>Credit and requests</h1>
      <p className="dim">Credit comes off the bills; Ads Coin moves only in the bank, by a person.</p>

      <h2>Waiting for a decision</h2>
      <div className="card" style={d.pending.length > 0 ? { borderColor: 'color-mix(in srgb, var(--warn) 40%, var(--line))' } : undefined}>
        <table>
          <thead><tr><th>When</th><th>Wallet</th><th>Amount</th><th>Reason</th><th></th></tr></thead>
          <tbody>
            {d.pending.map((r) => (
              <tr key={r.id}>
                <td className="dim">{when(r.createdAt)}</td>
                <td>{r.wallet}</td>
                <td className="amount">AED {r.amountAed}</td>
                <td className="dim">{r.reason}</td>
                <td><Link href="/freehold-intelligence/finance/wallets">Decide in the bank ↗</Link></td>
              </tr>
            ))}
            {d.pending.length === 0 && <tr><td colSpan={5} className="dim">{d.unknown ? 'Could not read.' : 'Nothing waiting.'}</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>Credit on accounts</h2>
      <div className="figures">
        <div className="figure"><p className="eyebrow">On accounts now</p><p className="n">AED {d.totals.onAccountsAed}</p><p className="sub">Waiting for the next bills</p></div>
        <div className="figure"><p className="eyebrow">Landed</p><p className="n">AED {d.totals.landedAed}</p><p className="sub">Welcome, coupons, vouchers — all campaigns</p></div>
        <div className="figure"><p className="eyebrow">Applied</p><p className="n">AED {d.totals.appliedAed}</p><p className="sub">Taken off invoices so far</p></div>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Account</th><th>On account</th><th>Landed</th><th>Applied</th></tr></thead>
          <tbody>
            {d.holders.map((h) => (
              <tr key={h.accountId}>
                <td>{h.name ?? h.email ?? h.accountId}{h.name && h.email ? <span className="dim"> · {h.email}</span> : null}</td>
                <td className="amount">AED {h.onAccountAed}</td>
                <td className="amount dim">AED {h.landedAed}</td>
                <td className="amount dim">AED {h.appliedAed}</td>
              </tr>
            ))}
            {d.holders.length === 0 && <tr><td colSpan={4} className="dim">{d.unknown ? 'Could not read.' : 'No credit landed yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  )
}
