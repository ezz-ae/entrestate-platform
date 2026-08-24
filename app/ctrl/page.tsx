import Link from 'next/link'
import { cookies } from 'next/headers'
import { ctrlQuery, ensureCtrlSchema } from '@/lib/ctrl/db'
import { listTenants } from '@/lib/ctrl/tenants'
import { filsToAed } from '@/lib/ctrl/pricing'
import { createTenantAction } from './actions'

export const dynamic = 'force-dynamic'

/**
 * The roster: every partner, its balance, and what is waiting on money.
 * `held` is the number this screen exists to surface — leads we have bought
 * and priced that the partner cannot see yet because the wallet is short.
 */
export default async function CtrlHome() {
  await ensureCtrlSchema()
  const tenants = await listTenants()

  const stats = await ctrlQuery(
    `SELECT tenant_id,
            COUNT(*) FILTER (WHERE state = 'held')::text AS held,
            COUNT(*) FILTER (WHERE state = 'delivered')::text AS delivered
       FROM ctrl_leads GROUP BY tenant_id`,
  )
  const byTenant = new Map(stats.rows.map((r) => [r.tenant_id, r]))
  // Partners with no leads yet still need their balance shown.
  const balances = await ctrlQuery(
    `SELECT tenant_id, SUM(CASE WHEN kind = 'credit' THEN amount_fils ELSE -amount_fils END)::text AS balance
       FROM ctrl_wallet_entries GROUP BY tenant_id`,
  )
  const balanceOf = new Map(balances.rows.map((r) => [r.tenant_id, Number(r.balance) || 0]))

  const jar = await cookies()
  const flash = jar.get('ctrl_flash_token')?.value ?? null
  const [flashName, flashToken] = flash ? flash.split('::') : [null, null]

  return (
    <main>
      <h1>Partners</h1>
      <p className="dim">
        Each partner is one client system buying leads at your prices ·{' '}
        <Link href="/ctrl/projects">Projects catalog →</Link>
      </p>

      {flashToken && (
        <div className="card" style={{ borderColor: 'var(--accent)' }}>
          <b>Token for {flashName}</b> — copy it NOW; it is never shown again.
          Put it in the client system as <code>PARTNER_PLANE_TOKEN</code>.
          <div className="token" style={{ marginTop: 8 }}>{flashToken}</div>
        </div>
      )}

      <div className="card">
        <table>
          <thead>
            <tr><th>Name</th><th>Balance</th><th>Delivered</th><th>Held (unpaid)</th><th></th></tr>
          </thead>
          <tbody>
            {tenants.map((t) => {
              const s = byTenant.get(t.id)
              const held = Number(s?.held) || 0
              return (
                <tr key={t.id}>
                  <td><Link href={`/ctrl/tenant/${t.id}`}>{t.name}</Link></td>
                  <td className="amount">AED {filsToAed(balanceOf.get(t.id) ?? 0)}</td>
                  <td className="amount">{Number(s?.delivered) || 0}</td>
                  <td>{held > 0 ? <span className="pill bad">{held}</span> : <span className="pill">0</span>}</td>
                  <td className="dim">{t.id}</td>
                </tr>
              )
            })}
            {tenants.length === 0 && <tr><td colSpan={5} className="dim">No partners yet.</td></tr>}
          </tbody>
        </table>
      </div>

      <h2>New partner</h2>
      <div className="card">
        <form action={createTenantAction} className="row">
          <input name="name" placeholder="Client name (e.g. Freehold Properties)" style={{ flex: 1 }} />
          <button type="submit">Create + mint token</button>
        </form>
      </div>
    </main>
  )
}
