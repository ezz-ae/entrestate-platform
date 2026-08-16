# Neon Data Snapshot

Generated: 2026-02-13T14:40:57.726Z

## Row Counts
- **entrestate_master**: 7015
- **media_enrichment**: 7015
- **market_scores_v1**: 7015
- **agent_inventory_view_v1**: 7015
- **investor_profiles_v1**: 3
- **investor_override_audit**: 0
- **system_healthcheck**: 24


## Inventory Health (agent_inventory_view_v1)
{
  "total": 7015,
  "missing_name": 0,
  "missing_city": 0,
  "missing_area": 0,
  "missing_price": 4178,
  "missing_score": 0,
  "missing_safety": 0
}

## Safety Band Distribution (market_scores_v1)
[
  {
    "safety_band": "Opportunistic",
    "count": 4599
  },
  {
    "safety_band": "Speculative",
    "count": 1989
  },
  {
    "safety_band": "Capital Safe",
    "count": 422
  },
  {
    "safety_band": "Institutional Safe",
    "count": 5
  }
]

## Classification Distribution (market_scores_v1)
[
  {
    "classification": "Balanced",
    "count": 5021
  },
  {
    "classification": "Speculative",
    "count": 1989
  },
  {
    "classification": "Conservative",
    "count": 5
  }
]

## Media Coverage (media_enrichment)
{
  "total": 7015,
  "with_hero": 602
}

## Truth Checks
Conservative × Ready: 23

Balanced × 1-2yr: 913

Speculative leak (Conservative 2-4yr): 0

## Latest Healthcheck
{
  "last_check": "2026-02-12T19:30:44.240019",
  "total_count": 24,
  "passing_count": 24
}

## Column Maps
### entrestate_master
- project_id (bigint)
- building_id (bigint)
- name (text)
- url_slug (text)
- city (text)
- public_url (text)
- stock_updated_at (text)
- is_on_sale (boolean)
- tags (text)
- developer (text)
- area (text)
- price_from_aed (double precision)
- bedrooms_min (double precision)
- bedrooms_max (double precision)
- launch_year (double precision)
- completion_year (double precision)
- description (text)
- price_per_bed_min (double precision)
- project_duration (double precision)
- years_to_handover (double precision)
- city_clean (text)
- price_tier (text)
- handover_status (text)
- developer_clean (text)
- investor_profile (text)
- cohort_median (double precision)
- cohort_mean (double precision)
- cohort_std (double precision)
- cohort_count (double precision)
- price_vs_cohort_pct (double precision)
- price_momentum (text)
- investment_score (double precision)
- area_median_price (double precision)
- area_project_count (double precision)
- area_price_std (double precision)
- area_avg_score (double precision)
- has_payment_plan (boolean)
- static_developer_id (text)
- static_city (text)
- static_area (text)
- static_unit_types (text)
- static_launch_year (double precision)
- static_original_price (double precision)
- dynamic_years_to_handover (double precision)
- dynamic_delivery_confidence (text)
- dynamic_price_pressure (text)
- dynamic_absorption (text)
- dynamic_last_activity (text)
- derived_buyer_persona (text)
- derived_risk_class (text)
- derived_holding_logic (text)
- derived_capital_efficiency (bigint)
- derived_liquidity_timeline (text)
- kernel_identity (text)
- kernel_problem_solved (text)
- flag_high_risk_high_return (boolean)
- flag_safe_yield (boolean)
- flag_flip_opportunity (boolean)
- flag_market_discount (boolean)
- flag_ready_now (boolean)
- lifecycle_state (text)
- developer_tier_simple (text)
- final_city (text)
- final_area (text)
- final_developer (text)
- final_price_from (double precision)
- final_price_to (double precision)
- final_price_per_sqft (double precision)
- final_price_per_sqm (double precision)
- final_launch_year (double precision)
- final_handover_year (bigint)
- final_status (text)
- data_confidence (text)
- scraped_source (text)
- scrape_date (text)
- secondary_resale_rate (double precision)
- secondary_demand (text)
- secondary_units_available (bigint)
- secondary_appreciation_rate (double precision)
- secondary_avg_hold_days (bigint)
- secondary_flip_ratio (double precision)
- secondary_liquidity_score (double precision)
- rental_demand_score (double precision)
- rental_supply_score (double precision)
- rental_demand_supply_ratio (double precision)
- rental_market_balance (text)
- gross_rental_yield (double precision)
- net_rental_yield (double precision)
- rental_cap_rate (double precision)
- estimated_rental_psf (double precision)
- occupancy_rate (double precision)
- purchase_price (double precision)
- paid_so_far (double precision)
- payment_pct_complete (double precision)
- current_value (double precision)
- capital_gain (double precision)
- capital_gain_pct (double precision)
- rental_years (bigint)
- total_rental_income (double precision)
- rental_return_pct (double precision)
- current_year_rental (bigint)
- current_year_appreciation (double precision)
- current_year_total_income (double precision)
- total_cash_return (double precision)
- roic_pct (double precision)
- years_to_breakeven (double precision)
- estimated_rental_psf_final (double precision)
- estimated_annual_rent (double precision)
- estimated_monthly_rent (double precision)
- rental_price_sources (text)
- rental_confidence (text)
- rental_demand_adjustment (double precision)
- rental_supply_adjustment (double precision)
- rental_tier_multiplier (double precision)
- rental_combined_factor (double precision)
- developer_canonical (text)
- developer_website (text)
- developer_registry_key (text)
- official_name (text)
- official_source_url (text)
- hero_image_url (text)
- gallery_urls (text)
- brochure_url (text)
- floorplan_urls (text)
- crawl_matched (text)
- verified_name (text)
- verified_price (double precision)
- verified_location (text)
- verified_image (text)
- payment_plan_structure (text)
- amenities_list (text)
- construction_phase (text)
- delivery_date (text)
- bedroom_types (text)
- demand_hotness (double precision)
- source_url (text)
- externally_verified (text)
- sanity_lat (text)
- sanity_lng (text)
- dld_traded_psf (text)
- dld_traded_price (text)
- dld_tx_count (text)
- dld_latest_tx (text)
- dld_price_delta_pct (text)
- dld_area_psf (text)
- cross_source_score (bigint)
- bayut_median_price (text)
- bayut_median_rent (text)
- bayut_implied_yield (text)
- project_archetype (text)
- price_reality_index (double precision)
- market_timing (text)
- developer_reliability (double precision)
- area_competitiveness (double precision)
- buyer_opportunity (double precision)
- risk_composite (double precision)

### media_enrichment
- project_id (bigint)
- name (text)
- hero_image_url (text)
- verified_name (text)
- verified_location (text)
- verified_image (text)
- payment_plan_structure (text)
- amenities_list (text)
- construction_phase (text)
- delivery_date (text)
- bedroom_types (text)
- demand_hotness (double precision)
- externally_verified (text)

### market_scores_v1
- asset_id (text)
- city (text)
- area (text)
- status_band (text)
- price_tier (text)
- score_0_100 (bigint)
- classification (text)
- safety_band (text)
- roi_band (text)
- timeline_risk_band (text)
- liquidity_band (text)
- reason_codes (text)
- risk_flags (text)
- warnings (text)
- drivers (text)
- id (integer)

### agent_inventory_view_v1
- asset_id (text)
- name (text)
- developer (text)
- city (text)
- area (text)
- status (text)
- completion_year (double precision)
- price_aed (double precision)
- beds (text)
- score_0_100 (bigint)
- classification (text)
- safety_band (text)
- roi_band (text)
- timeline_risk_band (text)
- liquidity_band (text)
- status_band (text)
- price_tier (text)
- reason_codes (text)
- risk_flags (text)
- drivers (text)
- warnings (text)
- updated_at (text)
- id (integer)

### investor_profiles_v1
- risk_profile (text)
- allowed_bands (ARRAY)
- description (text)

### investor_override_audit
- id (integer)
- session_id (text)
- investor_profile (text)
- original_horizon (text)
- overridden_to (text)
- reason (text)
- created_at (timestamp with time zone)

### system_healthcheck
- check_name (text)
- actual (bigint)
- expected (bigint)
- operator (text)
- passed (boolean)
- checked_at (text)
- architecture (text)
- id (integer)
