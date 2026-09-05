import Link from 'next/link'
import { notFound } from 'next/navigation'
import { readCampaign } from '@/lib/coupon-campaigns'
import { setStatusAction } from '../actions'

export const dynamic = 'force-dynamic'

/**
 * ONE CAMPAIGN — its codes and its landings.
 *
 * For a voucher batch this is the list to hand to the gift site: every code,
 * and whether it has been used. For a coupon it is the one code and who
 * landed it. Pause holds it; End closes it for good — nothing is deleted.
 */
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—')

export default async function CampaignPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ minted?: string }> }) {
  const { id } = await params
  const { minted } = await searchParams
  const c = await readCampaign(id)
  if (!c) notFound()
  const unused = c.codes.filter((k) => k.maxUses !== null && k.used < k.maxUses).length

  return (
    <main>
      <p className="dim"><Link href="/ctrl/coupons">← Coupons and vouchers</Link></p>
      <h1>{c.name}</h1>
      <p className="dim">
        {c.kind} · AED {c.amountAed} each · on {c.scopeLabel} · {c.source || 'no source'} · until {c.validUntil ? new Date(c.validUntil).toLocaleDateString('en-GB') : 'no date'} ·{' '}
        <span className={`pill ${c.status === 'live' ? 'good' : c.status === 'ended' ? 'bad' : ''}`}>{c.status}</span>
      </p>

      {minted === 'ok' && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <b>Minted.</b> {c.kind === 'voucher' ? `${c.codes.length} codes below — copy them to the gift site.` : `The code is ${c.codes[0]?.code ?? ''}.`}
        </div>
      )}

      <div className="card">
        <table>
          <tbody>
            <tr><th>Landed</th><td className="amount">{c.redeemed}{c.maxRedemptions !== null ? ` of ${c.maxRedemptions}` : ''} · AED {c.landedAed}</td></tr>
            {c.kind === 'voucher' && <tr><th>Unused codes</th><td className="amount">{unused} of {c.codes.length}</td></tr>}
          </tbody>
        </table>
        {c.status !== 'ended' && (
          <div className="row" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <form action={setStatusAction}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="status" value={c.status === 'paused' ? 'live' : 'paused'} />
              <button type="submit" className="ghost">{c.status === 'paused' ? 'Resume' : 'Pause'}</button>
            </form>
            <form action={setStatusAction}>
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="status" value="ended" />
              <button type="submit" className="ghost">End for good</button>
            </form>
          </div>
        )}
      </div>

      <h2>{c.kind === 'voucher' ? 'Codes' : 'Code'}</h2>
      <div className="card">
        {c.kind === 'voucher' ? (
          <>
            <div className="token" style={{ whiteSpace: 'pre-wrap' }}>{c.codes.filter((k) => k.maxUses === null || k.used < k.maxUses).map((k) => k.code).join('\n')}</div>
            <p className="dim" style={{ marginTop: 8 }}>Unused codes only, one per line — paste into the gift site&apos;s listing.</p>
          </>
        ) : (
          <div className="token">{c.codes[0]?.code}</div>
        )}
      </div>

      <h2>Landings</h2>
      <div className="card">
        <table>
          <thead><tr><th>When</th><th>Code</th><th>Account</th></tr></thead>
          <tbody>
            {c.claims.map((l, i) => (
              <tr key={i}><td className="dim">{when(l.claimedAt)}</td><td><code>{l.code}</code></td><td>{l.account}</td></tr>
            ))}
            {c.claims.length === 0 && <tr><td colSpan={3} className="dim">Nobody yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  )
}
