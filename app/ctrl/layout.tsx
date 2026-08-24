import { redirect } from 'next/navigation'
import { getSessionUser, isAdminRole } from '@/lib/auth'
import './ctrl.css'

export const dynamic = 'force-dynamic'

/**
 * The control plane's staff gate. /ctrl is where Entrestate runs the lead
 * marketplace — mints partners, prices leads, maps our Meta objects to them,
 * moves wallet money. It is management-only, server-checked (not merely the
 * client guard the CRM uses): a request that is not a signed-in manager never
 * renders a control page. The public storefront lives elsewhere (/portal/[slug],
 * capability URL, no login) — deliberately NOT under this gate.
 */
export default async function CtrlLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser()
  // Not signed in, or a broker (isAdminRole is the same management line the
  // landing-page editor and every other staff surface use) → bounce to login.
  if (!user || !isAdminRole(user.role)) redirect('/server')
  return <div className="ctrl-shell">{children}</div>
}
