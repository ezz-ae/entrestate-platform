import Link from 'next/link'
import { listCampaigns } from '@/lib/coupon-campaigns'
import { COUPON_AED, VOUCHER_AED, VOUCHER_BATCH_MAX, SCOPE_CHOICES, scopeLabel } from '@/lib/business/coupons'
import { mintCampaignAction } from './actions'

export const dynamic = 'force-dynamic'

/**
 * THE COUPON DESK — where the marketing system is minted.
 *
 * The owner: "coupon numbers to the coupon sites at 20/40/60; big vouchers
 * sold on the gift sites; ad credit on Meta for Realtors and the landing
 * builder as the bait." One table of what is out there and what it has
 * cost, and two forms: a coupon (one shared code, a ceiling, a window) and a
 * voucher batch (many single-use codes, to hand to a gift site). Every
 * campaign is credit with a scope — the same ledger the account page shows.
 */

const MINT_MESSAGE: Record<string, string> = {
  bad_amount: `Amount is out of bounds — coupons AED ${COUPON_AED.min}–${COUPON_AED.max}, vouchers AED ${VOUCHER_AED.min}–${VOUCHER_AED.max.toLocaleString()}.`,
  bad_scope: 'Pick a scope from the list.',
  bad_code: 'A coupon code is 4–24 letters, digits and hyphens, and cannot spell like a house offer or a voucher.',
  code_taken: 'That code already exists. Choose another.',
  bad_count: `A voucher batch is 1–${VOUCHER_BATCH_MAX} codes; a coupon ceiling is a whole number or blank.`,
  name_required: 'Give the campaign a name — the source and the month is enough.',
  failed: 'That did not save. Nothing was minted — try once more.',
}

const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

export default async function CouponDesk({ searchParams }: { searchParams: Promise<{ minted?: string }> }) {
  const { minted } = await searchParams
  const campaigns = await listCampaigns()
  const note = minted && minted !== 'ok' ? MINT_MESSAGE[minted] ?? MINT_MESSAGE.failed : null
  const landed = campaigns.reduce((sum, c) => sum + c.redeemed * c.amountFils, 0)

  return (
    <main>
      <h1>Coupons and vouchers</h1>
      <p className="dim">
        Every code is credit with a scope — it lands on the account and comes off the bills it was aimed at ·{' '}
        <Link href="/ctrl">Partners →</Link>
      </p>

      {note && <div className="card" style={{ borderColor: 'var(--bad)' }}>{note}</div>}

      <div className="card">
        <table>
          <thead>
            <tr><th>Campaign</th><th>Kind</th><th>Code</th><th>Each</th><th>Scope</th><th>Source</th><th>Landed</th><th>Until</th><th>Status</th></tr>
          </thead>
          <tbody>
            {campaigns.map((c) => (
              <tr key={c.id}>
                <td><Link href={`/ctrl/coupons/${c.id}`}>{c.name}</Link></td>
                <td className="dim">{c.kind}</td>
                <td><code>{c.kind === 'coupon' ? c.code : `${c.codeCount} codes`}</code></td>
                <td className="amount">AED {c.amountAed}</td>
                <td className="dim">{c.scopeLabel}</td>
                <td className="dim">{c.source || '—'}</td>
                <td className="amount">
                  {c.redeemed}{c.maxRedemptions !== null ? ` / ${c.maxRedemptions}` : ''} · AED {c.landedAed}
                </td>
                <td className="dim">{when(c.validUntil)}</td>
                <td>
                  <span className={`pill ${c.status === 'live' ? 'good' : c.status === 'ended' ? 'bad' : ''}`}>{c.status}</span>
                </td>
              </tr>
            ))}
            {campaigns.length === 0 && <tr><td colSpan={9} className="dim">Nothing minted yet.</td></tr>}
          </tbody>
          {campaigns.length > 0 && (
            <tfoot>
              <tr><td colSpan={6} className="dim">Landed so far, all campaigns</td><td className="amount" colSpan={3}>AED {(landed / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td></tr>
            </tfoot>
          )}
        </table>
      </div>

      <h2>New coupon</h2>
      <p className="dim">One shared code for a coupon site. Once per account and once per person, until the ceiling or the date.</p>
      <div className="card">
        <form action={mintCampaignAction} className="row">
          <input type="hidden" name="kind" value="coupon" />
          <input name="name" placeholder="Name — e.g. Coupon site A · Sept" style={{ flex: '1 1 220px' }} required />
          <input name="source" placeholder="Source — e.g. coupons-ae" style={{ flex: '1 1 140px' }} />
          <input name="code" placeholder="Code (blank mints ENTRE40-XXXX)" style={{ flex: '1 1 200px' }} />
          <select name="amountAed" defaultValue={String(COUPON_AED.ladder[1])}>
            {COUPON_AED.ladder.map((a) => <option key={a} value={a}>AED {a}</option>)}
            {[80, 100, 150, 200, 300, 500].map((a) => <option key={a} value={a}>AED {a}</option>)}
          </select>
          <select name="scope" defaultValue="bills">
            {SCOPE_CHOICES.map((s) => <option key={s} value={s}>{scopeLabel(s)}</option>)}
          </select>
          <input name="count" inputMode="numeric" placeholder="Ceiling (blank = none)" style={{ width: 170 }} />
          <input name="validUntil" type="date" title="Valid until" />
          <button type="submit">Mint the coupon</button>
        </form>
      </div>

      <h2>New voucher batch</h2>
      <p className="dim">Single-use codes to sell on a gift site. Each code lands once, for whoever holds it.</p>
      <div className="card">
        <form action={mintCampaignAction} className="row">
          <input type="hidden" name="kind" value="voucher" />
          <input name="name" placeholder="Name — e.g. Gift site B · AED 500" style={{ flex: '1 1 220px' }} required />
          <input name="source" placeholder="Source — e.g. gift-site-b" style={{ flex: '1 1 140px' }} />
          <select name="amountAed" defaultValue={String(VOUCHER_AED.ladder[1])}>
            {VOUCHER_AED.ladder.map((a) => <option key={a} value={a}>AED {a.toLocaleString()}</option>)}
            {[5_000, 10_000].map((a) => <option key={a} value={a}>AED {a.toLocaleString()}</option>)}
          </select>
          <select name="scope" defaultValue="bills">
            {SCOPE_CHOICES.map((s) => <option key={s} value={s}>{scopeLabel(s)}</option>)}
          </select>
          <input name="count" inputMode="numeric" placeholder="How many codes" defaultValue="20" style={{ width: 150 }} required />
          <input name="validUntil" type="date" title="Valid until" />
          <button type="submit">Mint the batch</button>
        </form>
      </div>
    </main>
  )
}
