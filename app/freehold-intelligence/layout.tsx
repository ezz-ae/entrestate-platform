import { FreeholdIntelligenceShell } from './shell-client'

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

export default function FreeholdIntelligenceLayout({ children }: { children: React.ReactNode }) {
  return <FreeholdIntelligenceShell>{children}</FreeholdIntelligenceShell>
}
