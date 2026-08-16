export type RelationType = "VIEW" | "BASE TABLE"

export type RelationContract = {
  name: string
  type: RelationType | RelationType[]
  requiredColumns: string[]
}

export const REQUIRED_RELATIONS: RelationContract[] = [
  {
    name: "inventory_spine",
    type: "VIEW",
    requiredColumns: ["name", "developer", "area", "price_from_aed"],
  },
  {
    name: "automation_inventory_view_v1",
    type: ["VIEW", "BASE TABLE"],
    requiredColumns: [
      "asset_id",
      "name",
      "developer",
      "city",
      "area",
      "status_band",
      "price_aed",
      "beds",
      "score_0_100",
      "safety_band",
      "classification",
      "roi_band",
      "liquidity_band",
      "timeline_risk_band",
      "reason_codes",
      "risk_flags",
      "drivers",
    ],
  },
  {
    name: "market_scores_v1",
    type: "BASE TABLE",
    requiredColumns: [
      "asset_id",
      "score",
      "score_0_100",
      "classification",
      "safety_band",
      "roi_band",
      "timeline_risk_band",
      "liquidity_band",
      "reason_codes",
      "risk_flags",
      "drivers",
    ],
  },
  {
    name: "area_roi_summary",
    type: "VIEW",
    requiredColumns: ["area", "projects", "avg_price", "avg_yield", "efficiency"],
  },
  {
    name: "developer_performance",
    type: "VIEW",
    requiredColumns: ["developer", "projects", "reliability", "efficiency", "avg_price"],
  },
  {
    name: "investor_override_audit",
    type: "BASE TABLE",
    requiredColumns: [
      "session_id",
      "investor_profile",
      "original_horizon",
      "overridden_to",
      "reason",
      "created_at",
    ],
  },
  {
    name: "investor_profiles_v1",
    type: "BASE TABLE",
    requiredColumns: ["risk_profile", "allowed_bands"],
  },
  {
    name: "system_healthcheck",
    type: "BASE TABLE",
    requiredColumns: ["checked_at", "passed"],
  },
  {
    name: "entrestate_master",
    type: "BASE TABLE",
    requiredColumns: ["project_id", "name", "price_from_aed"],
  },
  {
    name: "media_enrichment",
    type: "BASE TABLE",
    requiredColumns: ["project_id", "name", "hero_image_url", "verified_image"],
  },
]

export const REQUIRED_FUNCTIONS = [
  "rank_investors",
  "refresh_market_scores",
  "get_area_absorption",
  "automation_inventory_for_investor_v1",
  "automation_ranked_for_investor_v1",
  "compute_match_score",
  "generate_override_disclosure",
] as const
