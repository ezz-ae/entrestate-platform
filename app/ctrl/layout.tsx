import { redirect } from 'next/navigation'
import { getSessionUser, isAdminRole } from '@/lib/auth'
import { onTenantHost } from '@/lib/ctrl/vendor-gate'
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
  // Not signed in → the Entrestate door (the vendor's roster is recognised
  // from the Neon account; /server is where the door sends a stranger). A
  // broker (isAdminRole is the same management line the landing-page editor
  // and every other staff surface use) → the sign-in screen.
  if (!user) redirect('/api/wl/recognise?next=%2Fctrl')
  if (!isAdminRole(user.role)) redirect('/server')
  // THE CONTROL PLANE IS THE VENDOR'S. Every workspace runs this same code,
  // and a customer's owner is an admin of their own workspace — so on a
  // tenant host ({sub}.entrestate.com) this must never render a screen that
  // writes the SHARED schema: the partner wallets, the lead pool, and now
  // the coupon desk. A tenant is sent home; nothing here is theirs. The
  // why, in full: lib/ctrl/vendor-gate.ts.
  if (await onTenantHost()) redirect('/')
  return <div className="ctrl-shell">{children}</div>
}
