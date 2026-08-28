'use client'

/**
 * Runtime brand context. In the white-label deployment the server root layout
 * reads the signed workspace cookie and passes the prospect's brand snapshot
 * here; everywhere else this yields the static build-time BRAND, so every
 * consumer behaves identically in the Freehold product.
 *
 * Consumers use `useBrand()` instead of importing BRAND directly, so the app
 * chrome (nav wordmark, logo, accent, title) re-skins per workspace.
 */

import { createContext, useContext, useEffect, useState } from 'react'
import { BRAND, brandName } from '@/lib/freehold/brand'

export interface RuntimeBrand {
  /** Company display name, e.g. "Skyline". */
  company: string
  /** Product word after the company name, e.g. "Intelligence". */
  product: string
  /** Full name, e.g. "Skyline Intelligence". */
  name: string
  /** Brand accent hex. */
  accent: string
  /** Logo image URL, or '' for a wordmark-only mark. */
  logo: string
  /**
   * Workspace plan — 'realtor' is the one-person "Meta for Realtors"
   * workspace and gets a gated surface set; 'company' is everything.
   * Always resolved here (never optional) so gating code can branch on it
   * without null-guards; non-tenant modes are 'company' by definition.
   */
  plan: 'company' | 'realtor' | 'account'
}

/** The static Freehold brand — the default when no workspace override is set. */
const STATIC_BRAND: RuntimeBrand = {
  company: BRAND.company,
  product: BRAND.product,
  name: brandName,
  accent: BRAND.accent,
  logo: '/freehold-logo.png',
  plan: 'company',
}

const BrandContext = createContext<RuntimeBrand>(STATIC_BRAND)

/** Server passes a partial snapshot (from the cookie) or null (Freehold mode). */
export interface BrandSnapshot {
  company: string
  product: string
  accent: string
  logo: string
  /**
   * Optional because only the SaaS tenant host resolves a real plan; the WL
   * demo cookie path has no tenant row and simply omits it. Absent means
   * 'company' — the full surface set.
   */
  plan?: 'company' | 'realtor' | 'account'
}

const BRAND_STORE_KEY = 'fh_last_brand_v1'

export function BrandProvider({
  brand,
  children,
}: {
  brand: BrandSnapshot | null
  children: React.ReactNode
}) {
  // Stale beats stranger, client edition. The server occasionally hands a
  // tenant page a null brand (a request-time rendering race still under
  // investigation — see the tenancy resolver's logging). Regressing to the
  // STATIC vendor brand dresses a tenant's workspace in the wrong company and,
  // for realtor plans, the wrong nav — and in an SPA the initial document's
  // brand is the WHOLE tab's brand, so one raced document used to poison the
  // session. localStorage, not sessionStorage: it is origin-scoped (each
  // tenant host is its own origin, so brands can never bleed across tenants)
  // and survives restarts — a browser that has EVER seen this workspace's
  // brand keeps it. Only the first visit of a fresh browser can catch the
  // race, once.
  const [stored, setStored] = useState<BrandSnapshot | null>(null)
  useEffect(() => {
    if (brand) {
      try { localStorage.setItem(BRAND_STORE_KEY, JSON.stringify(brand)) } catch { /* private mode */ }
    } else {
      try {
        const raw = localStorage.getItem(BRAND_STORE_KEY)
        if (raw) setStored(JSON.parse(raw) as BrandSnapshot)
      } catch { /* unreadable — stay static */ }
    }
  }, [brand])
  const effective = brand ?? stored

  const value: RuntimeBrand = effective
    ? {
        company: effective.company,
        product: effective.product,
        name: `${effective.company} ${effective.product}`.trim(),
        accent: effective.accent,
        logo: effective.logo,
        plan: effective.plan ?? 'company',
      }
    : STATIC_BRAND

  // Keep the browser tab in sync with the runtime brand (Phase-1 demo touch;
  // full metadata rebrand lives in generateMetadata).
  useEffect(() => {
    if (effective) document.title = value.name
  }, [effective, value.name])

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>
}

/** Resolved brand for the current session — runtime workspace, else Freehold. */
export function useBrand(): RuntimeBrand {
  return useContext(BrandContext)
}
