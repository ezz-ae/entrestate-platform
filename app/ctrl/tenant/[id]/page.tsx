import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ctrlQuery, ensureCtrlSchema } from '@/lib/ctrl/db'
import { tenantById } from '@/lib/ctrl/tenants'
import { balanceFils, ledger } from '@/lib/ctrl/wallet'
import { pricingRuleFor } from '@/lib/ctrl/sync'
import { filsToAed } from '@/lib/ctrl/pricing'
import { getSiteUrl } from '@/lib/site'
import {
  setPricingAction, addMappingAction, removeMappingAction, manualEntryAction, syncTenantAction,
  setDeliveryModeAction, regenPortalSlugAction,
} from '../../actions'

export const dynamic = 'force-dynamic'

export default async function CtrlTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const tenant = await tenantById(id)
  if (!tenant) notFound()
  await ensureCtrlSchema()

  const rule = await pricingRuleFor(id)
  const balance = await balanceFils(id)
  const entries = await ledger(id, 50)
  const maps = await ctrlQuery(
    `SELECT id, kind, ref_id, name, campaign_ref, access, project_ref FROM ctrl_mappings WHERE tenant_id = $1 ORDER BY kind, id`,
    [id],
  )
  const projects = await ctrlQuery(`SELECT id, name FROM ctrl_projects WHERE active ORDER BY created_at DESC`)
  const projName = new Map(projects.rows.map((p) => [p.id, p.name]))
  const leadStats = await ctrlQuery(
    `SELECT state, COUNT(*)::text AS n, COALESCE(SUM(price_fils), 0)::text AS total
       FROM ctrl_leads WHERE tenant_id = $1 GROUP BY state`,
    [id],
  )
  const stat = (s: string) => leadStats.rows.find((r) => r.state === s)
  const base = getSiteUrl().replace(/\/+$/, '')

  return (
    <main>
      <p><Link href="/ctrl/partners">← Lead marketplace</Link></p>
      <h1>{tenant.name}</h1>
      <p className="dim">{tenant.id}</p>

      <div className="card">
        <table>
          <tbody>
            <tr><th>Balance</th><td className="amount">AED {filsToAed(balance)}</td></tr>
            <tr><th>Delivered</th><td className="amount">{Number(stat('delivered')?.n) || 0} leads · AED {filsToAed(Number(stat('delivered')?.total) || 0)} billed</td></tr>
            <tr><th>Held (unpaid)</th><td className="amount">{Number(stat('held')?.n) || 0} leads · AED {filsToAed(Number(stat('held')?.total) || 0)} waiting on balance</td></tr>
          </tbody>
        </table>
        <form action={syncTenantAction} className="row">
          <input type="hidden" name="tenantId" value={id} />
          <button type="submit" className="ghost">Pull new leads from Meta now</button>
        </form>
      </div>

      <h2>Marketplace portal</h2>
      <div className="card">
        <p className="dim" style={{ marginTop: 0 }}>
          Storefront link (capability URL — anyone holding it can browse and buy on this
          partner's wallet):{' '}
          <code>{`${base}/portal/${tenant.portalSlug}`}</code>
        </p>
        <div className="row">
          <form action={setDeliveryModeAction} className="row" style={{ margin: 0 }}>
            <input type="hidden" name="tenantId" value={id} />
            <input type="hidden" name="mode" value={tenant.deliveryMode === 'auto' ? 'marketplace' : 'auto'} />
            <span className="pill">{tenant.deliveryMode === 'auto' ? 'AUTO — poll bills oldest-first' : 'MARKETPLACE — client buys lead by lead'}</span>
            <button type="submit" className="ghost">
              Switch to {tenant.deliveryMode === 'auto' ? 'marketplace' : 'auto'}
            </button>
          </form>
          <form action={regenPortalSlugAction} style={{ margin: 0 }}>
            <input type="hidden" name="tenantId" value={id} />
            <button type="submit" className="ghost">Regenerate link (kills the old one)</button>
          </form>
        </div>
      </div>

      <h2>Pricing — the partner never sees this arithmetic</h2>
      <div className="card">
        <form action={setPricingAction} className="row">
          <input type="hidden" name="tenantId" value={id} />
          <label className="dim">Multiplier <input name="multiplier" defaultValue={rule.multiplier} style={{ width: 80 }} /></label>
          <label className="dim">Floor (AED) <input name="floorAed" defaultValue={rule.floorFils / 100} style={{ width: 90 }} /></label>
          <label className="dim">Fixed per lead (AED, empty = off) <input name="fixedAed" defaultValue={rule.fixedFils === null ? '' : rule.fixedFils / 100} style={{ width: 90 }} /></label>
          <button type="submit">Save</button>
        </form>
        <p className="dim" style={{ marginTop: 8 }}>
          Fixed wins when set. Otherwise price = our campaign CPL × multiplier (25 % margin by default), frozen onto each lead at arrival; the floor is the price only when no CPL is measurable yet.
        </p>
      </div>

      <h2>Mappings — what of OUR account belongs to this partner</h2>
      <div className="card">
        <table>
          <thead><tr><th>Kind</th><th>Meta ID</th><th>Name</th><th>Campaign</th><th>Project</th><th>Access</th><th></th></tr></thead>
          <tbody>
            {maps.rows.map((m) => (
              <tr key={m.id}>
                <td>{m.kind}</td>
                <td className="dim">{m.ref_id}</td>
                <td>{m.name}</td>
                <td className="dim">{m.campaign_ref ?? '—'}</td>
                <td className="dim">{m.project_ref ? (projName.get(m.project_ref) ?? m.project_ref) : '—'}</td>
                <td>{m.kind === 'facebook_page' || m.kind === 'instagram' ? <span className="pill">{m.access}</span> : '—'}</td>
                <td>
                  <form action={removeMappingAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="tenantId" value={id} />
                    <button type="submit" className="ghost">Remove</button>
                  </form>
                </td>
              </tr>
            ))}
            {maps.rows.length === 0 && <tr><td colSpan={7} className="dim">Nothing mapped — the partner sees an empty feed until a campaign and a form are mapped here.</td></tr>}
          </tbody>
        </table>
        <form action={addMappingAction} className="row">
          <input type="hidden" name="tenantId" value={id} />
          <select name="kind">
            <option value="campaign">campaign</option>
            <option value="form">form</option>
            <option value="facebook_page">facebook_page</option>
            <option value="instagram">instagram</option>
          </select>
          <input name="refId" placeholder="Meta ID" style={{ width: 170 }} />
          <input name="name" placeholder="Display name" style={{ width: 180 }} />
          <input name="campaignRef" placeholder="Campaign ID (forms only)" style={{ width: 170 }} />
          <select name="projectRef" defaultValue="">
            <option value="">no project</option>
            {projects.rows.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select name="access">
            <option value="read_write">read_write</option>
            <option value="read">read</option>
            <option value="none">none</option>
          </select>
          <button type="submit">Add</button>
        </form>
      </div>

      <h2>Ledger — manual top-up lives here</h2>
      <div className="card">
        <form action={manualEntryAction} className="row">
          <input type="hidden" name="tenantId" value={id} />
          <select name="kind"><option value="credit">credit</option><option value="debit">debit</option></select>
          <input name="amountAed" placeholder="AED" style={{ width: 90 }} />
          <input name="note" placeholder="Why (goes on the ledger line)" style={{ flex: 1 }} />
          <button type="submit">Add entry</button>
        </form>
        <table style={{ marginTop: 12 }}>
          <thead><tr><th>When</th><th>Kind</th><th>Amount</th><th>Ref</th><th>Note</th></tr></thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.ref}>
                <td className="dim">{e.at.slice(0, 16)}</td>
                <td><span className={`pill ${e.kind === 'credit' ? 'good' : ''}`}>{e.kind}</span></td>
                <td className="amount">{e.kind === 'credit' ? '+' : '−'}AED {filsToAed(e.amountFils)}</td>
                <td className="dim">{e.ref}</td>
                <td className="dim">{e.note}</td>
              </tr>
            ))}
            {entries.length === 0 && <tr><td colSpan={5} className="dim">No movements yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  )
}
