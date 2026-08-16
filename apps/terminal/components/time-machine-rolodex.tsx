"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useLocale } from "next-intl"
import { Archive, Menu, ChevronRight } from "lucide-react"
import { ReportReader } from "./report-reader"
import type { ReportCard } from "./report-reader"
import { prefixLocalePath, type AppLocale } from "@/i18n/locale"

const cards: ReportCard[] = [
  {
    id: 1,
    title: "JVC: Dubai's Unrivaled Yield Capital",
    subtitle:
      "Jumeirah Village Circle remains one of Dubai's strongest income-producing districts, anchored by stable occupancy and high gross yield potential.",
    date: "March 8, 2026",
    dateLabel: "Mar 8",
    image: "/futuristic-city-neon-lights-night.jpg",
    author: "Entrestate Research",
    readTime: "7 min read",
    category: "Special Report",
    content: `Jumeirah Village Circle (JVC) continues to rank among Dubai's strongest income-focused residential markets. With gross yields around 8% and sustained occupancy, JVC remains a core destination for investors targeting resilient mid-market rental income. [1]

## Executive Summary

JVC combines three structural strengths: relative entry affordability, high tenant demand depth, and strong rental absorption. Together, these conditions support gross yields that frequently outperform city-wide residential averages. [2]

| Metric | Current View |
|---|---|
| Average Gross Yield | 8.1% |
| Average Occupancy | 88% |
| Price Efficiency Benchmark | AED 1,100 per sq ft |
| Core Demand Driver | Mid-market affordability and lifestyle accessibility |

## High-Yield Project Set in JVC

| Project | Developer | Primary Investment Case |
|---|---|---|
| Samana Lake Views 2 / Ivy Gardens 2 | Samana Developers | Yield-oriented profile with strong rental viability for units below AED 2M |
| Oakley Square Residences | Ellington Properties | Premium quality product with durable tenant demand |
| Pearl House II / III / IV | Imtiaz Developments | Flexible payment structures and strong occupancy corridor positioning |
| Binghatti Circle / Binghatti Elite | Binghatti | High absorption profile and investor-first return orientation |
| Luxor by Imtiaz | Imtiaz Developments | Compact layouts optimized for rental efficiency |
| Hillmont Residences | Ellington Properties | Demand-backed appreciation and yield outlook |

## Developer Positioning in JVC

| Developer | Observed Gross Yield | Market Positioning |
|---|---|---|
| Ellington Properties | 6.3% | Premium quality strategy with stronger tenant profile stability |
| Binghatti | 9.2% | High-absorption, return-focused product model |
| Imtiaz Developments | High-yield profile | Flexible payment plans and capital-efficiency-led positioning |
| Azizi Developments | 5.6% | Scale player influencing broader JVC mid-market pricing |

## Data-Led Allocation Strategy

### 1. Focus on micro-market imbalance
JVC is broad and heterogeneous. Specific pockets of relative undersupply continue to support better rent capture and stronger yield durability. [3]

### 2. Maintain entry discipline
The most attractive opportunities tend to cluster near the AED 1,100 per sq ft benchmark when combined with strong demand and high absorption signals. [4]

### 3. Prioritize capital efficiency
Headline yield should be validated against entry price, projected rent, handover timing, and payment plan structure to maximize net cash flow quality. [5]

### 4. Use occupancy as a risk filter
At approximately 88% occupancy, JVC demonstrates stronger rental continuity than many peer submarkets, especially for practical unit formats aligned with young professionals and families. [6]

## Conclusion

JVC remains one of Dubai's most compelling yield-led residential markets. For income-oriented portfolios, disciplined selection within the district's strongest micro-locations can still deliver attractive risk-adjusted return potential.`,
    evidence: [
      {
        id: "jvc-1",
        refNum: 1,
        type: "data",
        label: "JVC Gross Yield Baseline",
        value: "8.1% average gross yield",
        source: "Entrestate market intelligence aggregation",
        note: "Current district-level baseline used in this report.",
      },
      {
        id: "jvc-2",
        refNum: 2,
        type: "data",
        label: "JVC Occupancy Baseline",
        value: "88% average occupancy",
        source: "Entrestate occupancy model",
        note: "Reflects sustained tenant demand in mid-market stock.",
      },
      {
        id: "jvc-3",
        refNum: 3,
        type: "calculation",
        label: "Undersupplied Micro-Pocket Signal",
        formula: "active listings / qualified rental demand by district",
        note: "Lower listing-to-demand ratios indicate stronger rent pricing power.",
      },
      {
        id: "jvc-4",
        refNum: 4,
        type: "data",
        label: "Price Efficiency Benchmark",
        value: "AED 1,100 per sq ft",
        source: "Entrestate transaction and listing benchmark index",
        note: "Used as a comparative threshold for yield-led entry selection.",
      },
      {
        id: "jvc-5",
        refNum: 5,
        type: "calculation",
        label: "Capital Efficiency Score",
        formula: "(projected annual rent - holding cost) / total deployed capital",
        note: "Evaluates cash-flow efficiency beyond headline gross yield.",
      },
      {
        id: "jvc-6",
        refNum: 6,
        type: "source",
        label: "Demand Profile Validation",
        source: "Entrestate rental demand segmentation",
        note: "Confirms depth of young-professional and family demand cohorts in JVC.",
      },
    ],
  },
  {
    id: 2,
    title: "Emaar Properties Market Landscape (2027–2031)",
    subtitle:
      "Emaar's shift toward mega-ecosystems is redefining Dubai's expansion model and long-cycle capital allocation strategy.",
    date: "March 8, 2026",
    dateLabel: "Mar 8",
    image: "/mountain-landscape-sunset-orange-sky.jpg",
    author: "Entrestate Research",
    readTime: "10 min read",
    category: "Developer Intelligence",
    content: `Emaar Properties (established 1997) has moved beyond conventional development to become the primary benchmark of UAE real estate execution and sentiment. With 213 active online projects, Emaar's pipeline rhythm now materially influences liquidity behavior across Dubai and nearby growth corridors. [1]

As infill opportunities in mature hubs become increasingly constrained, Emaar is scaling a new strategy centered on integrated mega-ecosystems: large, self-contained districts that combine residential inventory, lifestyle infrastructure, and long-horizon value capture. [2]

## 1. Developer Profile and Portfolio Scope

| Metric | Data Point |
|---|---|
| Developer Name | Emaar Properties |
| Establishment Date | January 3, 1997 |
| Total Online Projects | 213 |
| Primary Markets | Dubai, Ras Al Khaimah |
| Developer ID | 79ca4333-9975-4672-b05f-bb7329de75e9 |

Emaar's execution history and capitalization profile provide a clear brand-premium effect that compresses perceived risk in new districts and supports investor confidence in long-cycle supply. [3]

## 2. Geographic Footprint and District Concentration

| District | Key Projects | Strategic Investment Value |
|---|---|---|
| Dubai Creek Harbour | Creek Haven, Lyvia by Palace, Altan, Valo, Aeon, Creek Bay | High-density vertical cluster with long-term mixed-use integration potential |
| Dubai Hills Estate | Vida Residences, Golf Hillside, Rosehill, Park Gate Phase 2 | Stabilized premium district serving upscale owner-occupier and rental demand |
| Emaar South | Golf Meadow, Golf Verge, Golf Point, Expo Golf Villas 6 | Airport-led growth thesis aligned with logistics and workforce migration |
| Mina Rashid and Beachfront | Pier Point 2, Ocean Cove, Seapoint, Baystar by Vida | Maritime luxury positioning with scarcity-backed waterfront drivers |
| Grand Polo Club (DIP) | Selvara, Chevalia Fields, Montura | Low-density equestrian luxury targeting HNWI lifestyle demand |
| Ras Al Khaimah | Address Residences Al Marjan Island | Cross-emirate diversification tied to hospitality and tourism expansion |

## 3. Asset Class Segmentation

| Asset Class | Representative Projects | Strategic Amenity Stack |
|---|---|---|
| Apartment | Creek Haven, Rosehill, Golf Hillside, Aeon | Integrated fitness, leisure, retail, and landscaped public realm |
| Villa | Ovelle, Selvara, Mareva (The Oasis), Ostra | Privacy-forward layouts, leisure clubs, and destination-style community planning |
| Townhouse | Golf Meadow, Equiterra 2, Palace Residences | Family-oriented infrastructure and community recreation zones |
| Penthouse | Avarra by Palace, Seapoint, Bayview | Marina access, premium view corridors, and luxury hospitality adjacency |

Recent demand signals indicate increasing velocity in wellness-oriented suburban clusters, suggesting a structural shift beyond legacy waterfront preference patterns. [4]

## 4. Pricing Architecture and Capital Structure

| Investment Tier | Representative Assets | Entry Value (AED) | Strategic Focus |
|---|---|---|---|
| Entry-Level | Golf Hills, Golf Verge | ~1.06M–1.20M | Yield-led portfolio entry and volume demand capture |
| Mid-Market | Creek Haven, Sera | ~1.86M–2.10M | Core residential velocity and balanced accessibility |
| Prime / Ultra-Luxury | Park Gate Phase 2, Mareva 2 | ~13.8M–14.1M+ | Capital preservation and ultra-high-net-worth demand |

| Payment Structure | Applied Projects | Capital Logic |
|---|---|---|
| 10/70/20 | Altan, Golf Meadow | Balanced deployment across construction and handover stages |
| 5/55/40 | Island Park II | Accelerated inventory absorption in late-stage delivery contexts |
| 80/20 | Golf Point, Silva Tower | Front-loaded capital from high-liquidity buyers optimizing post-handover leverage |

## 5. Delivery Pipeline and Lifecycle (2027–2031)

| Project Name | Phase | Progress | Target Delivery | Yield Strategy |
|---|---|---|---|---|
| Moor at Creek Beach | Under Construction | 100.00% | Nov 2026 | Immediate Yield |
| Aeon | Under Construction | 50.21% | Apr 2028 | Mid-Term Volume |
| Club Place | Under Construction | 42.67% | Dec 2028 | Mid-Term Volume |
| Golf Hillside | Under Construction | 36.65% | Dec 2028 | Mid-Term Volume |
| Valo | Under Construction | 33.40% | Sep 2028 | Mid-Term Volume |
| Bayview | Under Construction | 22.08% | Jul 2028 | Mid-Term Volume |
| Park Gate Phase 2 | Under Construction | 16.93% | Feb 2027 | Near-Term Capital |
| Pier Point 2 | Under Construction | 6.25% | Oct 2028 | Mid-Term Volume |
| Creek Haven | Not Started | 0.00% | Mar 2030 | Long-Term Appreciation |
| Avarra by Palace | Not Started | 0.00% | Jun 2031 | Long-Term Appreciation |

## 6. Strategic Synthesis

Three structural conclusions define the current Emaar outlook:

- Mega-community strategy is becoming the dominant value architecture for long-cycle appreciation.
- Wellness and low-density leisure assets are transitioning from niche preference to core demand category.
- Rapid absorption of premium inventory confirms sustained appetite for brand-backed lifestyle districts despite higher entry points.

Emaar remains central to Dubai's 2030–2031 residential trajectory. For disciplined investors, the portfolio mix supports both near-term income plays and multi-year appreciation exposure across emerging ecosystem corridors.`,
    evidence: [
      {
        id: "emaar-1",
        refNum: 1,
        type: "data",
        label: "Active Emaar Online Project Count",
        value: "213 projects",
        source: "Entrestate developer inventory index",
        note: "Used as the baseline for current scope and concentration analysis.",
      },
      {
        id: "emaar-2",
        refNum: 2,
        type: "source",
        label: "Mega-Ecosystem District Pivot",
        source: "Entrestate district pipeline analysis",
        note: "Captures shift from legacy core infill to integrated peripheral districts.",
      },
      {
        id: "emaar-3",
        refNum: 3,
        type: "calculation",
        label: "Brand Premium Risk Compression",
        formula: "entry valuation spread vs peer-launch districts adjusted for delivery confidence",
        note: "Quantifies premium acceptance linked to developer execution reputation.",
      },
      {
        id: "emaar-4",
        refNum: 4,
        type: "data",
        label: "Wellness-Oriented Demand Momentum",
        value: "High absorption in wellness-centric suburban clusters",
        source: "Entrestate hotness and absorption signal model",
        note: "Used to classify category shift in buyer preference.",
      },
      {
        id: "emaar-5",
        refNum: 5,
        type: "data",
        label: "Pipeline Delivery Distribution (2027–2031)",
        value: "Mix of under-construction and long-horizon launch assets",
        source: "Entrestate project lifecycle tracker",
        note: "Supports strategy split between immediate yield and long-term appreciation.",
      },
      {
        id: "emaar-6",
        refNum: 6,
        type: "calculation",
        label: "Tiered Capital Allocation Logic",
        formula: "yield profile x entry band x payment structure x delivery window",
        note: "Framework used for institutional and private portfolio structuring.",
      },
    ],
  },
  {
    id: 3,
    title: "Executive Summary: Entrestate.com Market and Property Analysis",
    subtitle:
      "February 2026 market pulse and a focused ROI crunch on Golf Lane Villas in Emaar South.",
    date: "March 9, 2026",
    dateLabel: "Mar 9",
    image: "/futuristic-city-neon-lights-night.jpg",
    author: "Entrestate Research",
    readTime: "8 min read",
    category: "Market Pulse",
    content: `Powered by the Decision Zipper Layer (DZL) and the Market ROI Engine, this report synthesizes February 2026 market conditions and a property-level investment crunch for one of Dubai's leading growth-corridor assets. [1]

## 1. Market Analysis: February 2026 Pulse

Current conditions indicate a market in a speculative phase, with speculative inventory representing a dominant share of active stock. Despite that backdrop, district-level fundamentals continue to support selective high-conviction allocations. [2]

| Market Indicator | February 2026 Data | Strategic Implication |
|---|---|---|
| Market Efficiency | 11.3% median premium | Active listing prices are currently trading above recent DLD traded-value baselines |
| Rental Dynamics | 6.7% median yield | With 63% of segments undersupplied, landlord pricing power remains elevated |
| Yield Leaders | 9.1% net yield in premium core | Business Bay and Downtown continue to rank as dominant income archetypes |
| Supply Warning | Post-2025 marina contraction | Pipeline focus is rotating toward Creek Harbour and Emaar South corridors |

## 2. Property Crunch: Golf Lane Villas (Emaar South)

Golf Lane Villas currently ranks as a top ROI candidate in the growth-frontier cluster, supported by infrastructure-led pricing momentum and strong developer execution confidence. [3]

| Attribute | Detail |
|---|---|
| Developer | Emaar Properties (Tier 1, 97% honesty index) |
| Location Archetype | Growth Frontier (Emaar South) |
| Handover Timeline | Scheduled for 2028 |
| Demand Signal | Strong-buy momentum classification |

## 3. Financial Crunch: Expected Scenario

| Financial Metric | Projection / Status |
|---|---|
| Entry Pricing | ~AED 4,480,888 for 4-bedroom villas |
| Annual ROI | 12.97% expected annual return |
| Yield Tier | Growth tier with 6.0% gross-yield target profile |
| Arbitrage Signal | High premium (>50%) vs handover cohort comparables |
| Catalyst Pricing | Strong airport-expansion thesis already reflected in current valuation |

## 4. Risk and Sensitivity

| Risk Factor | Assessment |
|---|---|
| Risk Class | Moderate due to >2-year construction horizon |
| Primary Vulnerabilities | Interest-rate shocks and hyper-local supply surges |
| Fragility Score | 0.35 (low to moderate) |
| Structural Mitigant | Emaar institutional execution profile reduces delivery-risk uncertainty |

Stress testing indicates that a ±2% rate movement can materially impact affordability and near-term exit liquidity. Position sizing and hold-period discipline remain critical. [4]

## 5. Strategic Verdict

| Investor Profile | Recommended Strategy | Conviction Play |
|---|---|---|
| Growth investor / portfolio builder (1M-2M capital tier) | Prioritize undersupplied, high-yield inventory with 2027-2028 handover windows | Golf Lane Villas remains a high-conviction infrastructure-growth exposure in Emaar South |

## 6. Conclusion

The February 2026 signal set supports a selective, evidence-first posture: avoid broad speculative exposure, prioritize districts with measurable undersupply, and allocate to assets where infrastructure catalysts and developer execution quality reinforce return durability.`,
    evidence: [
      {
        id: "pulse-1",
        refNum: 1,
        type: "source",
        label: "Decision Zipper Layer and Market ROI Engine Framework",
        source: "Entrestate analytics stack",
        note: "Primary model framework used for market-pulse and asset-level synthesis.",
      },
      {
        id: "pulse-2",
        refNum: 2,
        type: "data",
        label: "February 2026 Market Pulse Snapshot",
        value: "11.3% median premium, 6.7% median yield, 63% undersupply segments",
        source: "Entrestate market-state dataset",
        note: "Aggregated pulse metrics for city-level directional interpretation.",
      },
      {
        id: "pulse-3",
        refNum: 3,
        type: "data",
        label: "Golf Lane Villas ROI Profile",
        value: "12.97% expected annual ROI, 2028 delivery window",
        source: "Entrestate project-level ROI model",
        note: "Used for the focused asset crunch in this report.",
      },
      {
        id: "pulse-4",
        refNum: 4,
        type: "calculation",
        label: "Interest Rate Sensitivity",
        formula: "affordability shift = f(base affordability, +/-200 bps financing shock)",
        note: "Stress-test framework for scenario volatility and exit-liquidity pressure.",
      },
    ],
  },
  {
    id: 4,
    title: "Entrestate Market Intelligence: Dubai Marina Post-2025",
    subtitle:
      "Supply extinction dynamics are converting Dubai Marina inventory into scarcity-led rarity assets.",
    date: "March 4, 2026",
    dateLabel: "Mar 4",
    image: "/ocean-waves-beach-aerial-view-blue.jpg",
    author: "Entrestate Research",
    readTime: "9 min read",
    category: "Market Intelligence",
    content: `This report presents Entrestate's predictive view on Dubai Marina's structural transition after 2025. The core signal is a shift from growth-market inventory behavior to rarity-asset behavior, driven by pipeline exhaustion and physical district constraints. [1]

## Executive Summary

Dubai Marina is entering a scarcity-led phase as new-residential completion visibility declines toward zero after 2025. In this regime, pricing behavior is increasingly tied to irreplaceability and quality differentials within existing stock rather than fresh supply momentum. [2]

## 1. Zero-Completion Threshold Post-2025

Entrestate pipeline tracking indicates no meaningful post-2025 completion wave for new residential inventory within the Marina corridor. With a mature base of approximately 90 existing projects, this condition creates finite supply characteristics and lowers future dilution risk for existing units. [3]

| Signal | Current Intelligence View |
|---|---|
| Pipeline Continuity | Near-zero completion trajectory after 2025 |
| Existing Project Base | Approximately 90 mature projects |
| Market Effect | Transition from inventory growth to scarcity protection |

## 2. Tier-1 Institutional Retreat

Institutional concentration has shifted away from Marina expansion toward frontier masterplans. The strategic reallocation by top-tier developers, including Emaar, has redirected deployment intensity toward corridors such as Dubai Creek Harbour and Emaar South. [4]

| Dimension | Observation |
|---|---|
| Institutional Focus Rotation | From Marina expansion toward growth-frontier ecosystems |
| Key Beneficiary Corridors | Dubai Creek Harbour, Emaar South |
| Marina Impact | Secondary-market dynamics now dominate price discovery |

## 3. Maturation into a Capital Preservation Hub

Yield compression in Marina should be interpreted through maturity logic rather than speculative-cycle logic. Gross yields moving from earlier high-speculation levels toward lower stabilized ranges suggest a transition into preservation-oriented behavior. [5]

| Metric | Trend Signal |
|---|---|
| Historical Gross Yield Profile | Compression from speculative highs toward 4.0%-5.5% bands |
| Classification Shift | From speculative growth market to mature capital-preservation district |
| Comparative Archetype | Closer behavior to stabilized global prime districts |

## 4. Structural Constraint Regime

Dubai Marina's urban-canal form factor limits practical expansion pathways. Similar to other hard-constrained luxury districts, territorial boundaries reinforce scarcity mechanics and increase the importance of micro-location and asset quality differentials for long-cycle appreciation. [6]

## 5. Layout Extinction and Unit-Level Scarcity

With no major new typologies entering the district, high-demand legacy layouts are becoming incrementally rare. Entrestate classifies this as layout extinction: a unit-level scarcity condition where specific plan archetypes command premium repricing due to non-replicability in future pipeline cycles.

### Strategic Implications for Allocation

- Prioritize layout-specific due diligence, not just building-level averages.
- Underwrite scarcity premium durability against tenant depth and holding horizon.
- Focus on assets with strong maintenance quality and operational governance.
- Treat Marina as a preservation-plus district rather than a broad speculative beta.

## Conclusion

Post-2025, Dubai Marina is best modeled as a constrained, scarcity-led submarket where valuation performance increasingly depends on irreplaceable unit characteristics, execution quality, and long-horizon capital-preservation objectives.`,
    evidence: [
      {
        id: "marina-1",
        refNum: 1,
        type: "source",
        label: "Dubai Marina Post-2025 Structural Model",
        source: "Entrestate predictive pipeline intelligence",
        note: "Framework used to classify rarity transition and scarcity regime.",
      },
      {
        id: "marina-2",
        refNum: 2,
        type: "data",
        label: "Supply Extinction Trigger",
        value: "Post-2025 completion trajectory near zero",
        source: "Entrestate completion visibility tracker",
        note: "Primary catalyst for finite-inventory market behavior.",
      },
      {
        id: "marina-3",
        refNum: 3,
        type: "data",
        label: "Existing Marina Project Base",
        value: "~90 established projects",
        source: "Entrestate district inventory registry",
        note: "Defines current stock universe under scarcity conditions.",
      },
      {
        id: "marina-4",
        refNum: 4,
        type: "source",
        label: "Tier-1 Capital Reallocation",
        source: "Entrestate developer concentration heatmaps",
        note: "Tracks migration from Marina toward frontier masterplans.",
      },
      {
        id: "marina-5",
        refNum: 5,
        type: "data",
        label: "Yield Compression Maturity Signal",
        value: "Gross yield compression toward 4.0%-5.5% stabilized bands",
        source: "Entrestate yield regime classifier",
        note: "Used to detect transition from growth beta to preservation profile.",
      },
      {
        id: "marina-6",
        refNum: 6,
        type: "calculation",
        label: "Scarcity-Led Appreciation Logic",
        formula: "future value premium = f(supply constraint x layout rarity x demand depth)",
        note: "Unit-level framework for rarity-asset repricing potential.",
      },
    ],
  },
  {
    id: 5,
    title: "Strategic District Classifications and Predictive Trends",
    subtitle:
      "Entrestate intelligence framework for rarity-asset transitions versus high-velocity growth-frontier markets.",
    date: "March 5, 2026",
    dateLabel: "Mar 5",
    image: "/mountain-landscape-sunset-orange-sky.jpg",
    author: "Entrestate Research",
    readTime: "11 min read",
    category: "Strategic Intelligence",
    content: `This report outlines two structural district pathways identified by Entrestate's predictive analytics: the conversion of mature hubs into rarity assets and the rise of institutionally supported growth frontiers. [1]

## Executive Summary

UAE district behavior is increasingly bifurcated. Mature zones with constrained future supply are transitioning into preservation-led scarcity markets, while emerging corridors with infrastructure anchors are exhibiting higher-velocity appreciation potential. Understanding this split is central to capital-allocation strategy. [2]

## Part I: Dubai Marina and the Rarity-Asset Transition

Entrestate's district models classify Dubai Marina as entering a post-2025 rarity regime, triggered by supply extinction and reinforced by territorial constraints and changing institutional capital flows. [3]

### 1. Zero-Completion Threshold Post-2025

Pipeline tracking indicates near-zero new residential completions after 2025 in Marina. With an established base of roughly 90 projects, existing units increasingly function as finite, non-replicable inventory.

| Signal | Intelligence View |
|---|---|
| Future Residential Pipeline | Near-zero post-2025 completion profile |
| Existing Market Stock | Approximately 90 established projects |
| Primary Impact | Reduced dilution risk and higher scarcity premium potential |

### 2. Tier-1 Institutional Retreat

Developer heatmaps show a strategic migration of Tier-1 expansion intensity toward frontier ecosystems, including Dubai Creek Harbour and Emaar South.

| Dimension | Observation |
|---|---|
| Capital Rotation | From Marina expansion to growth-frontier masterplans |
| Principal Effect | Secondary-market pricing now dominates Marina dynamics |

### 3. Maturation into a Capital Preservation Hub

Yield compression from speculative highs toward 4.0%-5.5% is interpreted by the model as a maturity signal, not a distress signal. Marina behavior is converging toward preservation-style district characteristics.

| Metric | Trend Signal |
|---|---|
| Gross Yield Regime | Compression from legacy ~8% to 4.0%-5.5% bands |
| Market Classification Shift | From speculative growth to preservation-led profile |

### 4. Structural Constraint Regime

As a canal-form urban district nearing physical limits, Marina exhibits hard supply constraints similar to other exhausted luxury geographies. This supports scarcity-led repricing over volume-led momentum.

### 5. Layout Extinction Dynamics

Because new typologies are no longer entering at scale, specific high-demand layouts in existing stock are becoming rare. Entrestate classifies this as layout extinction: a unit-level scarcity condition tied to non-replicability.

## Part II: Growth Frontier Classification

Growth Frontiers are rapidly scaling districts where capital appreciation is structurally amplified by institutional infrastructure deployment and early-cycle pricing asymmetry. Entrestate models currently indicate median annual ROI of 12.3% in these zones versus 7.1% in established premium districts. [4]

### 1. Appreciation-First Thesis

Frontier markets are priced for value expansion rather than pure stability yield.

| Signal | Intelligence View |
|---|---|
| Expected Scenario | Approximately 10% annual capital gain baseline |
| Optimistic Scenario | Up to approximately 15% annual capital gain |
| Momentum Pattern | Early-node repricing can materially exceed legacy model assumptions |

### 2. Infrastructure Anchor Effect

ROI durability is strongest where mega-project infrastructure intersects with low base-entry pricing.

| Catalyst Type | Allocation Relevance |
|---|---|
| Airport, Resort, Transit, Marina Anchors | Accelerate district price discovery and demand depth |
| Dubai South Archetype | Strong gross-yield profile and long-cycle infrastructure support |

### 3. Risk-Adjusted Return Logic

Frontiers are categorized as growth or aggressive due to off-plan concentration and evolving geographic maturity. Risk is mitigated by filtering for Tier-1 developers with high delivery-certainty profiles.

### 4. Strategic Holding Timeline

Entrestate's models indicate a 3-5 year horizon as optimal for frontier-cycle capture, allowing sufficient time for infrastructure progression and valuation normalization.

### 2026 Growth Frontier Index

- Dubai South and Emaar South
- Mohammed Bin Rashid City
- Dubai Creek Harbour
- Dubai Islands

## Conclusion

The district-allocation framework is now dual-track: scarcity-preservation exposure in mature constrained hubs, and appreciation-led exposure in institutionally anchored frontiers. Portfolio efficiency improves when each district is underwritten according to its structural regime rather than a single citywide template.`,
    evidence: [
      {
        id: "class-1",
        refNum: 1,
        type: "source",
        label: "District Regime Classification Framework",
        source: "Entrestate predictive district engine",
        note: "Core framework for rarity-asset versus growth-frontier classification.",
      },
      {
        id: "class-2",
        refNum: 2,
        type: "data",
        label: "Structural Bifurcation Signal",
        value: "Mature scarcity markets diverging from frontier appreciation markets",
        source: "Entrestate market-structure telemetry",
        note: "Used to segment district behavior into two allocation archetypes.",
      },
      {
        id: "class-3",
        refNum: 3,
        type: "data",
        label: "Dubai Marina Supply Extinction Model",
        value: "Post-2025 pipeline exhaustion with approximately 90 established projects",
        source: "Entrestate pipeline and inventory registry",
        note: "Primary basis for rarity-asset transition classification.",
      },
      {
        id: "class-4",
        refNum: 4,
        type: "calculation",
        label: "Frontier ROI Differential",
        formula: "median frontier ROI (12.3%) minus established premium ROI (7.1%)",
        note: "Quantifies appreciation advantage within frontier-classified districts.",
      },
    ],
  },
  {
    id: 6,
    title: "Algorithmic Analysis of Emaar Properties’ Development Pipeline",
    subtitle:
      "District-level pipeline intelligence, absorption telemetry, and allocation strategy across 213 active Emaar listings.",
    date: "March 6, 2026",
    dateLabel: "Mar 6",
    image: "/forest-fog-morning-mist-green-trees.jpg",
    author: "Entrestate Research",
    readTime: "12 min read",
    category: "Developer Intelligence",
    content: `This report decodes Emaar Properties as the structural anchor of UAE residential market behavior. Entrestate's analytics stack tracks more than 213 active project listings and models Emaar's delivery certainty as a risk-mitigation premium for both institutional and private capital. [1]

## Executive Summary

Emaar's multi-district pipeline functions as a market-stability layer across growth and mature corridors. For allocators, the key advantage is not just exposure breadth, but confidence-weighted entry timing based on project progress, absorption velocity, and district catalyst strength. [2]

## 1. Pipeline Absorption and the Hotness Metric

Entrestate uses a proprietary Hotness Level signal to quantify market urgency and absorption intensity.

| Signal | Current Read |
|---|---|
| Terra Woods | Hotness score 100 (max urgency) |
| Virella at The Valley | Hotness score 99 (near-max urgency) |
| Allocation Meaning | Compressed entry windows before secondary-market repricing |

Maximum-score telemetry indicates rapid capital rotation into Expo-linked and frontier-aligned inventory where timing precision has outsized impact on realized returns.

## 2. Geospatial Intelligence: District-Level Dynamics

### Dubai Creek Harbour (The Lagoons)

Tracked assets include Aeon, Valo, Creek Haven, Lyvia by Palace, Altan, Montiva, Creek Bay, Moor at Creek Beach, Mangrove, Silva Tower, and Island Park II. Model outputs classify this cluster as a high-liquidity waterfront system with premium tenant segmentation and strong branded-residence support. [3]

### Mina Rashid

Tracked assets include Ocean Cove, Pier Point 2, Aurea, Sera, Baystar by Vida, and Fior 2. The district is classified as a maritime lifestyle premium corridor. Ocean Cove progress visibility (9.57%) provides a lower uncertainty profile relative to zero-progress launches.

### Grand Polo Club and Resort

Chevalia Fields, Chevalia Estate, Montura phases, Selvara phases, and Equiterra form an equestrian-luxury scarcity cluster. Rapid sell-out behavior in early phases signals constrained luxury demand depth.

### The Heights Country Club and Wellness

Salva and Serro are classified under inland wellness luxury. This category bridges mid-tier suburban demand and ultra-prime privacy-driven capital.

### Dubai Hills Estate

Club Place, Golf Hillside, Vida Residences Hillside, Rosehill, Palace Residences Hillside, and Socio represent a mature high-liquidity node. Club Place progress (42.67%) offers materially lower execution uncertainty than early-cycle assets.

### Emaar South and Dubai South

Golf Meadow, Golf Verge, Golf Point, Golf Hills, Golf Dale, Expo Golf Villas 6, and Greenspoint 2 align with airport- and logistics-led demand formation around the DWC expansion.

### The Valley and The Oasis

Palmiera Collective, Ovelle, Mareva, Avelia, and Farm Gardens 3 define suburban luxury retreat demand. With key phases sold out, upcoming launch windows become the main point of entry for large-format exposure.

## 3. Asset Class Telemetry and Pricing Tiers

Portfolio construction separates apartment cash-flow profiles from villa scarcity and appreciation profiles.

| Capital Tier | Typical Entry Band | Representative Assets |
|---|---|---|
| Entry-Level | AED 1.0M-2.0M | Golf Hills, Golf Verge, Socio, Emaar Expo Living, Rosehill, Creek Haven |
| Mid-Tier | AED 2.0M-6.0M | Aurea, Golf Meadow, Seapoint, Valo, Salva |
| Ultra-Prime | AED 6.0M+ | Selvara, Chevalia Fields, Ovelle, Mareva, Palmiera Collective, Park Gate 2 |

Branded assets (for example Palace and Vida) continue to exhibit pricing and rent resilience, with observed premium behavior versus unbranded peers in similar micro-locations. [4]

## 4. Predictive Delivery Horizons

### Ready Benchmark
- Socio (Dubai Hills) is fully complete and used as a district-level yield benchmark.

### Near-Term Window (2025)
- Island Park II and Expo Golf Villas 6 represent late-stage pre-handover positioning opportunities.

### Mid-Term Core (2026-2028)
- Aeon (50.21%), Club Place (42.67%), and Valo (33.4%) provide progressively de-risked build-cycle exposure.

### Long-Term Window (2029-2031)
- Terra Gardens, Lyvia, Avarra, Salva, and Creek Haven anchor longer-duration appreciation positioning.

## 5. Algorithmic Portfolio Strategies

Emaar payment structures (10/70/20, 10/80/10, 5/55/40 variants) support differentiated allocator profiles when mapped against district catalysts and progress telemetry.

| Strategy Archetype | Primary Objective | Example OS Allocations |
|---|---|---|
| Yield Hunter | Occupancy-led cash-flow stability | Socio, Golf Verge, Emaar Expo Living |
| Appreciation Strategist | Build-cycle value expansion | Ocean Cove, Aurea, Terra Woods |
| UHNW Hedger | Scarcity and defensiveness | Palmiera Collective, Chevalia, Park Gate 2 |

## Strategic Conclusion

Emaar remains a mathematically central component of UAE portfolio construction. Using Entrestate's district telemetry, allocators can shift from generalized exposure to precision-timed, risk-adjusted positioning across near-term yield and long-cycle appreciation tracks.`,
    evidence: [
      {
        id: "emaar-intel-1",
        refNum: 1,
        type: "data",
        label: "Active Emaar Pipeline Universe",
        value: "213+ tracked active listings",
        source: "Entrestate developer pipeline index",
        note: "Baseline dataset for this analysis.",
      },
      {
        id: "emaar-intel-2",
        refNum: 2,
        type: "calculation",
        label: "Delivery-Certainty Safety Premium",
        formula: "expected volatility discount = f(historical completion reliability x district maturity)",
        note: "Used to express risk-mitigation advantage in emerging corridors.",
      },
      {
        id: "emaar-intel-3",
        refNum: 3,
        type: "source",
        label: "District Geospatial Telemetry",
        source: "Entrestate micro-city analytics layer",
        note: "Supports corridor-level classification and catalyst mapping.",
      },
      {
        id: "emaar-intel-4",
        refNum: 4,
        type: "data",
        label: "Branded Residence Premium Range",
        value: "15%-25% observed resale/rental premium behavior",
        source: "Entrestate branded-vs-unbranded comparative index",
        note: "Used for premium resilience assumptions.",
      },
      {
        id: "emaar-intel-5",
        refNum: 5,
        type: "data",
        label: "Project Progress De-Risking Ladder",
        value: "Aeon 50.21%, Club Place 42.67%, Valo 33.4%",
        source: "Entrestate construction progress tracker",
        note: "Input for timing and exit-ladder optimization.",
      },
    ],
  },
]

// ── Topic extraction ─────────────────────────────────────────────────────────

const TOPIC_STOPWORDS = new Set([
  "with", "from", "that", "this", "and", "the", "for", "are", "have",
  "real", "estate", "market", "report", "analysis", "executive", "summary",
  "overview", "review", "strategy", "strategic", "properties", "entrestate",
  "intelligence", "post", "2025", "2026", "2027", "2028",
])

function deriveCardTopics(card: ReportCard): string[] {
  if (card.tags && card.tags.length > 0) return card.tags.slice(0, 5)
  const topics: string[] = []
  if (card.category) topics.push(card.category)
  const words = card.title
    .split(/[\s:·—\-,()/]+/)
    .map((w) => w.trim().replace(/['"]/g, ""))
    .filter((w) => w.length > 3 && !TOPIC_STOPWORDS.has(w.toLowerCase()))
  for (const w of words) {
    if (topics.length >= 5) break
    if (!topics.some((t) => t.toLowerCase().includes(w.toLowerCase()))) topics.push(w)
  }
  return topics.slice(0, 5)
}

// ─────────────────────────────────────────────────────────────────────────────

export function TimeMachineRolodex() {
  const locale = useLocale() as AppLocale
  const isArabic = locale === "ar"
  const copy = {
    back: isArabic ? "العودة" : "Back",
    research: isArabic ? "الأبحاث" : "Research",
    byEngine: isArabic ? "بحث موقّع من Entrestate" : "Signed by Entrestate Research",
    openReport: isArabic ? "افتح التقرير" : "Open report",
    topics: isArabic ? "المحاور" : "Topics",
    now: isArabic ? "الآن" : "Now",
    timelineHint: isArabic ? "مرّر أو اختر من الخط الزمني للتنقّل" : "Scroll or click timeline to navigate",
    trustNote: isArabic
      ? "كل تقرير في هذه المكتبة يُبحث ويُوقّع من محللي Entrestate. البيانات من DLD ومصادر القوائم الموثقة."
      : "Every report in this library is researched and signed by Entrestate analysts, using DLD and verified listing data.",
  }

  const [position, setPosition] = useState(0)
  const [viewMode, setViewMode] = useState<"stack" | "list">("stack")

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setViewMode("list")
    }
  }, [])
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [selectedReport, setSelectedReport] = useState<ReportCard | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)

  const handleScroll = (e: WheelEvent) => {
    if (viewMode !== "stack") return
    e.preventDefault()
    const scrollSensitivity = 0.008
    const delta = e.deltaY * scrollSensitivity
    setPosition((prev) => Math.max(0, Math.min(cards.length - 1, prev + delta)))
  }

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener("wheel", handleScroll, { passive: false })
      return () => container.removeEventListener("wheel", handleScroll)
    }
  }, [viewMode])

  const activeIndex = Math.round(position)

  const openReport = (card: ReportCard) => setSelectedReport(card)
  const closeReport = () => setSelectedReport(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY })
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (viewMode !== "stack") return
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (viewMode !== "stack" || touchStartX.current === null) return
    const deltaX = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(deltaX) > 50) {
      const direction = deltaX > 0 ? 1 : -1
      setPosition((prev) => Math.max(0, Math.min(cards.length - 1, Math.round(prev) + direction)))
    }
    touchStartX.current = null
  }

  return (
    <>
      {/* Report Reader — full-screen overlay */}
      {selectedReport && (
        <ReportReader
          report={selectedReport}
          allReports={cards}
          onClose={closeReport}
          onNavigate={(r) => setSelectedReport(r)}
        />
      )}

      {/* Rolodex container */}
      <div
        ref={containerRef}
        className="relative min-h-screen w-full overflow-hidden bg-background"
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header nav */}
        <div className="absolute end-6 top-6 z-50 flex items-center gap-1 rounded-lg border border-border/70 bg-card/80 p-1 shadow-sm backdrop-blur-sm">
          <button
            className={`rounded-md p-2 transition-colors ${viewMode === "stack" ? "bg-secondary" : "hover:bg-secondary"}`}
            onClick={() => setViewMode("stack")}
          >
            <Archive className="h-5 w-5 text-foreground" />
          </button>
          <button
            className={`rounded-md p-2 transition-colors ${viewMode === "list" ? "bg-secondary" : "hover:bg-secondary"}`}
            onClick={() => setViewMode("list")}
          >
            <Menu className="h-5 w-5 text-foreground" />
          </button>
        </div>

        {/* Entrestate wordmark */}
        <div className="absolute start-6 top-6 z-50 flex items-center gap-3">
          <a
            href={prefixLocalePath("/", locale)}
            className="text-[10px] font-medium text-muted-foreground/50 transition-colors hover:text-muted-foreground flex items-center gap-1"
          >
            <ChevronRight className={`h-3 w-3 ${isArabic ? "" : "rotate-180"}`} />
            {copy.back}
          </a>
          <span className="text-border/50">|</span>
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            entrestate
          </span>
          <span className="text-border">/</span>
          <span className="text-xs text-muted-foreground">{copy.research}</span>
        </div>

        <div className="absolute start-6 top-20 z-40 hidden max-w-xl rounded-xl border border-border/70 bg-card/80 px-4 py-3 text-xs leading-relaxed text-muted-foreground shadow-sm backdrop-blur-sm md:block">
          {copy.trustNote}
        </div>

        {viewMode === "stack" ? (
          <>
            <div className="absolute inset-0 flex items-center justify-center" style={{ perspective: "1500px" }}>
              <div className="relative h-[calc(100vh-160px)] w-[calc(100vw-32px)] md:h-[600px] md:w-[800px]" style={{ transformStyle: "preserve-3d" }}>
                {[...cards].reverse().map((card, reverseIndex) => {
                  const index = cards.length - 1 - reverseIndex
                  const distanceFromActive = index - position

                  if (distanceFromActive < -1.5 || distanceFromActive > 5) return null

                  const isInFront = distanceFromActive < 0
                  const translateZ = distanceFromActive * -60
                  const translateY = distanceFromActive * -30
                  const scale = 1 - Math.abs(distanceFromActive) * 0.03
                  let opacity = 1
                  if (isInFront) opacity = Math.max(0, 1 + distanceFromActive * 2)

                  return (
                    <div
                      key={card.id}
                      className="absolute inset-0 cursor-pointer"
                      style={{
                        transform: `translateZ(${translateZ}px) translateY(${translateY}px) scale(${Math.max(0.7, scale)})`,
                        opacity: Math.max(0, opacity),
                        zIndex: Math.round((cards.length - Math.abs(distanceFromActive)) * 10),
                        transition: "transform 0.15s ease-out, opacity 0.15s ease-out",
                        pointerEvents: Math.abs(distanceFromActive) < 0.5 ? "auto" : "none",
                      }}
                      onClick={() => {
                        if (Math.abs(distanceFromActive) < 0.3) {
                          openReport(card)
                        } else {
                          setPosition(index)
                        }
                      }}
                    >
                      {(() => {
                        const topics = deriveCardTopics(card)
                        const isActive = Math.abs(distanceFromActive) < 0.3
                        return (
                          <div className="h-full w-full overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl flex">

                            {/* ── Main content ── */}
                            <div className="relative flex flex-1 flex-col overflow-hidden p-8 md:p-10">

                              {/* Dim overlay for non-active cards */}
                              {distanceFromActive > 0 && (
                                <div className="absolute inset-0 bg-background/60 z-10 rounded-2xl" style={{ opacity: Math.min(0.5, distanceFromActive * 0.12) }} />
                              )}

                              {/* Background stroke decoration */}
                              <div
                                className="pointer-events-none absolute end-6 top-4 select-none font-serif font-black leading-none text-foreground"
                                aria-hidden
                                style={{ fontSize: "200px", WebkitTextStroke: "1px currentColor", color: "transparent", opacity: 0.04 }}
                              >
                                "
                              </div>

                              {/* Masthead row */}
                              <div className="flex items-center justify-between">
                                <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/30">
                                  {isArabic ? "أبحاث Entrestate" : "Entrestate Research"}
                                </p>
                                {card.category && (
                                  <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold text-primary">
                                    {card.category}
                                  </span>
                                )}
                              </div>

                              {/* Divider */}
                              <div className="my-5 h-px w-full bg-gradient-to-r from-border/60 via-border/30 to-transparent" />

                              {/* Title — typography hero */}
                              <div className="flex-1 flex flex-col justify-center">
                                <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight text-foreground md:text-[42px]">
                                  {card.title}
                                </h2>
                                <p className="mt-4 text-base leading-relaxed text-muted-foreground line-clamp-3">
                                  {card.subtitle}
                                </p>
                                <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/30">
                                  {copy.byEngine}
                                </p>
                              </div>

                              {/* Bottom bar */}
                              <div className="mt-6 flex items-center justify-between border-t border-border/30 pt-5">
                                <p className="text-sm text-muted-foreground/60">{card.date}</p>
                                {isActive && (
                                  <span className="flex items-center gap-1.5 text-sm font-medium text-primary">
                                    {copy.openReport} <ChevronRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* ── Side rail — topics ── */}
                            <div className="hidden md:flex w-[148px] shrink-0 flex-col border-s border-border/30 bg-card/20 p-5 pt-8">
                              <p className="mb-3 text-[8px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/25">
                                {copy.topics}
                              </p>
                              <div className="flex flex-col gap-2">
                                {topics.map((topic) => (
                                  <span
                                    key={topic}
                                    className="inline-block rounded-md border border-border/30 bg-background/20 px-2 py-1.5 text-[10px] leading-tight text-muted-foreground/45"
                                  >
                                    {topic}
                                  </span>
                                ))}
                              </div>
                              <div className="mt-auto space-y-1.5 border-t border-border/20 pt-4">
                                {card.readTime && (
                                  <p className="text-[9px] text-muted-foreground/30">{card.readTime}</p>
                                )}
                                {card.author && (
                                  <p className="text-[9px] text-muted-foreground/25">{card.author}</p>
                                )}
                              </div>
                            </div>

                          </div>
                        )
                      })()}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Timeline — desktop only */}
            <div className="absolute bottom-20 end-8 top-20 z-40 hidden md:flex flex-col items-end justify-between py-8">
              {cards.map((card, index) => {
                const isActive = index === activeIndex
                return (
                  <button key={card.id} className="group flex items-center gap-2 transition-all duration-300" onClick={() => setPosition(index)}>
                    <span className={`text-sm font-medium transition-all duration-300 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}>
                      {index === 0 ? copy.now : card.dateLabel}
                    </span>
                    <div className="relative flex items-center">
                      <div className={`h-0.5 transition-all duration-300 ${isActive ? "w-8 bg-primary" : "w-4 bg-border group-hover:w-6 group-hover:bg-muted-foreground"}`} />
                      {isActive && <div className="absolute -end-1 h-2 w-2 rounded-full bg-primary" />}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Mobile prev/next navigation */}
            <div className="absolute bottom-6 left-1/2 z-40 -translate-x-1/2 flex md:hidden items-center gap-5">
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/80 text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                onClick={() => setPosition((p) => Math.max(0, Math.round(p) - 1))}
                disabled={activeIndex === 0}
              >
                <ChevronRight className={`h-4 w-4 ${isArabic ? "" : "rotate-180"}`} />
              </button>
              <span className="text-xs tabular-nums text-muted-foreground">{activeIndex + 1} / {cards.length}</span>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/80 text-muted-foreground transition hover:text-foreground disabled:opacity-30"
                onClick={() => setPosition((p) => Math.min(cards.length - 1, Math.round(p) + 1))}
                disabled={activeIndex === cards.length - 1}
              >
                <ChevronRight className={`h-4 w-4 ${isArabic ? "rotate-180" : ""}`} />
              </button>
            </div>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-muted-foreground hidden md:block">
              {copy.timelineHint}
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto max-w-5xl px-4 md:px-6 pb-12 pt-20 md:pt-24">
              {/* Mobile: card grid */}
              <div className="flex flex-col gap-3 md:hidden">
                {cards.map((card) => (
                  <button
                    key={card.id}
                    className="group w-full rounded-2xl border border-border/60 bg-card/80 p-5 text-left transition-all active:scale-[0.99]"
                    onClick={() => openReport(card)}
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      {card.category && (
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                          {card.category}
                        </span>
                      )}
                      <span className="ms-auto text-[10px] text-muted-foreground/50">{card.date}</span>
                    </div>
                    <p className="font-serif text-lg font-medium leading-snug text-foreground">{card.title}</p>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">{card.subtitle}</p>
                    <div className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                      {copy.openReport} <ChevronRight className={`h-3 w-3 transition-transform group-hover:translate-x-0.5 ${isArabic ? "rotate-180" : ""}`} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Desktop: table rows */}
              <div className="hidden md:block divide-y divide-border/70">
                {cards.map((card, index) => (
                  <button
                    key={card.id}
                    className="group flex w-full items-center gap-6 py-4 text-left transition-colors hover:bg-card/60 rounded-lg px-3"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => openReport(card)}
                  >
                    <span className="w-32 shrink-0 text-sm text-muted-foreground">
                      {card.date.split(",")[0]}, {card.date.split(",")[1]?.trim().split(" ")[0]}
                    </span>
                    {card.category && (
                      <span className="hidden shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary sm:inline">
                        {card.category}
                      </span>
                    )}
                    <span className="min-w-0 w-60 shrink-0 font-medium text-foreground">
                      {card.title}
                    </span>
                    <span className="min-w-0 flex-1 text-muted-foreground">{card.subtitle}</span>
                    <ChevronRight className={`h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1 group-hover:text-foreground ${isArabic ? "rotate-180" : ""}`} />
                  </button>
                ))}
              </div>
            </div>
            {hoveredIndex !== null && (() => {
              const hc = cards[hoveredIndex]
              const htopics = deriveCardTopics(hc)
              return (
                <div
                  className="pointer-events-none fixed z-50 overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl"
                  style={{ left: mousePos.x + 20, top: mousePos.y - 90, width: 268, height: 168 }}
                >
                  <div className="relative flex h-full flex-col justify-between overflow-hidden p-4">
                    {/* Stroke background */}
                    <div
                      className="pointer-events-none absolute end-2 top-0 select-none font-serif font-black leading-none text-foreground"
                      aria-hidden
                      style={{ fontSize: "100px", WebkitTextStroke: "1px currentColor", color: "transparent", opacity: 0.05 }}
                    >
                      "
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/30">
                        {isArabic ? "أبحاث Entrestate" : "Entrestate Research"}
                      </p>
                      {hc.category && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[9px] font-medium text-primary">
                          {hc.category}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-serif text-sm font-medium leading-snug text-foreground line-clamp-2">
                        {hc.title}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {htopics.slice(0, 3).map((t) => (
                          <span key={t} className="rounded border border-border/30 px-1.5 py-0.5 text-[9px] text-muted-foreground/40">
                            {t}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-[10px] text-muted-foreground/30">{hc.date}</p>
                    </div>
                  </div>
                </div>
              )
            })()}
          </>
        )}
      </div>
    </>
  )
}
