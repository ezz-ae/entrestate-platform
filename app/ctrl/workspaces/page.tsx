import { readWorkspaces } from '@/lib/ctrl/admin-figures'
import { TENANT_BASE_DOMAIN } from '@/lib/tenancy/config'

export const dynamic = 'force-dynamic'

/**
 * WORKSPACES — every customer instance, and who is owed a conversation.
 *
 * `trial_ends_at` was written from the day this product had tenants and
 * read by nothing (lib/tenancy/trial.ts); GET /api/wl/tenants surfaced it
 * behind a secret header and no screen. This is the screen: the list, the
 * starting period in words (never "trial"), and the chase — the customers
 * whose period is ending or ended, longest-lapsed first.
 */
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

export default async function WorkspacesPage() {
  const { lines, unknown } = await readWorkspaces()
  const chase = lines.filter((l) => l.chase)
  return (
    <main>
      <p className="eyebrow">Company</p>
      <h1>Workspaces</h1>
      <p className="dim">{unknown ? 'The workspace list could not be read just now.' : `${lines.length} customer instance${lines.length === 1 ? '' : 's'} on ${TENANT_BASE_DOMAIN}.`}</p>

      {chase.length > 0 ? (
        <>
          <h2>Owed a conversation</h2>
          <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--warn) 40%, var(--line))' }}>
            <table>
              <thead><tr><th>Company</th><th>Owner</th><th>Plan</th><th>Where it stands</th></tr></thead>
              <tbody>
                {chase.map((l) => (
                  <tr key={l.subdomain}>
                    <td>{l.company} <span className="dim">· {l.subdomain}</span></td>
                    <td>{l.ownerEmail ?? <span className="dim">unknown</span>}</td>
                    <td className="dim">{l.plan}</td>
                    <td><span className="pill warn">{l.periodLabel}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      <h2>All workspaces</h2>
      <div className="card">
        <table>
          <thead><tr><th>Company</th><th>Address</th><th>Owner</th><th>Plan</th><th>Status</th><th>Since</th></tr></thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.subdomain}>
                <td>{l.company}</td>
                <td><a href={`https://${l.subdomain}.${TENANT_BASE_DOMAIN}/`} target="_blank" rel="noreferrer"><code>{l.subdomain}</code></a></td>
                <td>{l.ownerEmail ?? <span className="dim">unknown</span>}</td>
                <td className="dim">{l.plan}</td>
                <td><span className={`pill ${l.status === 'active' ? 'good' : l.status === 'suspended' ? 'bad' : l.chase ? 'warn' : ''}`}>{l.periodLabel}</span></td>
                <td className="dim">{when(l.createdAt)}</td>
              </tr>
            ))}
            {lines.length === 0 && <tr><td colSpan={6} className="dim">{unknown ? 'Could not read.' : 'No workspaces yet.'}</td></tr>}
          </tbody>
        </table>
      </div>
    </main>
  )
}
