// Markdown content for each documentation section (real estate language)
export const docsMarkdown = {
  introduction: `# Market Data Guide

Entrestate is a market data and decision platform for real estate teams. This guide explains how to access the live feed, what the fields mean, and how to use the data in daily work.

## What you get

- **UAE-wide coverage** across cities, areas, and projects
- **Safety and timing tiers** for faster decision checks
- **Media assets** tied to each project where available`,

  quickstart: `# Quickstart

Get access to the live feed and start exploring in minutes.

## 1) Request access
Your account is approved by the Entrestate team to protect data quality.

## 2) Choose delivery
Pick the format that fits your team:
- Live feed (JSON)
- Data packs (CSV)
- Scheduled exports for reports

## 3) Start with Explorer
Use Explorer to search projects, compare areas, and validate safety tiers.`,

  authentication: `# Access Keys

Your access key unlocks the market feed. Keep it private and rotate it regularly.

## Using your access key

\`\`\`bash
curl https://api.entrestate.ai/v1/market-feed \\
  -H "Authorization: Bearer YOUR_ACCESS_KEY" \\
  -H "Content-Type: application/json"
\`\`\``,

  "chat-completions": `# Market Desk Requests

Use the Market Desk to ask in plain language and receive structured answers.

## Request
\`\`\`json
POST /api/chat
{
  "message": "Studios under AED 800K in Business Bay"
}
\`\`\`

## Response (shape)
\`\`\`json
{
  "content": "Found matches in Business Bay...",
  "results": [
    { "name": "Project name", "price_aed": 780000, "status_band": "2026" }
  ]
}
\`\`\``,

  embeddings: `# Field Dictionary

These are the most-used fields in the market feed.

\`\`\`json
{
  "price_aed": 1850000,
  "status_band": "2026",
  "safety_band": "Capital Safe",
  "classification": "Balanced",
  "roi_band": "Mid",
  "liquidity_band": "Short (1-2yr)"
}
\`\`\``,

  models: `# Coverage & Geography

Market coverage is organized by city, area, and project. Use Explorer and Market Score to see what is currently in the live feed.`,

  "model-routing": `# Routing Rules

Investor routing is based on two inputs:
- **Risk profile** (Conservative, Balanced, Aggressive)
- **Horizon** (Ready, 6-12mo, 1-2yr, 2-4yr, 4yr+)

These rules keep conservative profiles out of speculative inventory by default.`,

  streaming: `# Update Cadence

Data is refreshed on a scheduled cadence:
- **Core inventory**: weekly
- **Safety and scoring**: after each inventory refresh
- **Media assets**: rolling updates`,

  "function-calling": `# Add-ons

Optional add-ons can be enabled per client:
- Media packs (images, plans, amenities)
- Transaction history
- Rental pricing bands`,

  "api-keys": `# Access Keys & Permissions

Keys are assigned per team and can be revoked anytime. Never store keys in public code.

\`\`\`bash
export ENTRESTATE_ACCESS_KEY="ent_live_..."
\`\`\``,

  "rate-limits": `# Delivery Limits

Delivery limits vary by plan and protect the market feed.

| Plan | Daily Requests | Notes |
|------|----------------|------|
| Starter | 2,000 | Standard access |
| Pro | 10,000 | Priority refresh |
| Enterprise | Custom | Dedicated lanes |
`,
}

export const fullDocsMarkdown = Object.values(docsMarkdown).join("\n\n---\n\n")

export type DocsSectionId = keyof typeof docsMarkdown
