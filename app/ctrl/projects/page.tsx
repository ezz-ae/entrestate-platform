import Link from 'next/link'
import { ctrlQuery, ensureCtrlSchema } from '@/lib/ctrl/db'
import { filsToAed } from '@/lib/ctrl/pricing'
import { createProjectAction, updateProjectAction } from '../actions'

export const dynamic = 'force-dynamic'

/**
 * The catalog, from the seller's side. A project is the unit clients shop
 * for; forms feed it via ctrl_mappings.project_ref. The optional pinned price
 * outranks every partner's multiplier/floor arithmetic — pin it when the
 * catalog promises one number, leave it empty to let each partner's rule speak.
 */
export default async function CtrlProjectsPage() {
  await ensureCtrlSchema()
  const r = await ctrlQuery(
    `SELECT p.id, p.name, p.description, p.active, p.price_fils_override::text AS o,
            (SELECT COUNT(*) FROM ctrl_mappings m WHERE m.project_ref = p.id AND m.kind = 'form')::text AS forms,
            (SELECT COUNT(*) FROM ctrl_leads l WHERE l.project_id = p.id)::text AS leads,
            (SELECT COUNT(*) FROM ctrl_subscriptions s WHERE s.project_id = p.id)::text AS subs
       FROM ctrl_projects p ORDER BY p.created_at DESC`,
  )

  return (
    <main>
      <p><Link href="/ctrl">← Partners</Link></p>
      <h1>Projects</h1>
      <p className="dim">
        What clients shop for, lead by lead. Attach forms to a project on each partner's
        mapping table; a pinned price (AED / lead) overrides partner pricing for that
        project's leads.
      </p>

      <h2>New project</h2>
      <div className="card">
        <form action={createProjectAction} className="row">
          <input name="name" placeholder="Project name (e.g. Reportage Townhouses)" style={{ flex: 1 }} />
          <input name="description" placeholder="One line the client sees" style={{ flex: 1 }} />
          <input name="priceAed" placeholder="Pinned AED/lead (empty = partner pricing)" style={{ width: 230 }} />
          <button type="submit">Create</button>
        </form>
      </div>

      {r.rows.map((p) => (
        <div className="card" key={p.id}>
          <form action={updateProjectAction} className="row" style={{ flexWrap: 'wrap' }}>
            <input type="hidden" name="id" value={p.id} />
            <input name="name" defaultValue={p.name} style={{ width: 220 }} />
            <input name="description" defaultValue={p.description} style={{ flex: 1, minWidth: 200 }} />
            <input name="priceAed" defaultValue={p.o === null || p.o === undefined ? '' : String(Number(p.o) / 100)}
              placeholder="AED/lead" style={{ width: 100 }} />
            <label className="dim" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" name="active" defaultChecked={p.active} /> active
            </label>
            <button type="submit" className="ghost">Save</button>
          </form>
          <p className="dim" style={{ marginBottom: 0 }}>
            <code>{p.id}</code> · {Number(p.forms) || 0} forms feed it · {Number(p.leads) || 0} leads ·{' '}
            {Number(p.subs) || 0} clients chose it
            {p.o !== null && p.o !== undefined && <> · pinned AED {filsToAed(Number(p.o))}</>}
          </p>
        </div>
      ))}
      {r.rows.length === 0 && <div className="card"><p className="dim">No projects yet.</p></div>}
    </main>
  )
}
