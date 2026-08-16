export type LibraryCategory = "reports" | "insights" | "contracts"

export interface LibraryArticle {
  slug: string
  category: LibraryCategory
  title: string
  description: string
  date: string
  readTime: string
  tag: string
  content: string
}

export const libraryArticles: LibraryArticle[] = [
  {
    slug: "dubai-ready-inventory-pulse-q1-2026",
    category: "reports",
    title: "Dubai Ready Inventory Pulse (Q1 2026)",
    description: "Where ready inventory is tightening, where pricing softened, and which corridors kept liquidity.",
    date: "Feb 2026",
    readTime: "12 min",
    tag: "Market Report",
    content: `
## Snapshot
Ready inventory tightened in core Dubai districts while fringe supply widened. Liquidity stayed strongest in metro-adjacent corridors, with 1-2BR units leading absorption.

## Key Findings
- Downtown, Marina, and Business Bay maintained the lowest days-on-market.
- Peripheral supply formed wider price bands and longer resale timelines.
- Pricing held best where delivery is complete and amenities are proven.

## What We Monitored
We reviewed resale volume, listing spreads, and liquidity scores across 12 districts with a focus on ready stock only.
    `.trim(),
  },
  {
    slug: "abu-dhabi-coastal-markets-q4-2025",
    category: "reports",
    title: "Abu Dhabi Coastal Markets (Q4 2025)",
    description: "Saadiyat, Al Reem, and Yas Island pricing bands with demand and delivery mix.",
    date: "Dec 2025",
    readTime: "11 min",
    tag: "Market Report",
    content: `
## Snapshot
Coastal districts kept stable pricing with stronger rental demand, while new launches required sharper differentiation on payment plans.

## Key Findings
- Saadiyat showed the strongest premium retention.
- Al Reem tracked steady rental demand with balanced supply.
- Yas Island inventory remained stable but required clearer unit positioning.

## What We Monitored
We tracked delivery bands, resale spreads, and rent-to-price behavior across coastal submarkets.
    `.trim(),
  },
  {
    slug: "riyadh-residential-supply-shift-h2-2025",
    category: "reports",
    title: "Riyadh Residential Supply Shift (H2 2025)",
    description: "Where supply moved in Riyadh, which areas held pricing, and how liquidity changed.",
    date: "Nov 2025",
    readTime: "13 min",
    tag: "Market Report",
    content: `
## Snapshot
Supply increased in emerging districts while core areas held tighter liquidity. Payment plans and delivery windows played a larger role in buyer decisions.

## Key Findings
- Core districts kept stronger liquidity with narrower price bands.
- Emerging districts required sharper discounts to move inventory.
- Off-plan demand favored shorter delivery windows.

## What We Monitored
We reviewed pricing bands, absorption velocity, and delivery timing across major Riyadh districts.
    `.trim(),
  },
  {
    slug: "delivery-risk-bands-explained",
    category: "insights",
    title: "Delivery Risk Bands: How to Read 2025–2030",
    description: "A plain-language guide to delivery bands and how they affect price and liquidity.",
    date: "Jan 2026",
    readTime: "7 min",
    tag: "Insight",
    content: `
## Snapshot
Delivery bands signal time risk. The further out the delivery, the higher the pricing sensitivity and resale uncertainty.

## Key Findings
- 2025-2026 bands carry the lowest delivery risk for ready buyers.
- 2028-2029 requires stronger pricing justification and clearer demand.
- 2030+ should only appear with explicit buyer intent and risk tolerance.

## How to Use It
Match delivery bands to client horizon first, then evaluate price and liquidity.
    `.trim(),
  },
  {
    slug: "liquidity-vs-yield-tradeoffs",
    category: "insights",
    title: "Liquidity vs Yield: The Trade-Off Line",
    description: "Where higher yield begins to reduce liquidity, and how to explain it to buyers.",
    date: "Jan 2026",
    readTime: "8 min",
    tag: "Insight",
    content: `
## Snapshot
Higher yields can come with slower exits. Liquidity scores tell you how quickly a unit trades once listed.

## Key Findings
- Yield above 8% often correlates with wider resale windows.
- High-liquidity projects sit in the 5-7% yield band.
- Buyers who prioritize exit should accept slightly lower yields.

## How to Use It
Present yield and liquidity together so clients understand the trade-off.
    `.trim(),
  },
  {
    slug: "developer-execution-signals",
    category: "insights",
    title: "Developer Execution Signals",
    description: "How we read delivery history, pacing, and consistency across developer groups.",
    date: "Dec 2025",
    readTime: "9 min",
    tag: "Insight",
    content: `
## Snapshot
Execution strength shows up in delivery consistency, not marketing volume. Reliable developers keep tighter delivery ranges.

## Key Findings
- On-time delivery correlates with stronger resale premiums.
- Wide delivery variance creates pricing pressure.
- Execution signals help prioritize developer shortlists.

## How to Use It
Use execution signals to set buyer expectations before price negotiations.
    `.trim(),
  },
  {
    slug: "payment-plan-pressure",
    category: "insights",
    title: "Payment Plan Pressure: When Discounts Appear",
    description: "Signals that show when payment plan discounts begin and how to spot pressure early.",
    date: "Nov 2025",
    readTime: "7 min",
    tag: "Insight",
    content: `
## Snapshot
Discounts appear when delivery stretches and absorption slows. Payment plans widen before list prices drop.

## Key Findings
- Longer payment tails often signal early price softness.
- Discounts are most visible in oversupplied delivery bands.
- Strong demand corridors keep payment plans tighter.

## How to Use It
Use payment plan width as an early indicator of pricing pressure.
    `.trim(),
  },
  {
    slug: "uae-off-plan-escrow-protection",
    category: "contracts",
    title: "UAE Off-Plan Escrow Protection",
    description: "What escrow actually protects, how releases work, and where buyers need extra clarity.",
    date: "Oct 2025",
    readTime: "6 min",
    tag: "Contract Guide",
    content: `
## Snapshot
Escrow protects buyer funds, but release timing matters. Understanding release milestones reduces risk for off-plan buyers.

## Key Findings
- Funds are released in milestones tied to construction progress.
- Delayed milestones can extend delivery and pricing uncertainty.
- Escrow clarity builds stronger buyer confidence.

## What We Reviewed
We reviewed escrow release terms across major UAE off-plan contracts.
    `.trim(),
  },
  {
    slug: "uae-spa-timeline",
    category: "contracts",
    title: "UAE SPA Timeline: What Happens After Booking",
    description: "Step-by-step timing from booking to transfer, with the common delays to avoid.",
    date: "Sep 2025",
    readTime: "7 min",
    tag: "Contract Guide",
    content: `
## Snapshot
The SPA timeline defines the buyer journey. Delays usually come from documentation gaps or unclear handover clauses.

## Key Findings
- SPA signing sets the legal delivery and payment timetable.
- Document readiness drives faster transfer scheduling.
- Clear handover clauses reduce disputes.

## What We Reviewed
We tracked SPA timelines across 90 transactions to flag common bottlenecks.
    `.trim(),
  },
  {
    slug: "dubai-transfer-fees-explained",
    category: "contracts",
    title: "Dubai Transfer Fees Explained",
    description: "Clear breakdown of fees, required documents, and how to plan for transfer day.",
    date: "Aug 2025",
    readTime: "6 min",
    tag: "Contract Guide",
    content: `
## Snapshot
Transfer fees are predictable, but timeline delays often come from missing approvals or escrow releases.

## Key Findings
- Plan fees early to avoid last-minute rescheduling.
- Ensure approvals are cleared before booking transfer.
- Document completeness is the fastest path to close.

## What We Reviewed
We reviewed transfer workflows across Dubai Land Department cases to identify delays.
    `.trim(),
  },
]

export function getLibraryArticle(slug: string): LibraryArticle | undefined {
  return libraryArticles.find((article) => article.slug === slug)
}
