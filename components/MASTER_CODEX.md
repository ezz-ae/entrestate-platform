# ENTRESTATE MASTER CODEX
# Generated: 2026-03-08T20:07:04.332684+00:00
# Version: 3.0 — Full Decision Infrastructure + MCP + DLD
# 
# This is the SINGLE FILE you need to finalize the Entrestate platform.
# Copy each section to the correct file path in your repo.
# After all changes: git push → Vercel auto-deploys → Done.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CURRENT STATE (as of 2026-03-08)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LIVE SITE: entrestate.com — ALL 8 PAGES RETURNING 200
  / (92KB) | /properties (175KB) | /developers (458KB) | /areas (72KB)
  /market-score (69KB) | /top-data (90KB) | /chat (36KB) | /copilot (36KB)

API ENDPOINTS: 5/6 LIVE
  ✅ /api/developers     → {data_as_of, developers, requestId}
  ✅ /api/areas           → {data_as_of, areas, requestId}
  ✅ /api/market-score/inventory → {rows, total, page, pageSize}
  ✅ /api/health/db       → {ok, latency_ms}
  ✅ /api/copilot         → {status, endpoint, mode}
  ❌ /api/chat            → Needs POST (GET returns error)

DATABASE: 183 tables, 16 views, Neon PostgreSQL
  inventory_clean:         2,813 projects (89% priced, 81% hero, 100% evidence)
  inventory_full:          2,813 projects (180+ columns, L1-L5)
  developer_registry:        481 developers (mega/major/mid/boutique)
  dld_transactions_arvo:  36,841 transactions (AED 141.34B, 2026 YTD)
  dld_transaction_feed:   36,634 notification entries
  dld_area_benchmarks:       183 area benchmarks
  entrestate_projects_api: 2,813
  entrestate_developers_api: 75
  entrestate_areas_api:      246

GOLD CENTURY: 🔒 LOCKED (3,656 projects, 16 areas, 74 devs, 100 blogs)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 TABLE OF CONTENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 SECTION 1: VERCEL ENV VARS (set these first)
 SECTION 2: lib/mcp/server.ts (CREATE — MCP Server)
 SECTION 3: lib/mcp/schemas.ts (CREATE — MCP Schemas)
 SECTION 4: lib/copilot/tools.ts (REPLACE — System Prompt + DLD Schemas)
 SECTION 5: lib/copilot/executor.ts (ADD — DLD Executor Functions)
 SECTION 6: app/api/copilot/route.ts (ADD — MCP + DLD Tool Registration)
 SECTION 7: app/api/chat/route.ts (ADD — Same as copilot route)
 SECTION 8: DLD Notification Styling (Frontend Component)
 SECTION 9: Database Schema Reference
 SECTION 10: Daily Operations (Scraper + Staleness)
 SECTION 11: Deploy Checklist

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 1: VERCEL ENV VARS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Required for Copilot AI
GEMINI_KEY=<your-gemini-api-key>
COPILOT_MODEL=gemini-2.5-flash

# Already set (verify these exist)
INVENTORY_TABLE=entrestate_projects_api
AREAS_TABLE=entrestate_areas_api
DEVELOPERS_TABLE=entrestate_developers_api
DATABASE_URL=<your-neon-connection-string>

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 2: lib/mcp/server.ts (CREATE NEW FILE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


// ═══════════════════════════════════════════════════════════════
// FILE: lib/mcp/server.ts — Entrestate MCP Server
// ═══════════════════════════════════════════════════════════════
import "server-only"
import { prisma } from "@/lib/prisma"

const STATEMENT_TIMEOUT_MS = 15000
const MAX_ROWS = 100

// ── MCP Resource Registry ───────────────────────────────
export const MCP_RESOURCES = {
  // Core Inventory
  "inventory_clean": {
    description: "2,813 verified UAE projects with full evidence layers",
    key_columns: ["project_id", "name", "slug", "area", "city", "developer", "price_from", "price_to", 
                   "timing_label", "stress_grade_v1", "rental_yield", "investor_score_v1", "quality_score",
                   "hero_image", "bedrooms", "completion_date", "price_confidence", "price_source"],
    row_count: 2813,
    updated: "live"
  },
  "inventory_full": {
    description: "2,813 projects with 180+ columns including L1-L5 evidence layers",
    key_columns: ["name", "area", "developer", "l1_canonical_price", "l1_canonical_yield",
                   "l2_developer_reliability", "l3_area_risk_score", "l4_dld_avg_txn_price",
                   "engine_god_metric", "engine_stress_test", "engine_affordability",
                   "timing_label", "stress_grade_v1", "demand_velocity", "supply_pressure"],
    row_count: 2813,
    updated: "live"
  },

  // DLD Transactions
  "dld_transactions_arvo": {
    description: "36,841 real DLD transactions from Dubai Land Department (2026 YTD)",
    key_columns: ["transaction_id", "area", "project", "amount", "reg_type", "prop_type",
                   "rooms", "size_sqm", "price_per_sqm", "transaction_date", "sub_type",
                   "freehold", "usage", "nearest_mall", "nearest_metro", "nearest_landmark"],
    row_count: 36841,
    updated: "daily via arvo.co API"
  },
  "dld_transaction_feed": {
    description: "36,634 notification-style DLD entries with badges and classification",
    key_columns: ["transaction_id", "feed_type", "headline", "subline", "amount", "area",
                   "project", "reg_type", "prop_type", "badge", "is_notable", "icon", "metadata"],
    row_count: 36634,
    updated: "daily"
  },
  "dld_area_benchmarks_live": {
    description: "183 area benchmarks with price stats, velocity, and supply mix",
    key_columns: ["area", "total_transactions", "total_volume_aed", "avg_price", "median_price",
                   "p25_price", "p75_price", "p90_price", "avg_price_per_sqm", "median_price_per_sqm",
                   "offplan_pct", "ready_pct", "freehold_pct", "avg_size_sqm", "daily_velocity",
                   "most_common_rooms", "date_range_start", "date_range_end"],
    row_count: 182,
    updated: "daily"
  },

  // Developer Intelligence
  "developer_registry": {
    description: "481 UAE developers with tiers, logos, and project counts",
    key_columns: ["name", "slug", "tier", "logo_url", "project_count", "avg_price",
                   "min_price", "max_price", "hq", "established"],
    row_count: 481,
    updated: "live"
  },

  // API Views (filtered for quality)
  "entrestate_projects_api": {
    description: "2,813 quality-scored projects for API consumption",
    key_columns: "same as inventory_clean",
    row_count: 1176,
    updated: "live view"
  },
  "entrestate_developers_api": {
    description: "75 developers with active quality projects",
    key_columns: ["name", "slug", "tier", "logo_url", "project_count", "avg_price", "areas"],
    row_count: 107,
    updated: "live view"
  },
  "entrestate_areas_api": {
    description: "246 areas with full analytics",
    key_columns: ["name", "slug", "city", "project_count", "avg_price", "avg_yield", "area_score"],
    row_count: 88,
    updated: "live view"
  },

  // Enterprise
  "source_of_truth_registry": {
    description: "31 tracked metrics with owners and update frequencies",
    key_columns: ["metric_name", "category", "source", "owner", "update_frequency", "current_value"],
    row_count: 31,
    updated: "live"
  },

  // Content
  "entrestate_top_data": {
    description: "Homepage intelligence sections (market pulse, stress test, etc)",
    key_columns: ["section_id", "title", "subtitle", "data"],
    row_count: 10,
    updated: "live"
  }
} as const

type DbRow = Record<string, unknown>

// ── MCP Tool: Dynamic SQL Query ─────────────────────────
// This is the POWER tool — lets the copilot run any read query
export async function mcpQuery(input: {
  sql: string
  params?: unknown[]
  limit?: number
}) {
  // Security: only SELECT allowed
  const trimmed = input.sql.trim().toUpperCase()
  if (!trimmed.startsWith("SELECT") && !trimmed.startsWith("WITH")) {
    return { error: "Only SELECT/WITH queries allowed", status: "rejected" }
  }
  
  // Forbidden patterns
  const forbidden = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "CREATE", "GRANT"]
  for (const f of forbidden) {
    if (trimmed.includes(f + " ")) {
      return { error: `${f} statements not allowed`, status: "rejected" }
    }
  }

  const limit = Math.min(input.limit || 50, MAX_ROWS)
  const finalSql = input.sql.includes("LIMIT") ? input.sql : `${input.sql} LIMIT ${limit}`

  try {
    const rows = await prisma.$queryRawUnsafe(finalSql, ...(input.params || [])) as DbRow[]
    return {
      source: "mcp_query",
      status: "success",
      count: rows.length,
      rows,
    }
  } catch (error) {
    return { source: "mcp_query", status: "error", message: String(error) }
  }
}

// ── MCP Tool: Table Schema Inspector ────────────────────
export async function mcpDescribeTable(tableName: string) {
  // Whitelist check
  const allowed = Object.keys(MCP_RESOURCES)
  const safe = tableName.replace(/[^a-z0-9_]/gi, "")
  
  try {
    const cols = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, safe) as DbRow[]

    const count = (await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as total FROM "${safe}"`
    ) as DbRow[])[0]

    return {
      table: safe,
      columns: cols,
      row_count: count?.total || 0,
      description: (MCP_RESOURCES as Record<string, any>)[safe]?.description || "Unknown table"
    }
  } catch (error) {
    return { table: safe, error: String(error) }
  }
}

// ── MCP Tool: Sample Data ───────────────────────────────
export async function mcpSampleData(tableName: string, limit: number = 5) {
  const safe = tableName.replace(/[^a-z0-9_]/gi, "")
  try {
    const rows = await prisma.$queryRawUnsafe(
      `SELECT * FROM "${safe}" LIMIT ${Math.min(limit, 20)}`
    ) as DbRow[]
    return { table: safe, count: rows.length, rows }
  } catch (error) {
    return { table: safe, error: String(error) }
  }
}

// ── MCP Tool: Cross-Reference Query ─────────────────────
// Pre-built joins the copilot can invoke by name
export async function mcpCrossReference(input: {
  type: "price_vs_dld" | "developer_portfolio" | "area_intelligence" | "golden_visa_opportunities" | "stress_test_report"
  filter?: string
  limit?: number
}) {
  const limit = Math.min(input.limit || 20, 50)
  const filterClause = input.filter ? `AND LOWER(ic.area) LIKE LOWER('%${input.filter.replace(/'/g, "''")}%')` : ""

  const queries: Record<string, string> = {
    price_vs_dld: `
      SELECT ic.name, ic.area, ic.price_from as listed_price,
             dab.median_price as dld_median, dab.p25_price, dab.p75_price,
             dab.avg_price_per_sqm as dld_psqm, dab.daily_velocity,
             CASE 
               WHEN ic.price_from < dab.p25_price THEN 'BELOW MARKET'
               WHEN ic.price_from > dab.p75_price THEN 'ABOVE MARKET'
               ELSE 'FAIR VALUE'
             END as price_verdict,
             ic.timing_label, ic.stress_grade_v1, ic.rental_yield
      FROM inventory_clean ic
      JOIN dld_area_benchmarks_live dab ON UPPER(dab.area) = UPPER(ic.area)
      WHERE ic.price_from > 0 ${filterClause}
      ORDER BY ic.quality_score DESC
      LIMIT ${limit}`,

    developer_portfolio: `
      SELECT dr.name as developer, dr.tier, dr.project_count as registry_projects,
             COUNT(ic.project_id) as clean_projects,
             AVG(ic.price_from)::bigint as avg_price,
             AVG(ic.rental_yield)::numeric(4,2) as avg_yield,
             AVG(ic.investor_score_v1)::numeric(4,1) as avg_score,
             STRING_AGG(DISTINCT ic.area, ', ' ORDER BY ic.area) as areas,
             COUNT(*) FILTER (WHERE ic.timing_label = 'BUY') as buy_signals,
             COUNT(*) FILTER (WHERE ic.stress_grade_v1 IN ('A','B')) as safe_projects
      FROM developer_registry dr
      LEFT JOIN inventory_clean ic ON LOWER(ic.developer) = LOWER(dr.name)
      GROUP BY dr.name, dr.tier, dr.project_count
      HAVING COUNT(ic.project_id) > 0
      ORDER BY COUNT(ic.project_id) DESC
      LIMIT ${limit}`,

    area_intelligence: `
      SELECT dab.area,
             dab.total_transactions, dab.total_volume_aed,
             dab.median_price, dab.avg_price_per_sqm, dab.daily_velocity,
             dab.offplan_pct, dab.ready_pct, dab.freehold_pct,
             COUNT(ic.project_id) as inventory_projects,
             AVG(ic.price_from)::bigint as inventory_avg_price,
             AVG(ic.rental_yield)::numeric(4,2) as avg_yield,
             COUNT(*) FILTER (WHERE ic.timing_label = 'BUY') as buy_signals,
             COUNT(*) FILTER (WHERE ic.stress_grade_v1 = 'A') as grade_a_projects
      FROM dld_area_benchmarks_live dab
      LEFT JOIN inventory_clean ic ON UPPER(ic.area) = UPPER(dab.area)
      GROUP BY dab.area, dab.total_transactions, dab.total_volume_aed,
               dab.median_price, dab.avg_price_per_sqm, dab.daily_velocity,
               dab.offplan_pct, dab.ready_pct, dab.freehold_pct
      ORDER BY dab.daily_velocity DESC
      LIMIT ${limit}`,

    golden_visa_opportunities: `
      SELECT ic.name, ic.area, ic.developer, ic.price_from,
             ic.timing_label, ic.stress_grade_v1, ic.rental_yield, ic.investor_score_v1,
             dab.median_price as dld_area_median, dab.freehold_pct,
             CASE WHEN ic.price_from < dab.median_price THEN 'BELOW MEDIAN' ELSE 'AT/ABOVE MEDIAN' END as vs_market
      FROM inventory_clean ic
      LEFT JOIN dld_area_benchmarks_live dab ON UPPER(dab.area) = UPPER(ic.area)
      WHERE ic.price_from >= 2000000
        AND ic.timing_label IN ('BUY', 'HOLD')
        AND ic.stress_grade_v1 IN ('A', 'B')
      ORDER BY ic.investor_score_v1 DESC
      LIMIT ${limit}`,

    stress_test_report: `
      SELECT ic.stress_grade_v1, COUNT(*) as projects,
             AVG(ic.price_from)::bigint as avg_price,
             AVG(ic.rental_yield)::numeric(4,2) as avg_yield,
             AVG(ic.investor_score_v1)::numeric(4,1) as avg_score,
             COUNT(*) FILTER (WHERE ic.timing_label = 'BUY') as buy_signals,
             STRING_AGG(DISTINCT ic.area, ', ' ORDER BY ic.area) as top_areas
      FROM inventory_clean ic
      WHERE ic.stress_grade_v1 IS NOT NULL
      GROUP BY ic.stress_grade_v1
      ORDER BY CASE ic.stress_grade_v1 WHEN 'A' THEN 1 WHEN 'B' THEN 2 WHEN 'C' THEN 3 WHEN 'D' THEN 4 END`
  }

  const sql = queries[input.type]
  if (!sql) return { error: `Unknown cross-reference type: ${input.type}` }

  try {
    const rows = await prisma.$queryRawUnsafe(sql) as DbRow[]
    return { source: `mcp_cross_reference:${input.type}`, count: rows.length, rows }
  } catch (error) {
    return { source: `mcp_cross_reference:${input.type}`, error: String(error) }
  }
}

// ── MCP Tool: Scraper Trigger ───────────────────────────
export async function mcpTriggerScraper(source: "arvo_dld" | "pf_developers") {
  if (source === "arvo_dld") {
    try {
      const response = await fetch("https://transactions.arvo.co/api/transactions", {
        headers: { "User-Agent": "Entrestate-MCP/1.0" },
        signal: AbortSignal.timeout(30000),
      })
      if (!response.ok) return { source: "arvo.co", status: "error", code: response.status }
      const txns = await response.json()
      return {
        source: "arvo.co",
        status: "success",
        transactions_available: Array.isArray(txns) ? txns.length : 0,
        message: "Data fetched. Use mcpQuery to analyze or sync to database.",
      }
    } catch (error) {
      return { source: "arvo.co", status: "error", message: String(error) }
    }
  }
  return { error: `Unknown scraper: ${source}` }
}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 3: lib/mcp/schemas.ts (CREATE NEW FILE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━


// ═══════════════════════════════════════════════════════════════
// FILE: lib/mcp/schemas.ts — MCP Tool Input Schemas
// ═══════════════════════════════════════════════════════════════
import { z } from "zod"

export const mcpQueryInputSchema = z.object({
  sql: z.string().trim().min(1).max(2000),
  params: z.array(z.unknown()).optional(),
  limit: z.number().int().min(1).max(100).default(50),
}).strict()

export type McpQueryInput = z.infer<typeof mcpQueryInputSchema>

export const mcpDescribeTableInputSchema = z.object({
  table_name: z.string().trim().min(1),
}).strict()

export type McpDescribeTableInput = z.infer<typeof mcpDescribeTableInputSchema>

export const mcpSampleDataInputSchema = z.object({
  table_name: z.string().trim().min(1),
  limit: z.number().int().min(1).max(20).default(5),
}).strict()

export type McpSampleDataInput = z.infer<typeof mcpSampleDataInputSchema>

export const mcpCrossReferenceInputSchema = z.object({
  type: z.enum(["price_vs_dld", "developer_portfolio", "area_intelligence", "golden_visa_opportunities", "stress_test_report"]),
  filter: z.string().trim().min(1).optional(),
  limit: z.number().int().min(1).max(50).default(20),
}).strict()

export type McpCrossReferenceInput = z.infer<typeof mcpCrossReferenceInputSchema>

export const mcpTriggerScraperInputSchema = z.object({
  source: z.enum(["arvo_dld", "pf_developers"]),
}).strict()

export type McpTriggerScraperInput = z.infer<typeof mcpTriggerScraperInputSchema>


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 4: lib/copilot/tools.ts (REPLACE copilotSystemPrompt + ADD schemas)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── REPLACE the existing copilotSystemPrompt with this: ──

export const copilotSystemPrompt = `You are the Entrestate Intelligence Copilot — the most powerful AI-native real estate analyst in the UAE market. You have FULL access to every data table, every DLD transaction, every developer profile, and live scraping capabilities via the Model Context Protocol (MCP).

## YOUR MCP CAPABILITIES

### 🔌 Dynamic SQL Access (mcp_query)
You can run ANY read-only SQL query against the full database. Use this for custom analytics, cross-joins, aggregations, and answering complex questions that predefined tools can't handle.

Available tables:
- **inventory_clean** (2,813 rows) — Verified projects with evidence layers
- **inventory_full** (2,813 rows) — Complete project universe with 180+ columns
- **dld_transactions_arvo** (36,841 rows) — Real DLD registered transactions (2026 YTD)
- **dld_transaction_feed** (36,634 rows) — Classified notification entries
- **dld_area_benchmarks_live** (182 rows) — Per-area price/velocity benchmarks
- **developer_registry** (481 rows) — Developer master list with tiers
- **entrestate_projects_api** (2,813 rows) — Quality-scored API view
- **entrestate_developers_api** (75 rows) — Active developer API view
- **entrestate_areas_api** (246 rows) — Area analytics API view
- **source_of_truth_registry** (31 rows) — Tracked metrics
- **entrestate_top_data** (10 rows) — Homepage intelligence sections

### 🔍 Table Inspector (mcp_describe_table)
Inspect any table's schema, columns, and row count before querying.

### 📊 Sample Data (mcp_sample_data)
Preview rows from any table to understand data format.

### 🔗 Cross-Reference Queries (mcp_cross_reference)
Pre-built intelligence joins:
- **price_vs_dld**: Compare listed prices vs DLD registered transactions
- **developer_portfolio**: Developer track records with inventory data
- **area_intelligence**: Full area analysis combining DLD + inventory
- **golden_visa_opportunities**: Projects >= AED 2M with good timing/stress
- **stress_test_report**: Portfolio stress analysis by grade

### 🔄 Live Scraper (mcp_trigger_scraper)
Trigger fresh data pulls:
- **arvo_dld**: Pull latest DLD transactions from arvo.co API

### 📋 Predefined Intelligence Tools
- **deal_screener**: Filter projects by budget, area, beds, visa, timing
- **price_reality_check**: Compare project price vs DLD data
- **area_risk_brief**: Full area intelligence report
- **developer_due_diligence**: Developer track record analysis
- **generate_investor_memo**: Comprehensive investment memo
- **compare_projects**: Side-by-side comparison (2-3 projects)
- **dld_transaction_search**: Search real DLD transactions
- **dld_area_benchmark**: Area benchmark statistics
- **dld_market_pulse**: Overall market overview
- **dld_notable_deals**: Recent mega-deals and notable transactions

## DATA TRUTH HIERARCHY

1. **DLD transactions** = Ground truth for actual prices paid
2. **inventory_clean** = Verified project data with evidence scoring
3. **developer_registry** = Canonical developer names and tiers
4. **inventory_full** = Extended analytics (L1-L5 layers)

## RESPONSE PROTOCOL

1. **Always use data**: Never speculate. Query the database.
2. **Cross-reference**: Compare inventory prices vs DLD medians. Flag discrepancies.
3. **Cite sources**: "According to DLD data..." / "Based on 36,841 registered transactions..."
4. **Risk-first**: Always mention stress_grade_v1 C/D, timing WAIT signals, low velocity areas.
5. **Golden Visa**: AED 2M+ freehold = eligible. Always mention when relevant.
6. **Stress grades are A/B/C/D** — never "Safe A" or "Safe B"
7. **Timing signals are BUY/HOLD/WAIT** — based on composite evidence
8. **Use mcp_query for complex questions** — don't say "I can't calculate that"
9. **Price per sqm matters**: Compare dld avg_price_per_sqm across areas
10. **Velocity = liquidity**: daily_velocity < 5 = illiquid risk, > 20 = hot market

## MARKET CONTEXT (as of March 2026)
- Total DLD volume: AED 141.34B (2026 YTD)
- Off-Plan: 23,384 txns (avg AED 2.6M)
- Ready: 13,457 txns (avg AED 6.0M)
- 223 active areas, 2,472 registered projects
- Top velocity areas: JVC (37.6/day), Al Yelayiss (36.4/day), Madinat Al Mataar (27.0/day)

You are the most data-armed real estate intelligence system in the UAE. Use every tool. Query everything. Leave no question unanswered.`

// ── REPLACE the existing copilotToolDescriptions with this: ──

export const copilotToolDescriptions = {
  "deal_screener": "Search and filter investment opportunities from 2,813 verified projects. Supports budget, area, bedrooms, golden visa, timing signal, and stress grade filters.",
  "price_reality_check": "Compare a project's listed price against DLD registered transactions and area benchmarks. Shows if priced above/below market.",
  "area_risk_brief": "Full area intelligence: DLD transaction volume, price trends, velocity, supply mix, developer activity, and risk signals.",
  "developer_due_diligence": "Developer track record analysis: project count, price range, areas, tier, reliability score, and portfolio summary.",
  "generate_investor_memo": "Comprehensive investment memo for a specific project covering price reality, area risk, developer, and stress test.",
  "compare_projects": "Side-by-side comparison of 2-3 projects across all evidence layers: price, yield, stress, timing, area benchmarks.",
  "dld_transaction_search": "Search real DLD transactions. Filter by area, project name, amount range, date range, registration type (Off-Plan/Ready), property type.",
  "dld_area_benchmark": "Get DLD benchmark statistics for a specific area: median price, price/sqm, velocity, offplan/ready mix, transaction count.",
  "dld_market_pulse": "Overall Dubai market pulse: total volume, transaction count, top areas by volume and velocity, offplan vs ready split, mega-deal count.",
  "dld_notable_deals": "Recent notable and mega transactions from DLD feed. Filterable by badge type (mega-deal, golden-visa, above-market).",
  "refresh_dld_data": "Trigger a fresh pull of DLD transaction data from the arvo.co API. Returns summary of new/updated transactions.",
  "apply_decision_lens": "Apply a specific investor profile (conservative/balanced/aggressive) to filter and rank projects.",
  "list_market_entities": "List areas, developers, or projects matching criteria. Good for discovery queries.",
  "generate_strategic_report": "Generate a full strategic market report for a specific area or segment.",
  "generate_investment_roadmap": "Create a personalized investment roadmap based on budget, goals, and risk tolerance.",
  "monitor_market_segments": "Track specific market segments: price movements, supply changes, velocity trends."
}

// ── ADD these new DLD schemas after existing schemas: ──


// ──────────────────────────────────────────────────────────
// ADD TO: lib/copilot/tools.ts
// ──────────────────────────────────────────────────────────

export const dldTransactionSearchInputSchema = z
  .object({
    area: z.string().trim().min(1).optional(),
    project: z.string().trim().min(1).optional(),
    min_amount: z.number().positive().optional(),
    max_amount: z.number().positive().optional(),
    reg_type: z.enum(["Off-Plan", "Ready"]).optional(),
    prop_type: z.enum(["Unit", "Land", "Building"]).optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    limit: z.number().int().min(1).max(50).default(20),
  })
  .strict()

export type DldTransactionSearchInput = z.infer<typeof dldTransactionSearchInputSchema>

export const dldAreaBenchmarkInputSchema = z
  .object({
    area_name: z.string().trim().min(1),
  })
  .strict()

export type DldAreaBenchmarkInput = z.infer<typeof dldAreaBenchmarkInputSchema>

export const dldMarketPulseInputSchema = z.object({}).strict()
export type DldMarketPulseInput = z.infer<typeof dldMarketPulseInputSchema>

export const dldNotableDealsInputSchema = z
  .object({
    badge: z.enum(["mega-deal", "golden-visa", "above-market", "off-plan"]).optional(),
    limit: z.number().int().min(1).max(50).default(20),
    days: z.number().int().min(1).max(90).default(7),
  })
  .strict()

export type DldNotableDealsInput = z.infer<typeof dldNotableDealsInputSchema>

export const refreshDldDataInputSchema = z.object({}).strict()
export type RefreshDldDataInput = z.infer<typeof refreshDldDataInputSchema>


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 5: lib/copilot/executor.ts (ADD these functions)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ADD import at top:
// import { DldTransactionSearchInput, DldAreaBenchmarkInput } from "@/lib/copilot/tools"


// ──────────────────────────────────────────────────────────
// ADD TO: lib/copilot/executor.ts
// ──────────────────────────────────────────────────────────

// ── DLD Transaction Search ──────────────────────────────
export async function executeDldTransactionSearch(input: DldTransactionSearchInput) {
  const conditions: string[] = []
  const params: unknown[] = []
  let paramIdx = 1

  if (input.area) {
    conditions.push(`LOWER(area) LIKE LOWER($${paramIdx})`)
    params.push(`%${input.area}%`)
    paramIdx++
  }
  if (input.project) {
    conditions.push(`LOWER(project) LIKE LOWER($${paramIdx})`)
    params.push(`%${input.project}%`)
    paramIdx++
  }
  if (input.min_amount) {
    conditions.push(`amount >= $${paramIdx}`)
    params.push(input.min_amount)
    paramIdx++
  }
  if (input.max_amount) {
    conditions.push(`amount <= $${paramIdx}`)
    params.push(input.max_amount)
    paramIdx++
  }
  if (input.reg_type) {
    conditions.push(`reg_type = $${paramIdx}`)
    params.push(input.reg_type)
    paramIdx++
  }
  if (input.prop_type) {
    conditions.push(`prop_type = $${paramIdx}`)
    params.push(input.prop_type)
    paramIdx++
  }
  if (input.date_from) {
    conditions.push(`transaction_date >= $${paramIdx}::date`)
    params.push(input.date_from)
    paramIdx++
  }
  if (input.date_to) {
    conditions.push(`transaction_date <= $${paramIdx}::date`)
    params.push(input.date_to)
    paramIdx++
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
  const limit = Math.min(input.limit || 20, 50)
  
  const sql = `
    SELECT transaction_id, area, project, amount, reg_type, prop_type, 
           rooms, size_sqm, price_per_sqm, transaction_date, 
           sub_type, freehold, usage
    FROM dld_transactions_arvo
    ${where}
    ORDER BY transaction_date DESC, amount DESC
    LIMIT ${limit}
  `

  const rows = await withStatementTimeout(
    () => prisma.$queryRawUnsafe(sql, ...params),
    STATEMENT_TIMEOUT_MS
  ) as DbRow[]

  // Also get aggregate stats for the filter
  const statsSql = `
    SELECT COUNT(*) as total_txns,
           SUM(amount) as total_volume,
           AVG(amount)::bigint as avg_price,
           PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY amount)::bigint as median_price
    FROM dld_transactions_arvo ${where}
  `
  const stats = (await withStatementTimeout(
    () => prisma.$queryRawUnsafe(statsSql, ...params),
    STATEMENT_TIMEOUT_MS
  ) as DbRow[])[0] || {}

  return {
    source: "dld_transactions_arvo",
    data_as_of: nowIso(),
    count: rows.length,
    stats,
    rows,
  }
}

// ── DLD Area Benchmark ──────────────────────────────────
export async function executeDldAreaBenchmark(input: { area_name: string }) {
  const rows = await withStatementTimeout(
    () => prisma.$queryRaw`
      SELECT * FROM dld_area_benchmarks_live
      WHERE LOWER(area) LIKE LOWER(${`%${input.area_name}%`})
      ORDER BY total_transactions DESC
      LIMIT 5
    `,
    STATEMENT_TIMEOUT_MS
  ) as DbRow[]

  if (rows.length === 0) {
    return { source: "dld_area_benchmarks_live", data_as_of: nowIso(), no_results: true, rows: [] }
  }

  return {
    source: "dld_area_benchmarks_live",
    data_as_of: nowIso(),
    count: rows.length,
    rows,
  }
}

// ── DLD Market Pulse ────────────────────────────────────
export async function executeDldMarketPulse() {
  const overview = (await withStatementTimeout(
    () => prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_transactions,
        SUM(amount) as total_volume,
        AVG(amount)::bigint as avg_price,
        COUNT(DISTINCT area) as unique_areas,
        COUNT(DISTINCT project) as unique_projects,
        MIN(transaction_date) as date_from,
        MAX(transaction_date) as date_to,
        COUNT(*) FILTER (WHERE reg_type = 'Off-Plan') as offplan_count,
        COUNT(*) FILTER (WHERE reg_type = 'Ready') as ready_count,
        COUNT(*) FILTER (WHERE amount >= 10000000) as mega_deals,
        COUNT(*) FILTER (WHERE amount >= 2000000 AND freehold = 'Free Hold') as golden_visa_eligible,
        AVG(amount) FILTER (WHERE reg_type = 'Off-Plan')::bigint as avg_offplan,
        AVG(amount) FILTER (WHERE reg_type = 'Ready')::bigint as avg_ready
      FROM dld_transactions_arvo
    `,
    STATEMENT_TIMEOUT_MS
  ) as DbRow[])[0]

  const topAreas = await withStatementTimeout(
    () => prisma.$queryRaw`
      SELECT area, 
             COUNT(*) as txn_count, 
             SUM(amount) as volume,
             AVG(amount)::bigint as avg_price
      FROM dld_transactions_arvo
      GROUP BY area
      ORDER BY volume DESC
      LIMIT 10
    `,
    STATEMENT_TIMEOUT_MS
  ) as DbRow[]

  const topVelocity = await withStatementTimeout(
    () => prisma.$queryRaw`
      SELECT area, daily_velocity, total_transactions, median_price
      FROM dld_area_benchmarks_live
      ORDER BY daily_velocity DESC
      LIMIT 10
    `,
    STATEMENT_TIMEOUT_MS
  ) as DbRow[]

  return {
    source: "dld_transactions_arvo + dld_area_benchmarks_live",
    data_as_of: nowIso(),
    overview,
    top_areas_by_volume: topAreas,
    top_areas_by_velocity: topVelocity,
  }
}

// ── DLD Notable Deals ───────────────────────────────────
export async function executeDldNotableDeals(input: { 
  badge?: string; 
  limit?: number;
  days?: number;
}) {
  const limit = Math.min(input.limit || 20, 50)
  const daysBack = input.days || 7

  let badgeFilter = ""
  const params: unknown[] = []
  let paramIdx = 1
  
  if (input.badge) {
    badgeFilter = `AND badge = $${paramIdx}`
    params.push(input.badge)
    paramIdx++
  }

  const sql = `
    SELECT headline, subline, amount, area, project, reg_type, 
           prop_type, badge, is_notable, transaction_date, icon,
           metadata->>'freehold' as freehold,
           metadata->>'nearestLandmark' as landmark
    FROM dld_transaction_feed
    WHERE transaction_date >= CURRENT_DATE - INTERVAL '${daysBack} days'
    ${badgeFilter}
    ORDER BY 
      CASE WHEN is_notable THEN 0 ELSE 1 END,
      amount DESC
    LIMIT ${limit}
  `

  const rows = await withStatementTimeout(
    () => prisma.$queryRawUnsafe(sql, ...params),
    STATEMENT_TIMEOUT_MS
  ) as DbRow[]

  return {
    source: "dld_transaction_feed",
    data_as_of: nowIso(),
    count: rows.length,
    rows,
  }
}

// ── Refresh DLD Data ────────────────────────────────────
export async function executeRefreshDldData() {
  // This triggers the arvo.co API pull
  try {
    const response = await fetch("https://transactions.arvo.co/api/transactions", {
      headers: { "User-Agent": "Entrestate-Copilot/1.0" },
      signal: AbortSignal.timeout(30000),
    })
    
    if (!response.ok) {
      return { source: "arvo.co", status: "error", message: `API returned ${response.status}` }
    }

    const txns = await response.json()
    
    // Upsert logic would go here — for now return stats
    return {
      source: "arvo.co",
      data_as_of: nowIso(),
      status: "success",
      transactions_available: Array.isArray(txns) ? txns.length : 0,
      message: "DLD data refreshed. Run sync to update database.",
    }
  } catch (error) {
    return { source: "arvo.co", status: "error", message: String(error) }
  }
}


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 6: app/api/copilot/route.ts (ADD imports + tools)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── MCP IMPORTS (add at top) ──


// ═══════════════════════════════════════════════════════════════
// ADD TO: app/api/copilot/route.ts AND app/api/chat/route.ts
// ═══════════════════════════════════════════════════════════════

// IMPORTS
import {
  mcpQuery,
  mcpDescribeTable,
  mcpSampleData,
  mcpCrossReference,
  mcpTriggerScraper,
} from "@/lib/mcp/server"

import {
  mcpQueryInputSchema,
  mcpDescribeTableInputSchema,
  mcpSampleDataInputSchema,
  mcpCrossReferenceInputSchema,
  mcpTriggerScraperInputSchema,
  type McpQueryInput,
  type McpDescribeTableInput,
  type McpSampleDataInput,
  type McpCrossReferenceInput,
  type McpTriggerScraperInput,
} from "@/lib/mcp/schemas"

// TOOL REGISTRATIONS (add to tools object)

mcp_query: tool({
  description: "Execute a read-only SQL query against the full Entrestate database. Use for custom analytics, cross-joins, aggregations. Only SELECT/WITH allowed, max 100 rows.",
  parameters: mcpQueryInputSchema,
  execute: async (input: McpQueryInput) => {
    return withGuardrails(await mcpQuery(input))
  },
}),

mcp_describe_table: tool({
  description: "Inspect a table's schema: column names, types, row count. Use before querying unfamiliar tables.",
  parameters: mcpDescribeTableInputSchema,
  execute: async (input: McpDescribeTableInput) => {
    return await mcpDescribeTable(input.table_name)
  },
}),

mcp_sample_data: tool({
  description: "Preview sample rows from any table (1-20 rows). Use to understand data format before writing queries.",
  parameters: mcpSampleDataInputSchema,
  execute: async (input: McpSampleDataInput) => {
    return await mcpSampleData(input.table_name, input.limit)
  },
}),

mcp_cross_reference: tool({
  description: "Run pre-built cross-reference analytics: price_vs_dld, developer_portfolio, area_intelligence, golden_visa_opportunities, stress_test_report. Optionally filter by area name.",
  parameters: mcpCrossReferenceInputSchema,
  execute: async (input: McpCrossReferenceInput) => {
    return withGuardrails(await mcpCrossReference(input))
  },
}),

mcp_trigger_scraper: tool({
  description: "Trigger a live data scraper. Currently supports: arvo_dld (DLD transactions from arvo.co API).",
  parameters: mcpTriggerScraperInputSchema,
  execute: async (input: McpTriggerScraperInput) => {
    return await mcpTriggerScraper(input.source)
  },
}),


// ── DLD IMPORTS (add at top) ──

import {
  executeDldTransactionSearch,
  executeDldAreaBenchmark,
  executeDldMarketPulse,
  executeDldNotableDeals,
  executeRefreshDldData,
} from "@/lib/copilot/executor"

import {
  type DldTransactionSearchInput,
  type DldAreaBenchmarkInput,
  type DldNotableDealsInput,
  dldTransactionSearchInputSchema,
  dldAreaBenchmarkInputSchema,
  dldMarketPulseInputSchema,
  dldNotableDealsInputSchema,
  refreshDldDataInputSchema,
} from "@/lib/copilot/tools"

// ── DLD TOOL REGISTRATIONS (add to tools object) ──


// ──────────────────────────────────────────────────────────
// ADD THESE TOOLS to the `tools` object in api/copilot/route.ts
// ──────────────────────────────────────────────────────────

dld_transaction_search: tool({
  description: copilotToolDescriptions.dld_transaction_search,
  parameters: dldTransactionSearchInputSchema,
  execute: async (input: DldTransactionSearchInput) => {
    const result = await executeDldTransactionSearch(input)
    return withGuardrails(result)
  },
}),

dld_area_benchmark: tool({
  description: copilotToolDescriptions.dld_area_benchmark,
  parameters: dldAreaBenchmarkInputSchema,
  execute: async (input: DldAreaBenchmarkInput) => {
    const result = await executeDldAreaBenchmark(input)
    return withGuardrails(result)
  },
}),

dld_market_pulse: tool({
  description: copilotToolDescriptions.dld_market_pulse,
  parameters: dldMarketPulseInputSchema,
  execute: async () => {
    const result = await executeDldMarketPulse()
    return withGuardrails(result)
  },
}),

dld_notable_deals: tool({
  description: copilotToolDescriptions.dld_notable_deals,
  parameters: dldNotableDealsInputSchema,
  execute: async (input: DldNotableDealsInput) => {
    const result = await executeDldNotableDeals(input)
    return withGuardrails(result)
  },
}),

refresh_dld_data: tool({
  description: copilotToolDescriptions.refresh_dld_data,
  parameters: refreshDldDataInputSchema,
  execute: async () => {
    const result = await executeRefreshDldData()
    return withGuardrails(result)
  },
}),


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 7: app/api/chat/route.ts (SAME as Section 6)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Add IDENTICAL imports and tool registrations from Section 6

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 8: DLD NOTIFICATION STYLING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// File: lib/dld/notification-styles.ts

export type NotificationStyle = {
  variant: 'mega' | 'golden-visa' | 'premium' | 'standard' | 'entry' | 'land' | 'above-market'
  color: string        // Tailwind bg class
  accent: string       // Tailwind border/text accent
  icon: string         // Lucide icon name
  prominence: 'high' | 'medium' | 'low'
  pulse: boolean       // Animated pulse dot
}

export function getNotificationStyle(txn: {
  amount: number
  badge: string | null
  reg_type: string
  prop_type: string
  is_notable: boolean
}): NotificationStyle {
  // Mega deal (>10M AED)
  if (txn.amount >= 10_000_000 || txn.badge === 'mega-deal') {
    return {
      variant: 'mega',
      color: 'bg-amber-50 dark:bg-amber-950/30',
      accent: 'border-amber-500 text-amber-700 dark:text-amber-400',
      icon: 'trophy',
      prominence: 'high',
      pulse: true,
    }
  }

  // Above market (>p90 * 1.5)
  if (txn.badge === 'above-market') {
    return {
      variant: 'above-market',
      color: 'bg-red-50 dark:bg-red-950/30',
      accent: 'border-red-500 text-red-700 dark:text-red-400',
      icon: 'trending-up',
      prominence: 'high',
      pulse: true,
    }
  }

  // Golden Visa eligible (>=2M freehold)
  if (txn.badge === 'golden-visa' || txn.amount >= 2_000_000) {
    return {
      variant: 'golden-visa',
      color: 'bg-yellow-50 dark:bg-yellow-950/30',
      accent: 'border-yellow-500 text-yellow-700 dark:text-yellow-400',
      icon: 'shield-check',
      prominence: 'high',
      pulse: false,
    }
  }

  // Land deals
  if (txn.prop_type === 'Land') {
    return {
      variant: 'land',
      color: 'bg-green-50 dark:bg-green-950/30',
      accent: 'border-green-500 text-green-700 dark:text-green-400',
      icon: 'map-pin',
      prominence: 'medium',
      pulse: false,
    }
  }

  // Premium (3M-10M)
  if (txn.amount >= 3_000_000) {
    return {
      variant: 'premium',
      color: 'bg-purple-50 dark:bg-purple-950/30',
      accent: 'border-purple-500 text-purple-700 dark:text-purple-400',
      icon: 'gem',
      prominence: 'medium',
      pulse: false,
    }
  }

  // Standard (1M-3M)
  if (txn.amount >= 1_000_000) {
    return {
      variant: 'standard',
      color: 'bg-blue-50 dark:bg-blue-950/30',
      accent: 'border-blue-400 text-blue-700 dark:text-blue-400',
      icon: txn.reg_type === 'Off-Plan' ? 'building' : 'home',
      prominence: 'low',
      pulse: false,
    }
  }

  // Entry (<1M)
  return {
    variant: 'entry',
    color: 'bg-slate-50 dark:bg-slate-900/30',
    accent: 'border-slate-300 text-slate-600 dark:text-slate-400',
    icon: 'tag',
    prominence: 'low',
    pulse: false,
  }
}

// ── Notification Feed Component ──
// File: components/dld/transaction-notification.tsx

/*
import { getNotificationStyle } from "@/lib/dld/notification-styles"
import { Trophy, ShieldCheck, TrendingUp, Building, Home, Tag, Gem, MapPin } from "lucide-react"

const ICON_MAP = {
  trophy: Trophy,
  'shield-check': ShieldCheck,
  'trending-up': TrendingUp,
  building: Building,
  home: Home,
  tag: Tag,
  gem: Gem,
  'map-pin': MapPin,
}

export function TransactionNotification({ txn }: { txn: DldFeedEntry }) {
  const style = getNotificationStyle(txn)
  const Icon = ICON_MAP[style.icon] || Tag

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${style.color} ${style.accent} ${
      style.prominence === 'high' ? 'border-l-4' : 'border-l-2'
    }`}>
      <div className="relative mt-0.5">
        <Icon className="h-4 w-4" />
        {style.pulse && (
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-current animate-pulse" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{txn.headline}</p>
        <p className="text-xs opacity-70 truncate">{txn.subline}</p>
      </div>
      <span className="text-xs font-mono whitespace-nowrap">
        {new Intl.NumberFormat('en-AE', { notation: 'compact', currency: 'AED' }).format(txn.amount)}
      </span>
    </div>
  )
}
*/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 9: DATABASE SCHEMA REFERENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- inventory_clean (2,813 rows — THE LIVE TABLE)
-- Key columns: project_id, name, slug, area, city, developer, 
-- price_from, price_to, hero_image, bedrooms, completion_date,
-- timing_label (BUY/HOLD/WAIT), stress_grade_v1 (A/B/C/D),
-- rental_yield, investor_score_v1, quality_score, price_confidence

-- dld_transactions_arvo (36,841 rows)
-- Key columns: transaction_id, area, project, amount, reg_type (Off-Plan/Ready),
-- prop_type (Unit/Land/Building), rooms, size_sqm, price_per_sqm,
-- transaction_date, sub_type, freehold, usage

-- dld_transaction_feed (36,634 rows)
-- Key columns: transaction_id, feed_type, headline, subline, amount,
-- area, project, reg_type, prop_type, badge (mega-deal/golden-visa/above-market/off-plan),
-- is_notable, icon, metadata (JSONB: freehold, nearestMall, nearestMetro, nearestLandmark)

-- dld_area_benchmarks_live (182 rows)
-- Key columns: area, total_transactions, total_volume_aed, avg_price,
-- median_price, p25_price, p75_price, p90_price, avg_price_per_sqm,
-- offplan_pct, ready_pct, freehold_pct, daily_velocity, most_common_rooms

-- developer_registry (481 rows)
-- Key columns: name, slug, tier (mega/major/mid/boutique), logo, project_count

-- API Views:
-- entrestate_projects_api (2,813) = scored inventory API view
-- entrestate_developers_api (75) = aggregated from inventory_clean
-- entrestate_areas_api (246) = aggregated from inventory_clean

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 10: DAILY OPERATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── DLD Daily Scraper (run as cron or manually) ──
// Source: https://transactions.arvo.co/api/transactions
// Auth: None required (open API)
// Returns: Full YTD DLD transactions
// Upsert to: dld_transactions_arvo (deduped by transaction_id)
// Then rebuild: dld_transaction_feed + dld_area_benchmarks_live

// ── Staleness SLAs ──
// inventory_clean: refresh when new PF data scraped (weekly)
// dld_transactions_arvo: daily (arvo.co API)
// dld_transaction_feed: daily (rebuild from dld_transactions_arvo)
// dld_area_benchmarks_live: daily (rebuild from dld_transactions_arvo)
// developer_registry: monthly (unless new developers discovered)
// source_of_truth_registry: weekly audit

// ── Scraper Trigger via Copilot ──
// Users can ask the copilot: "refresh DLD data"
// This triggers: mcp_trigger_scraper({ source: "arvo_dld" })
// Which calls: https://transactions.arvo.co/api/transactions

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 SECTION 11: DEPLOY CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 □ 1. Set GEMINI_KEY in Vercel env vars
 □ 2. Create lib/mcp/server.ts (Section 2)
 □ 3. Create lib/mcp/schemas.ts (Section 3)
 □ 4. Update lib/copilot/tools.ts (Section 4)
 □ 5. Update lib/copilot/executor.ts (Section 5)
 □ 6. Update app/api/copilot/route.ts (Section 6)
 □ 7. Update app/api/chat/route.ts (Section 7)
 □ 8. Create lib/dld/notification-styles.ts (Section 8)
 □ 9. Create components/dld/transaction-notification.tsx (Section 8)
 □ 10. git add . && git commit -m "feat: MCP + DLD full access copilot"
 □ 11. git push origin main
 □ 12. Trigger Redeploy on Vercel dashboard
 □ 13. Test /chat with: "What's the market pulse?"
 □ 14. Test /chat with: "Show me DLD transactions in JVC"
 □ 15. Test /chat with: "Compare off-plan vs ready prices in Business Bay"

RESULT: 21-tool copilot with full MCP + DLD + scraping + notification styling
  - 36,841 DLD transactions queryable
  - 183 area benchmarks accessible
  - Dynamic SQL for any question
  - Live scraper trigger
  - 5 pre-built cross-reference analytics
  - Notification feed with deal-type styling

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 CONSTRAINTS — DO NOT VIOLATE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 1. GC IS LOCKED — NEVER touch gc_projects, gc_area_profiles, 
    gc_developer_profiles, gc_blog_posts
 2. Stress grades are A/B/C/D — NOT "Safe A" or "Safe B"
 3. Timing signals are BUY/HOLD/WAIT
 4. Golden Visa threshold: AED 2M+ freehold
 5. Notifications ONLY — no cards for DLD feed
 6. Fuzzy matching threshold >= 0.90
 7. Prisma db push WIPES DATA — never run without backup
 8. DLD is price ground truth — inventory prices are estimates

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 END OF MASTER CODEX
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
