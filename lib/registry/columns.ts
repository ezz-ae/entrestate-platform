/**
 * Entrestate Column Registry v1.0
 *
 * Centralized registry for signals used in the Decision Infrastructure.
 * Maps columns to their Evidence Stack layers (L1-L5) and enforces tier gating.
 */

export type ColumnTier = "free" | "pro" | "team" | "institutional" | "business" | "enterprise"
export type EvidenceLayer = "L1" | "L2" | "L3" | "L4" | "L5"
export type ColumnGroup =
  | "Identity"
  | "Geography"
  | "Price"
  | "Temporal"
  | "Scoring"
  | "Risk"
  | "Yield"
  | "Developer"
  | "Quality"
  | "Contract"
  | "Operations"

export type ColumnSource = "sanity" | "derived" | "dld" | "bayut" | "pf" | "raw"

export interface ColumnDefinition {
  id: string
  label: string
  group: ColumnGroup
  layer: EvidenceLayer
  tier: ColumnTier
  description: string
  dataType: "number" | "string" | "boolean" | "date" | "json"
  source: ColumnSource
  nullable?: boolean
}

type ColumnSeed = Omit<ColumnDefinition, "layer">

type NormalizedTier = "free" | "pro" | "team" | "institutional"

const TIER_ALIASES: Record<ColumnTier, NormalizedTier> = {
  free: "free",
  pro: "pro",
  team: "team",
  institutional: "institutional",
  business: "team",
  enterprise: "institutional",
}

const TIER_ORDER: Record<NormalizedTier, number> = {
  free: 0,
  pro: 1,
  team: 2,
  institutional: 3,
}

const SOURCE_LAYER_MAP: Record<ColumnSource, EvidenceLayer> = {
  sanity: "L1",
  derived: "L2",
  dld: "L4",
  bayut: "L4",
  pf: "L4",
  raw: "L5",
}

const GROUP_LAYER_OVERRIDE: Partial<Record<ColumnGroup, EvidenceLayer>> = {
  Temporal: "L3",
}

const COLUMN_SEEDS: ColumnSeed[] = [
  // --- Identity ---
  {
    id: "project_id",
    label: "Project ID",
    group: "Identity",
    tier: "free",
    description: "Canonical project identifier",
    dataType: "string",
    source: "sanity",
    nullable: false,
  },
  {
    id: "name",
    label: "Project Name",
    group: "Identity",
    tier: "free",
    description: "Project display name",
    dataType: "string",
    source: "sanity",
    nullable: false,
  },
  {
    id: "urlPathSegment",
    label: "URL Slug",
    group: "Identity",
    tier: "free",
    description: "URL slug for project page",
    dataType: "string",
    source: "sanity",
    nullable: false,
  },
  {
    id: "developer",
    label: "Developer (raw)",
    group: "Identity",
    tier: "free",
    description: "Raw developer name as scraped",
    dataType: "string",
    source: "sanity",
    nullable: true,
  },
  {
    id: "developer_clean",
    label: "Developer",
    group: "Identity",
    tier: "free",
    description: "Canonicalized developer name",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
  {
    id: "static_developer_id",
    label: "Developer ID",
    group: "Identity",
    tier: "free",
    description: "Stable developer key for joins",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
  {
    id: "tags",
    label: "Tags",
    group: "Identity",
    tier: "free",
    description: "Project tags (amenities, keywords)",
    dataType: "json",
    source: "sanity",
    nullable: true,
  },

  // --- Geography ---
  {
    id: "area",
    label: "Area",
    group: "Geography",
    tier: "free",
    description: "Sub-market / community name",
    dataType: "string",
    source: "sanity",
    nullable: true,
  },
  {
    id: "city_clean",
    label: "City",
    group: "Geography",
    tier: "free",
    description: "Canonicalized city name",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
  {
    id: "country",
    label: "Country",
    group: "Geography",
    tier: "free",
    description: "Country of project",
    dataType: "string",
    source: "sanity",
    nullable: true,
  },
  {
    id: "lat",
    label: "Latitude",
    group: "Geography",
    tier: "pro",
    description: "GPS latitude (geolocated)",
    dataType: "number",
    source: "bayut",
    nullable: true,
  },
  {
    id: "lng",
    label: "Longitude",
    group: "Geography",
    tier: "pro",
    description: "GPS longitude",
    dataType: "number",
    source: "bayut",
    nullable: true,
  },
  {
    id: "dld_community",
    label: "DLD Community",
    group: "Geography",
    tier: "pro",
    description: "DLD canonical community name",
    dataType: "string",
    source: "dld",
    nullable: true,
  },

  // --- Price ---
  {
    id: "price_from_aed",
    label: "Price From (AED)",
    group: "Price",
    tier: "free",
    description: "Starting price in AED — DOUBLE PRECISION",
    dataType: "number",
    source: "sanity",
    nullable: true,
  },
  {
    id: "price_to_aed",
    label: "Price To (AED)",
    group: "Price",
    tier: "free",
    description: "Maximum price in AED — DOUBLE PRECISION",
    dataType: "number",
    source: "sanity",
    nullable: true,
  },
  {
    id: "price_per_sqft",
    label: "Price / sqft",
    group: "Price",
    tier: "pro",
    description: "Price per square foot",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "price_vs_cohort_pct",
    label: "vs. Area Median %",
    group: "Price",
    tier: "pro",
    description: "% premium/discount vs area median",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "price_momentum",
    label: "Price Momentum",
    group: "Price",
    tier: "pro",
    description: "Directional momentum: Rising/Stable/Softening",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
  {
    id: "dld_avg_price_sqft",
    label: "DLD Avg Price/sqft",
    group: "Price",
    tier: "business",
    description: "DLD transaction average price per sqft",
    dataType: "number",
    source: "dld",
    nullable: true,
  },
  {
    id: "price_gap_list_dld",
    label: "List vs DLD Gap %",
    group: "Price",
    tier: "business",
    description: "% gap between listing price and DLD traded price",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "price_confidence",
    label: "Price Confidence",
    group: "Quality",
    tier: "free",
    description: "Confidence band for price source",
    dataType: "string",
    source: "derived",
    nullable: true,
  },

  // --- Temporal ---
  {
    id: "launch_year",
    label: "Launch Year",
    group: "Temporal",
    tier: "free",
    description: "Year project was launched",
    dataType: "number",
    source: "sanity",
    nullable: true,
  },
  {
    id: "completion_year",
    label: "Completion Year",
    group: "Temporal",
    tier: "free",
    description: "Planned completion year",
    dataType: "number",
    source: "sanity",
    nullable: true,
  },
  {
    id: "handover_status",
    label: "Handover",
    group: "Temporal",
    tier: "free",
    description: "Handover bucket (Ready/2025/2026/etc.)",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
  {
    id: "unitsStockUpdatedAt",
    label: "Stock Updated",
    group: "Temporal",
    tier: "free",
    description: "When unit stock was last updated",
    dataType: "date",
    source: "sanity",
    nullable: true,
  },
  {
    id: "launch_to_tx_lag_days",
    label: "Launch→TX Lag (days)",
    group: "Temporal",
    tier: "business",
    description: "Days from project launch to first DLD transaction",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "timing_label",
    label: "Timing Label",
    group: "Temporal",
    tier: "pro",
    description: "Timing signal based on market velocity",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
  {
    id: "timing_score",
    label: "Timing Score",
    group: "Temporal",
    tier: "pro",
    description: "Timing score (0-100)",
    dataType: "number",
    source: "derived",
    nullable: true,
  },

  // --- Market Scoring ---
  {
    id: "investor_score_v1",
    label: "Investor Score V1",
    group: "Scoring",
    tier: "pro",
    description: "Investor score from Decision Engine V1",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "investor_profile",
    label: "Investor Profile",
    group: "Scoring",
    tier: "pro",
    description: "Best-fit investor archetype",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
  {
    id: "area_avg_score",
    label: "Area Score",
    group: "Scoring",
    tier: "pro",
    description: "Average investment score for the area",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "area_median_price",
    label: "Area Median Price",
    group: "Scoring",
    tier: "free",
    description: "Median project price in the area",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "area_project_count",
    label: "Area Supply Count",
    group: "Scoring",
    tier: "free",
    description: "Number of projects in the area",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "decision_label_v1",
    label: "Decision Label V1",
    group: "Scoring",
    tier: "pro",
    description: "Decision label from Decision Engine V1",
    dataType: "string",
    source: "derived",
    nullable: true,
  },

  // --- Risk & Liquidity ---
  {
    id: "derived_risk_class",
    label: "Risk Class",
    group: "Risk",
    tier: "free",
    description: "Conservative / Moderate / Aggressive / Speculative",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
  {
    id: "derived_liquidity_timeline",
    label: "Liquidity Timeline",
    group: "Risk",
    tier: "free",
    description: "Immediate / Near-term / Short / Mid / Long",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
  {
    id: "derived_buyer_persona",
    label: "Buyer Persona",
    group: "Risk",
    tier: "pro",
    description: "End-user / Investor / Ultra-HNW / etc.",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
  {
    id: "derived_capital_efficiency",
    label: "Capital Efficiency",
    group: "Risk",
    tier: "pro",
    description: "Score of return potential per AED deployed",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "price_tier",
    label: "Price Tier",
    group: "Risk",
    tier: "free",
    description: "Entry / Mid / Premium / Ultra-Premium",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
  {
    id: "stress_score",
    label: "Stress Score",
    group: "Risk",
    tier: "pro",
    description: "Stress test score (0-100)",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "stress_grade_v1",
    label: "Stress Grade V1",
    group: "Risk",
    tier: "pro",
    description: "Stress grade from Decision Engine V1",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
  {
    id: "developer_reliability_score",
    label: "Developer Reliability Score",
    group: "Developer",
    tier: "pro",
    description: "Reliability metric for developer delivery",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "supply_resilience_score",
    label: "Supply Resilience Score",
    group: "Risk",
    tier: "pro",
    description: "Supply-side resilience score",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "liquidity_resilience_score",
    label: "Liquidity Resilience Score",
    group: "Risk",
    tier: "pro",
    description: "Liquidity resilience score",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "pricing_discipline_score",
    label: "Pricing Discipline Score",
    group: "Risk",
    tier: "pro",
    description: "Pricing discipline score",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "handover_reliability_score",
    label: "Handover Reliability Score",
    group: "Risk",
    tier: "pro",
    description: "Handover reliability score",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "area_stability_score",
    label: "Area Stability Score",
    group: "Risk",
    tier: "pro",
    description: "Area stability score",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "payment_plan_score",
    label: "Payment Plan Score",
    group: "Risk",
    tier: "pro",
    description: "Payment plan quality score",
    dataType: "number",
    source: "derived",
    nullable: true,
  },

  // --- Yield & Rental ---
  {
    id: "yield_gross_pct",
    label: "Gross Yield %",
    group: "Yield",
    tier: "pro",
    description: "Annual rent / price × 100",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "yield_net_pct",
    label: "Net Yield %",
    group: "Yield",
    tier: "business",
    description: "Net yield after service charges",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "dld_avg_annual_rent",
    label: "DLD Avg Rent/yr",
    group: "Yield",
    tier: "pro",
    description: "DLD rental record average annual rent",
    dataType: "number",
    source: "dld",
    nullable: true,
  },
  {
    id: "bayut_avg_rent",
    label: "Bayut Avg Rent",
    group: "Yield",
    tier: "pro",
    description: "Bayut listing average asking rent",
    dataType: "number",
    source: "bayut",
    nullable: true,
  },
  {
    id: "absorption_rate",
    label: "Absorption Rate",
    group: "Yield",
    tier: "business",
    description: "Transactions ÷ active listings for the area",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "occupancy_rate",
    label: "Occupancy Rate",
    group: "Yield",
    tier: "enterprise",
    description: "Estimated occupancy % (premium signal)",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "rental_yield",
    label: "Rental Yield",
    group: "Yield",
    tier: "pro",
    description: "Rental yield (Decision Engine V1)",
    dataType: "number",
    source: "derived",
    nullable: true,
  },

  // --- Developer Intelligence ---
  {
    id: "developer_tier",
    label: "Developer Tier",
    group: "Developer",
    tier: "free",
    description: "Boutique / Emerging / Established / Major",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
  {
    id: "dev_project_count",
    label: "Developer Projects",
    group: "Developer",
    tier: "free",
    description: "Total projects by this developer",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "dev_avg_score",
    label: "Developer Score",
    group: "Developer",
    tier: "pro",
    description: "Average investment score across developer's portfolio",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "developer_honesty_index",
    label: "Honesty Index",
    group: "Developer",
    tier: "pro",
    description: "Reliability metric: DLD transactions vs listings ratio",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "dev_avg_premium",
    label: "Dev Price Premium %",
    group: "Developer",
    tier: "business",
    description: "Developer's average premium vs area cohort",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "ghost_portfolio_flag",
    label: "Ghost Portfolio",
    group: "Developer",
    tier: "enterprise",
    description: "Developer listed projects with zero DLD transactions",
    dataType: "boolean",
    source: "derived",
    nullable: true,
  },

  // --- Confidence & Provenance ---
  {
    id: "confidence",
    label: "Confidence",
    group: "Quality",
    tier: "free",
    description: "HIGH / MEDIUM / LOW based on source coverage",
    dataType: "string",
    source: "derived",
    nullable: false,
  },
  {
    id: "source_count",
    label: "Source Count",
    group: "Quality",
    tier: "free",
    description: "Number of independent sources confirming this row",
    dataType: "number",
    source: "derived",
    nullable: false,
  },
  {
    id: "last_verified_at",
    label: "Last Verified",
    group: "Quality",
    tier: "free",
    description: "Timestamp of most recent source verification",
    dataType: "date",
    source: "derived",
    nullable: true,
  },
  {
    id: "data_sources_list",
    label: "Sources Used",
    group: "Quality",
    tier: "pro",
    description: "List of sources contributing to this row",
    dataType: "json",
    source: "derived",
    nullable: true,
  },
  {
    id: "evidence_label_v1",
    label: "Evidence Label V1",
    group: "Quality",
    tier: "pro",
    description: "Evidence label from Decision Engine V1",
    dataType: "string",
    source: "derived",
    nullable: true,
  },

  // --- Payment & Contract ---
  {
    id: "payment_plan",
    label: "Payment Plan",
    group: "Contract",
    tier: "free",
    description: "Developer payment plan structure",
    dataType: "string",
    source: "pf",
    nullable: true,
  },
  {
    id: "dld_registration_fee",
    label: "DLD Fee (4%)",
    group: "Contract",
    tier: "free",
    description: "Estimated DLD registration fee at 4% of price",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "service_charge_pct",
    label: "Service Charge %",
    group: "Contract",
    tier: "pro",
    description: "Annual service charge as % of property price",
    dataType: "number",
    source: "derived",
    nullable: true,
  },
  {
    id: "spa_template_id",
    label: "SPA Template",
    group: "Contract",
    tier: "enterprise",
    description: "Pre-approved SPA template reference ID",
    dataType: "string",
    source: "derived",
    nullable: true,
  },
]

export const TIER_LABELS: Record<ColumnTier, string> = {
  free: "Free",
  pro: "Pro",
  team: "Team",
  institutional: "Institutional",
  business: "Business",
  enterprise: "Enterprise",
}

export const LAYER_LABELS: Record<EvidenceLayer, string> = {
  L1: "L1 · Canonical truth",
  L2: "L2 · Cross-validated signals",
  L3: "L3 · Temporal behavior",
  L4: "L4 · External benchmarks",
  L5: "L5 · Raw inputs",
}

export function getNormalizedTier(tier: ColumnTier): NormalizedTier {
  return TIER_ALIASES[tier] ?? "institutional"
}

const resolveLayer = (entry: ColumnSeed): EvidenceLayer => {
  const override = GROUP_LAYER_OVERRIDE[entry.group]
  if (override) return override
  return SOURCE_LAYER_MAP[entry.source] ?? "L2"
}

export const COLUMN_REGISTRY: ColumnDefinition[] = COLUMN_SEEDS.map((entry) => ({
  ...entry,
  layer: resolveLayer(entry),
}))

export function normalizeTier(value: ColumnTier): NormalizedTier {
  return TIER_ALIASES[value] ?? "free"
}

/**
 * Returns true if the specified column is accessible by the given tier.
 */
export function isColumnAccessible(columnId: string, currentTier: ColumnTier): boolean {
  const column = COLUMN_REGISTRY.find((c) => c.id === columnId)
  if (!column) return false
  return TIER_ORDER[normalizeTier(currentTier)] >= TIER_ORDER[normalizeTier(column.tier)]
}

/**
 * Returns all columns accessible by the given tier.
 */
export function getAccessibleColumns(currentTier: ColumnTier): ColumnDefinition[] {
  return COLUMN_REGISTRY.filter((column) => isColumnAccessible(column.id, currentTier))
}

/**
 * Returns all columns gated specifically at the provided tier.
 */
export function getColumnsByTier(targetTier: ColumnTier): ColumnDefinition[] {
  const normalizedTarget = normalizeTier(targetTier)
  return COLUMN_REGISTRY.filter((column) => normalizeTier(column.tier) === normalizedTarget)
}

/**
 * Maps a column ID to its label.
 */
export function getColumnLabel(columnId: string): string {
  return COLUMN_REGISTRY.find((c) => c.id === columnId)?.label ?? columnId
}
