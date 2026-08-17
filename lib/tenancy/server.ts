/**
 * Server-side resolution of the current SaaS tenant from the request Host
 * header. Mirrors lib/whitelabel/server.ts: returns null everywhere except a
 * live tenant host on a tenancy-enabled deployment, so callers can fall back
 * to the WL demo cookie and then the static BRAND.
 *
 * Node runtime only (uses next/headers + the control-plane store). headers()
 * is called only when tenancy is enabled, so the Freehold deployment keeps
 * its static rendering behaviour untouched.
 */

import { headers } from 'next/headers'
import { SAAS_TENANCY, tenantSubdomainFromHost } from './config'
import { getTenantBySubdomain, type SaasTenant } from './store'
import type { BrandSnapshot } from '@/components/whitelabel/brand-provider'

/** The tenant the current request's host resolves to, or null. */
export async function getTenantForRequestHost(): Promise<SaasTenant | null> {
  const host = SAAS_TENANCY ? (await headers()).get('host') : null
  if (!SAAS_TENANCY) return null
  const sub = tenantSubdomainFromHost(host)
  if (!sub) {
    // Diagnostic for the intermittent vendor-brand leak: on leak rounds the
    // resolver returns null WITHOUT an error, so either this host string is
    // not the tenant host, or tenancy was off in this context. Log only for
    // hosts that look like ours so vendor traffic stays quiet.
    if (host && host.includes('entrestate')) {
      console.warn('[tenancy] host did not resolve to a tenant:', JSON.stringify(host))
    }
    return null
  }
  // DB hiccups must degrade to the default brand rather than crash the
  // layout — but degrading means the VENDOR's brand over a TENANT's page, so
  // a transient failure gets one retry first, and every degradation is named
  // in the logs. A fresh instance's first lookup (cold pool + the control-
  // plane ensure DDL) is exactly where the transients live.
  try {
    return await getTenantBySubdomain(sub)
  } catch (first) {
    await new Promise((r) => setTimeout(r, 250))
    try {
      return await getTenantBySubdomain(sub)
    } catch (second) {
      console.error('[tenancy] host tenant resolution degraded to static brand for', sub, second)
      return null
    }
  }
}

/** Brand snapshot for the current tenant host — feeds the BrandProvider. */
export async function getTenantBrand(): Promise<BrandSnapshot | null> {
  const tenant = await getTenantForRequestHost()
  if (!tenant || tenant.status === 'suspended') return null
  return {
    company: tenant.company,
    product: tenant.product,
    accent: tenant.accent,
    logo: tenant.logo ? '/api/wl/logo' : '',
    // Host-resolved on every request — NOT baked into the session cookie — so
    // a plan change lands the moment the tenant row changes, no re-login.
    plan: tenant.plan,
  }
}

/**
 * Is this request for a tenant address that does not exist?
 *
 * The wildcard DNS record makes EVERY label under the base domain reach the
 * app, so a typo, a probe or a deleted workspace all arrive here looking
 * exactly like a real customer. They used to fail deep in the data layer —
 * lib/db.ts throws TenantResolutionError when it cannot resolve a schema —
 * and that exception surfaced as a 500. A subdomain nobody registered is a
 * page that does not exist, not a server fault: it must be a clean 404, which
 * is also the only answer that keeps search engines from indexing crashes.
 *
 * True ONLY when the host is tenant-shaped AND unresolvable. A vendor host, a
 * reserved label, a preview URL or a custom domain all answer false, so this
 * can never 404 the vendor's own site.
 */
export async function isUnknownTenantHost(): Promise<boolean> {
  if (!SAAS_TENANCY) return false
  const h = await headers()
  const sub = tenantSubdomainFromHost(h.get('host'))
  if (!sub) return false
  // A lookup FAILURE must not read as "no such tenant" — degrading a database
  // blip into a 404 would take every live customer down at once. Only a
  // successful lookup that found nothing is grounds to refuse.
  try {
    return (await getTenantBySubdomain(sub)) === null
  } catch {
    return false
  }
}
