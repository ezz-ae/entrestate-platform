// Layer 1: Static Truths (The Immutable Base)
export interface StaticTruths {
  static_developer_id: string | null
  static_city: string
  static_area: string
  static_unit_types: string // e.g., "1-3BR"
  static_launch_year: number | null
  static_original_price: number | null
}

// Layer 2: Dynamic Truths (The Evolving State)
export type DeliveryConfidence = "Delivered" | "High (1yr)" | "Medium (2-3yr)" | "Low (4yr+)" | "Speculative (6yr+)"

export interface DynamicTruths {
  dynamic_years_to_handover: number | null
  dynamic_delivery_confidence: DeliveryConfidence
  dynamic_price_pressure: "Upward" | "Stable" | "Downward" | "Unknown"
  dynamic_absorption: "Active" | "Passive"
  dynamic_last_activity: string | Date | null
}

// Layer 3: Derived Truths (The Analytical Layer)
export interface DerivedTruths {
  derived_buyer_persona: "Yield Seeker" | "Flipper" | "End User" | "Portfolio Builder" | "UHNW"
  derived_risk_class: "Conservative" | "Moderate" | "Aggressive" | "Speculative"
  derived_holding_logic: "Yield" | "Flip" | "Occupy" | "Hybrid"
  derived_capital_efficiency: number // 0-100 Score: (Price/Bed + Time Value + Market Pricing)
  derived_liquidity_timeline:
    | "Immediate (Ready)"
    | "Near-term (6-12mo)"
    | "Short (1-2yr)"
    | "Medium (2-4yr)"
    | "Long (4yr+)"
}

// Layer 4 & 5: Kernel and Decision Engine
export interface InventoryNode extends StaticTruths, DynamicTruths, DerivedTruths {
  id: string // url_path_segment
  kernel_identity: string // Generated narrative: "Emaar | Downtown | Yield Seeker..."
  kernel_problem_solved: "Cash Flow Generation" | "Capital Appreciation" | "Wealth Preservation" | "Lifestyle"

  decision_flags: {
    flag_high_risk_high_return: boolean
    flag_safe_yield: boolean // v2 Logic: <2M AED + <1yr handover + Known Dev
    flag_flip_opportunity: boolean
    flag_market_discount: boolean
    flag_ready_now: boolean
  }
}
