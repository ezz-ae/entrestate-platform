import "server-only"
import { getCurrentEntitlement, type CurrentEntitlement } from "@/lib/account-entitlement"

/**
 * Paid-tier capability gates — single source of truth for what each tier can do.
 *
 * Product model (decided 2026-05-02):
 *   - Data is FREE: every visitor and free-tier user gets the full evidence-graded
 *     read surface (verdicts, areas, developers, properties, market pulse).
 *   - Open connection is PAID: anything that pushes data IN, pulls data OUT
 *     programmatically, or runs Entrestate's scoring against the user's own
 *     inventory requires a paid tier.
 *
 * This module lets every server route make a single call to check capability.
 */

export type PaidCapability =
  | "personal_home"          // /me — landing for logged-in users (free, but still gated by auth)
  | "saved_searches"          // unlimited saved searches (free has 5)
  | "alerts"                  // email/push alerts on saved areas/projects
  | "listings_ingest"         // POST /api/v1/listings — push your own inventory
  | "listings_score"          // run Entrestate scoring against your listings
  | "portal_connections"      // Bayut / Property Finder ingestion
  | "crm_connections"         // HubSpot / Pipedrive / Bitrix24 sync
  | "custom_feeds"            // user-defined feed/webhook
  | "api_keys"                // create programmatic API keys
  | "api_read_market"         // GET /api/v1/* — public data
  | "api_read_listings"       // GET your-own-listings via API
  | "api_write_listings"      // POST/PUT/DELETE listings via API
  | "white_label_embed"       // <iframe> embed on customer site
  | "data_residency_choice"   // EU vs UAE residency selection

const TIER_RANK: Record<CurrentEntitlement["tier"], number> = {
  free: 0,
  pro: 1,
  team: 2,
  institutional: 3,
}

const CAPABILITY_MIN_TIER: Record<PaidCapability, CurrentEntitlement["tier"]> = {
  personal_home: "free",          // logged-in only, no tier requirement
  saved_searches: "free",          // limit applied separately (see CAP_LIMITS below)
  alerts: "pro",
  listings_ingest: "pro",
  listings_score: "pro",
  portal_connections: "pro",
  crm_connections: "team",
  custom_feeds: "team",
  api_keys: "pro",
  api_read_market: "free",         // public data is free — works without a key, just rate-limited
  api_read_listings: "pro",
  api_write_listings: "pro",
  white_label_embed: "institutional",
  data_residency_choice: "institutional",
}

/** Caps for free / pro / team / institutional. -1 = unlimited. */
export const CAP_LIMITS = {
  saved_searches: { free: 5, pro: 50, team: -1, institutional: -1 },
  monthly_verdicts: { free: 25, pro: 500, team: -1, institutional: -1 },
  listings_total: { free: 0, pro: 100, team: 1000, institutional: -1 },
  api_calls_per_month: { free: 0, pro: 5_000, team: 50_000, institutional: -1 },
  team_seats: { free: 1, pro: 1, team: 10, institutional: -1 },
  reports_per_month: { free: 1, pro: 10, team: 50, institutional: -1 },
} as const

export function tierMeets(tier: CurrentEntitlement["tier"], minimum: CurrentEntitlement["tier"]) {
  return TIER_RANK[tier] >= TIER_RANK[minimum]
}

export function hasCapability(tier: CurrentEntitlement["tier"], cap: PaidCapability) {
  return tierMeets(tier, CAPABILITY_MIN_TIER[cap])
}

export function capabilityMinTier(cap: PaidCapability) {
  return CAPABILITY_MIN_TIER[cap]
}

export type CapabilityCheck =
  | { ok: true; tier: CurrentEntitlement["tier"]; entitlement: CurrentEntitlement }
  | { ok: false; tier: CurrentEntitlement["tier"]; required: CurrentEntitlement["tier"]; entitlement: CurrentEntitlement; reason: "auth_required" | "tier_too_low" }

/**
 * Server-side capability check — call from any route handler or server component.
 * Returns a discriminated union; pair with a UI surface that renders an upsell when ok=false.
 */
export async function requireCapability(cap: PaidCapability): Promise<CapabilityCheck> {
  const entitlement = await getCurrentEntitlement()
  if (!entitlement.accountKey) {
    return { ok: false, tier: entitlement.tier, required: capabilityMinTier(cap), entitlement, reason: "auth_required" }
  }
  if (hasCapability(entitlement.tier, cap)) {
    return { ok: true, tier: entitlement.tier, entitlement }
  }
  return { ok: false, tier: entitlement.tier, required: capabilityMinTier(cap), entitlement, reason: "tier_too_low" }
}

/** Convenience wrapper for limit checks (returns numeric cap; -1 means unlimited). */
export function getLimit<K extends keyof typeof CAP_LIMITS>(tier: CurrentEntitlement["tier"], key: K): number {
  return CAP_LIMITS[key][tier]
}

/** Returns a human-readable list of what each tier unlocks — used on /pricing and on upsell modals. */
export function tierFeatureMatrix() {
  return [
    { id: "data", label: "Read all UAE real estate data", free: true, pro: true, team: true, institutional: true },
    { id: "verdicts", label: "Evidence-graded verdicts", free: true, pro: true, team: true, institutional: true },
    { id: "saved", label: "Saved searches & areas", free: "5", pro: "50", team: "Unlimited", institutional: "Unlimited" },
    { id: "alerts", label: "Email + push alerts on your saved areas", free: false, pro: true, team: true, institutional: true },
    { id: "listings_ingest", label: "Push your own listings (CSV / API / brochure)", free: false, pro: "100", team: "1,000", institutional: "Unlimited" },
    { id: "listings_score", label: "Score your listings with the same evidence stack", free: false, pro: true, team: true, institutional: true },
    { id: "api_keys", label: "API keys + programmatic access", free: false, pro: true, team: true, institutional: true },
    { id: "portals", label: "Bayut + Property Finder ingestion", free: false, pro: true, team: true, institutional: true },
    { id: "crm", label: "HubSpot / Pipedrive / Bitrix24 sync", free: false, pro: false, team: true, institutional: true },
    { id: "custom_feeds", label: "Custom feeds + webhooks", free: false, pro: false, team: true, institutional: true },
    { id: "white_label", label: "White-label embed on your site", free: false, pro: false, team: false, institutional: true },
    { id: "residency", label: "Choose EU or UAE data residency", free: false, pro: false, team: false, institutional: true },
    { id: "team", label: "Team seats", free: "1", pro: "1", team: "10", institutional: "Unlimited" },
  ]
}
