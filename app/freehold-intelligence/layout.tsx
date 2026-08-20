import { FreeholdIntelligenceShell } from './shell-client'
import { getTenantForRequestHost } from '@/lib/tenancy/server'
import { trialState, type TrialState } from '@/lib/tenancy/trial'

/**
 * The management system is an authenticated, multi-tenant surface — every
 * request must resolve its tenant from the Host header (brand, plan, schema).
 * Client-only pages under this segment used to PRERENDER at build, where
 * headers() is empty, so they shipped a baked shell with the STATIC brand and
 * plan 'company': a realtor tenant saw the full company spine and the wrong
 * name in the topbar, while dynamic pages beside them resolved correctly.
 * Forcing the segment dynamic is the honest setting for an app whose every
 * screen depends on who is asking and from which host.
 */
export const dynamic = 'force-dynamic'

export default async function FreeholdIntelligenceLayout({ children }: { children: React.ReactNode }) {
  // Resolved HERE rather than carried on the brand snapshot, which the client
  // caches in localStorage forever (see BrandProvider — "stale beats
  // stranger"). A brand is stable; "ends in 2 days" is not, and a cached copy
  // of it would still be saying 2 days a month later. The segment is already
  // force-dynamic, so this costs the lookup the brand resolution already does.
  //
  // Degrades to null on any failure, which renders nothing — the same as every
  // workspace looked like before the trial was read at all. A banner is never
  // worth a 500.
  let trial: TrialState | null = null
  try {
    const tenant = await getTenantForRequestHost()
    if (tenant) trial = trialState(tenant, new Date())
  } catch { /* nothing to say beats a broken layout */ }

  return <FreeholdIntelligenceShell trial={trial}>{children}</FreeholdIntelligenceShell>
}
