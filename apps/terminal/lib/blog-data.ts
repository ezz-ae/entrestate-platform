export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  author: {
    name: string
    role: string
    avatar: string
  }
  category: string
  publishedAt: string
  readTime: string
  coverImage: string
  featured?: boolean
}

export const blogPosts: BlogPost[] = [
  {
    slug: "disciplined-decisions-not-market-noise",
    title: "Disciplined Decisions, Not Market Noise",
    excerpt:
      "Why Entrestate OS is built on disciplined market evidence, not hype.",
    content: `
# Disciplined Decisions, Not Market Noise

Real estate volatility does not reward guesswork. Entrestate OS treats market evidence as the foundation: enforce correctness, protect capital, and sustain lawful behavior under uncertainty.

## The Shift
- Replace forecasting with disciplined decision surfaces.
- Measure intent tolerance, not vanity metrics.
- Treat market presence as a controlled system.

## What It Enables
Disciplined decision workflows create a stable operating layer for brokers: predictable risk controls, measurable signal quality, and repeatable execution.
    `.trim(),
    author: {
      name: "Nadia El-Masri",
      role: "Strategy Lead",
      avatar: "/avatars/avatar-01.svg",
    },
    category: "Strategy",
    publishedAt: "2025-01-18",
    readTime: "6 min read",
    coverImage: "/covers/cover-01.svg",
    featured: true,
  },
  {
    slug: "occalizer-pressure-dial",
    title: "The Occalizer: A Pressure Dial for Market Velocity",
    excerpt:
      "A single control that moves from precision to domination while preserving intent quality.",
    content: `
# The Occalizer: A Pressure Dial for Market Velocity

Occalizer pressure converts business appetite into technical constraints. It widens keyword gravity as tolerance increases, and tightens the radius when precision is required.

## The Operating Modes
- TOP (Precision): lowest noise, highest certainty.
- FAIR (Balance): optimal learning speed.
- RISKY (Pressure): capture mode with tight brakes.

## Why It Matters
The Occalizer makes velocity adjustable without breaking proportionality between spend and lead value.
    `.trim(),
    author: {
      name: "Omar Haddad",
      role: "Systems Architect",
      avatar: "/avatars/avatar-02.svg",
    },
    category: "Operations",
    publishedAt: "2025-01-05",
    readTime: "7 min read",
    coverImage: "/covers/cover-02.svg",
  },
  {
    slug: "scenario-management-state-machines",
    title: "Scenario Management as State Machines",
    excerpt:
      "Navigate outcomes instead of reacting to performance spikes.",
    content: `
# Scenario Management as State Machines

Campaigns are not linear. Entrestate OS treats every campaign as a state machine that moves between Exceeding, On Track, Recovering, and Stop.

## Why State Machines
- Outcomes are managed, not observed.
- Brakes are enforced by explicit constraints.
- Recovery is designed, not improvised.

## Result
You scale when the system earns it, and you pause before capital leaks.
    `.trim(),
    author: {
      name: "Salma Youssef",
      role: "Decision Systems",
      avatar: "/avatars/avatar-03.svg",
    },
    category: "Systems",
    publishedAt: "2024-12-22",
    readTime: "5 min read",
    coverImage: "/covers/cover-03.svg",
  },
  {
    slug: "lead-direction-and-fairness",
    title: "Lead Direction and the Fairness % Law",
    excerpt:
      "Leads are directions. Fairness % keeps value and time proportional to spend.",
    content: `
# Lead Direction and the Fairness % Law

Entrestate OS classifies leads by direction: READY, WARMING, EXPLORING, NOISE, and RISK. Fairness % enforces conservation across value, time, and spend.

## The Equation
Fairness % = (Lead Value x Time Validity) / Total Spend

## Operational Impact
- Escalations require evidence, not time.
- Budget moves only when fairness holds.
- RISK and NOISE are constrained by design.
    `.trim(),
    author: {
      name: "Leila Qassem",
      role: "Economics Research",
      avatar: "/avatars/avatar-04.svg",
    },
    category: "Economics",
    publishedAt: "2024-12-10",
    readTime: "8 min read",
    coverImage: "/covers/cover-04.svg",
  },
  {
    slug: "inventory-as-semantic-anchors",
    title: "Inventory as Semantic Anchors",
    excerpt:
      "Data is the wedge: 3,750+ projects become the foundation for smart surfaces.",
    content: `
# Inventory as Semantic Anchors

Entrestate OS treats inventory as semantic anchors. Pages are generated from verified project data, which unlocks search gravity and higher conversion.

## The Advantage
- Faster launch with governed structure.
- Consistent intent signals across the portfolio.
- Page semantics drive ads, not guesswork.

## Outcome
Inventory becomes a decision foundation, not just content.
    `.trim(),
    author: {
      name: "Hassan Al-Mansouri",
      role: "Data Intelligence",
      avatar: "/avatars/avatar-05.svg",
    },
    category: "Data",
    publishedAt: "2024-11-28",
    readTime: "6 min read",
    coverImage: "/covers/cover-05.svg",
  },
  {
    slug: "ads-control-room-intent-vs-interruption",
    title: "Ads Control Room: Intent vs Interruption",
    excerpt:
      "Google captures intent. Meta generates signals under strict scenario brakes.",
    content: `
# Ads Control Room: Intent vs Interruption

Entrestate OS treats Google Ads as the demand capture engine and Meta as a supervised signal generator. Each uses different brakes, different timelines, and different tolerance bands.

## The Rules
- Keyword gravity expands with Occalizer pressure.
- Meta spend is constrained by shorter windows.
- Scenario brakes pause before capital leaks.

## Result
You capture demand without sacrificing lead quality.
    `.trim(),
    author: {
      name: "Ava Knight",
      role: "Growth Strategy",
      avatar: "/avatars/avatar-06.svg",
    },
    category: "Marketing",
    publishedAt: "2024-11-14",
    readTime: "7 min read",
    coverImage: "/covers/cover-06.svg",
  },
]

export const categories = ["All", "Strategy", "Operations", "Systems", "Economics", "Data", "Marketing"]

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug)
}

export function getFeaturedPost(): BlogPost | undefined {
  return blogPosts.find((post) => post.featured)
}
