import '../ctrl/ctrl.css'

export const dynamic = 'force-dynamic'

/**
 * The public storefront shell. /portal/[slug] is the partner's own lead-by-lead
 * marketplace, reached by an unguessable capability URL — no login, because the
 * link IS the credential (regenerable from the staff console). It shares the
 * control plane's skin but none of its gate.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return <div className="ctrl-shell">{children}</div>
}
