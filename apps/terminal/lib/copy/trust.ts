import { getColumnLabel, type ColumnTier } from "@/lib/registry/columns"

export type TrustConfidence = "HIGH" | "MEDIUM" | "LOW"
export type TrustTier = ColumnTier
export type NotebookProvenanceLike = {
  run_id?: string | null
  snapshot_ts?: string | null
}

export type BadgeConfig = {
  label: string
  color: string
  icon: string
  tooltip: string
  copy_rule: string
}

export type ScoreKey = "market_score" | "match_score" | "developer_honesty_index"
export type ScoreExplanation = {
  label: string
  range: string
  what_it_is: string
  what_it_isn_t: string
  cta: string
  high?: string
  mid?: string
  low?: string
}

export type UpgradeCopy = {
  headline: string
  body: string
  cta: string
  min_tier_needed: TrustTier
}

function formatTierLabel(tier: TrustTier) {
  if (tier === "institutional") return "Institutional"
  if (tier === "enterprise") return "Enterprise"
  if (tier === "business") return "Business"
  if (tier === "team") return "Team"
  if (tier === "pro") return "Pro"
  return "Free"
}

function getMinimumUnlockTier(userTier: TrustTier): TrustTier {
  if (userTier === "free") return "pro"
  if (userTier === "pro") return "team"
  if (userTier === "team" || userTier === "business") return "institutional"
  if (userTier === "institutional") return "enterprise"
  return "enterprise"
}

export const TRUST_COPY = {
  trust_bar: {
    template: "{total_projects:,} projects verified · {source_count} sources · refreshed {freshness}",
    sample: "7,015 projects verified · 6 sources · refreshed today",
    placement: "Top of landing page, sticky header in chat/search",
    tone: "factual, no superlatives, no punctuation flourish",
  },
  confidence_badges: {
    HIGH: {
      label: "Verified",
      color: "#16a34a",
      icon: "✓",
      tooltip: "Cross-verified against DLD records and 2+ independent sources.",
      copy_rule: "Never say '100% accurate'. Always say 'Verified against [sources]'.",
    },
    MEDIUM: {
      label: "Confirmed",
      color: "#ca8a04",
      icon: "~",
      tooltip: "Confirmed by 1 primary source. Awaiting second source verification.",
      copy_rule: "Show single source name. Invite user to flag if incorrect.",
    },
    LOW: {
      label: "Unverified",
      color: "#dc2626",
      icon: "?",
      tooltip: "Single-source extraction only. Treat as directional, not definitive.",
      copy_rule: "Always visible. Never suppress low-confidence data — show it with its label.",
    },
  } satisfies Record<TrustConfidence, BadgeConfig>,
  evidence_drawer: {
    header: "How we know this",
    sources_label: "Sources used",
    exclusions_label: "What was excluded",
    assumptions_label: "Assumptions",
    steps_label: "Calculation steps",
    audit_cta: "Download audit trail (CSV)",
    no_exclusions_copy: "No exclusions applied. Unified database policy v{policy_version}.",
    provenance_footer: "Data snapshot: {snapshot_ts} · Run ID: {run_id}",
    tone_rules: [
      "Write in plain English — no ML jargon",
      "Name sources specifically: 'DLD Sales API' not 'government data'",
      "Every formula must be human-readable: 'rent ÷ price × 100'",
      "Never say 'our algorithm' — say 'our calculation' or show the formula",
      "If data is absent, say 'Not available' — never '0' or 'N/A'",
    ],
  },
  score_copy: {
    market_score: {
      label: "Market Score",
      range: "0–100",
      what_it_is:
        "A composite signal combining price momentum, area demand, developer reliability, and supply pressure.",
      what_it_isn_t:
        "Not a prediction. Not a guarantee. A structured starting point for your own analysis.",
      high: "Score 75+: Strong positive signal across multiple indicators",
      mid: "Score 50–74: Mixed signals — investigate individual factors",
      low: "Score <50: One or more risk flags present — see Evidence Drawer",
      cta: "Verify this score →",
    },
    match_score: {
      label: "Match Score",
      range: "0–100",
      what_it_is:
        "How well this project fits your stated profile: budget, horizon, risk appetite, and yield preference.",
      what_it_isn_t:
        "Not a recommendation to buy. Your profile may not capture all your real criteria.",
      cta: "See how this was calculated →",
    },
    developer_honesty_index: {
      label: "Developer Honesty Index",
      range: "0–100",
      what_it_is:
        "Ratio of DLD-recorded transactions to total listed projects for this developer. High = they deliver what they list.",
      what_it_isn_t: "Not a legal or financial rating.",
      cta: "See DLD transaction history →",
    },
  } satisfies Record<ScoreKey, ScoreExplanation>,
  citation_copy: {
    tooltip_template: "This figure comes from {source} · {row_count} rows · {formula}",
    click_to_verify: "Click to highlight the rows that support this claim",
    formula_prefix: "Calculated as:",
    rows_label: "{n} projects included",
    excluded_label: "{n} projects excluded ({exclusion_reason})",
  },
  upgrade_copy: {
    column_gated: {
      headline: "This signal requires {tier}",
      body: "{column_display} helps you {benefit}. Upgrade to unlock it, plus {other_cols} more.",
      cta: "View {tier} plan →",
      benefit_map: {
        yield_gross_pct: "compare income potential across areas",
        developer_honesty_index: "filter out developers with poor delivery track records",
        absorption_rate: "gauge how quickly inventory is being absorbed",
        dld_avg_price_sqft: "benchmark against actual transacted prices",
        ghost_portfolio_flag: "identify developers with no DLD record of delivery",
        occupancy_rate: "estimate live income potential for rental investment",
      },
    },
    time_depth_gated: {
      headline: "Unlock {depth} of market history",
      body: "Your {current_tier} plan includes {current_depth} of data. Upgrade to see how this area has moved.",
      cta: "See full history →",
    },
    no_anxiety_rule: "Never say 'you don't have access'. Say 'unlock' or 'upgrade to see'.",
  },
  empty_states: {
    no_results: "No projects match these filters. Try widening your area or adjusting your budget.",
    low_confidence: "Only low-confidence data exists for this filter. Widen your scope for verified results.",
    source_gap: "We don't have data for this area yet. It may be new to the market or outside our sources.",
    llm_fallback: "We couldn't build a data table for this query. Try one of these starting points:",
  },
  verify_hook: {
    headline: "Verify the math",
    body: "Every number on this page traces to a source, a formula, and a set of rows. Click any figure to audit it.",
    placement: "Shown once per session, after first Evidence Drawer open",
    tone: "Matter-of-fact. Not a feature announcement. A statement of how the product works.",
  },
} as const

export function getConfidenceBadge(confidence: TrustConfidence): BadgeConfig {
  return TRUST_COPY.confidence_badges[confidence]
}

export function formatProvenance(provenance: NotebookProvenanceLike): string {
  const snapshotTs = provenance.snapshot_ts ?? "Not available"
  const runId = provenance.run_id ?? "Not available"
  return TRUST_COPY.evidence_drawer.provenance_footer
    .replace("{snapshot_ts}", snapshotTs)
    .replace("{run_id}", runId)
}

export function getScoreExplanation(scoreKey: ScoreKey): ScoreExplanation {
  return TRUST_COPY.score_copy[scoreKey]
}

export function getUpgradeCopy(column: string, userTier: TrustTier): UpgradeCopy {
  const template = TRUST_COPY.upgrade_copy.column_gated
  const minTierNeeded = getMinimumUnlockTier(userTier)
  const benefit =
    template.benefit_map[column as keyof typeof template.benefit_map] ??
    "inspect a higher-signal market layer"
  const tierLabel = formatTierLabel(minTierNeeded)
  const columnDisplay = getColumnLabel(column)

  return {
    headline: template.headline.replace("{tier}", tierLabel),
    body: template.body
      .replace("{column_display}", columnDisplay)
      .replace("{benefit}", benefit)
      .replace("{other_cols}", "related gated"),
    cta: template.cta.replace("{tier}", tierLabel),
    min_tier_needed: minTierNeeded,
  }
}
