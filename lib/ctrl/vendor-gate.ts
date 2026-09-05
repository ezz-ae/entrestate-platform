/**
 * IS THIS REQUEST ON A TENANT'S HOST? — the control plane's second gate.
 *
 * Every workspace runs this same code, and a customer's owner is an admin
 * of their own workspace, so the /ctrl role check alone would let
 * {customer}.entrestate.com/ctrl render the vendor's control plane — the
 * partner wallets, the lead pool, the coupon desk — over the SHARED schema.
 * The proxy already fences a session to the host it was minted on, so the
 * host is the truth: on a tenant host the control plane does not exist.
 *
 * Read from next/headers, so it works in a layout and in a server action
 * alike (an action is reachable without the page that rendered it).
 */
import { headers } from 'next/headers'
import { tenantSubdomainFromHost } from '@/lib/tenancy/config'

export async function onTenantHost(): Promise<boolean> {
  try {
    const h = await headers()
    return tenantSubdomainFromHost(h.get('host')) !== null
  } catch {
    // No request scope (a script) — not a tenant host.
    return false
  }
}
