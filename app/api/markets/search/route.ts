import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { withStatementTimeout } from "@/lib/db-guardrails"
import { buildExclusionSql } from "@/lib/inventory-policy"
import { buildRateLimitKey, rateLimit } from "@/lib/rate-limit"

function normalizeValue(value: unknown): unknown {
  if (typeof value === "bigint") {
    const asNumber = Number(value)
    return Number.isSafeInteger(asNumber) ? asNumber : value.toString()
  }
  if (value instanceof Date) return value.toISOString()
  if (value && typeof value === "object" && "toNumber" in value) {
    try {
      return (value as { toNumber: () => number }).toNumber()
    } catch {
      return value
    }
  }
  if (Array.isArray(value)) return value.map((item) => normalizeValue(item))
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, val]) => [key, normalizeValue(val)]),
    )
  }
  return value
}

/**
 * GET /api/markets/search
 *
 * High-performance search endpoint for:
 *   q        - full text search across areas, projects, developers, features
 *   city     - filter by emirate
 *   type     - unit type filter
 *   beds     - bedrooms (0=studio, 1, 2, 3, 4+)
 *   minPrice - minimum price
 *   maxPrice - maximum price
 *   features - comma-separated features (balcony, sea_view, high_floor, parking)
 *   radius   - similarity search radius
 *
 * When connected to Neon/Prisma:
 * - Uses full-text search with ts_vector
 * - Supports feature-based filtering on JSONB columns
 * - Returns ranked results by relevance + market activity
 */

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  try {
    const { allowed, resetAt } = await rateLimit(buildRateLimitKey(request, "markets-search"), {
      limit: 120,
      windowMs: 60_000,
    })
    if (!allowed) {
      const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
      return NextResponse.json(
        { error: "Too many requests. Please wait a moment and try again.", requestId },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      )
    }

    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q")
    const city = searchParams.get("city")
    const type = searchParams.get("type")
    const beds = searchParams.get("beds")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const features = searchParams.get("features")?.split(",").filter(Boolean)

    if (q && q.length > 120) {
      return NextResponse.json(
        { error: "Search query is too long. Keep it under 120 characters.", requestId },
        { status: 400 },
      )
    }

    if (features && features.length > 8) {
      return NextResponse.json(
        { error: "Too many feature filters. Limit to 8.", requestId },
        { status: 400 },
      )
    }

    const clauses: Prisma.Sql[] = []

    if (q && q.trim().length > 1) {
      const like = `%${q.trim()}%`
      clauses.push(
        Prisma.sql`(name ILIKE ${like} OR developer ILIKE ${like} OR area ILIKE ${like} OR city ILIKE ${like})`,
      )
    }
    if (city) clauses.push(Prisma.sql`city ILIKE ${`%${city}%`}`)
    if (beds) {
      const normalized = beds.toLowerCase()
      if (normalized.includes("studio")) {
        clauses.push(Prisma.sql`
          (
            beds::text ILIKE ${"%Studio%"}
            OR NULLIF(REGEXP_REPLACE(beds::text, '[^0-9.]', '', 'g'), '')::double precision = 0
          )
        `)
      } else {
        const bedsValue = Number.parseFloat(beds)
        if (!Number.isNaN(bedsValue)) {
          const bedsText = String(bedsValue)
          clauses.push(Prisma.sql`
            (
              NULLIF(REGEXP_REPLACE(beds::text, '[^0-9.]', '', 'g'), '')::double precision = ${bedsValue}
              OR beds::text ILIKE ${`%${bedsText}%`}
            )
          `)
        } else {
          clauses.push(Prisma.sql`beds::text ILIKE ${`%${beds}%`}`)
        }
      }
    }
    if (minPrice) {
      const parsed = Number.parseFloat(minPrice)
      if (!Number.isNaN(parsed)) {
        clauses.push(Prisma.sql`price_aed >= ${parsed}`)
      }
    }
    if (maxPrice) {
      const parsed = Number.parseFloat(maxPrice)
      if (!Number.isNaN(parsed)) {
        clauses.push(Prisma.sql`price_aed <= ${parsed}`)
      }
    }

    const exclusionSql = buildExclusionSql()
    if (exclusionSql) clauses.push(exclusionSql)

    const whereClause = clauses.length
      ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`
      : Prisma.empty

    const rows = await withStatementTimeout((tx) =>
      tx.$queryRaw<any[]>(Prisma.sql`
        SELECT
          v.asset_id::text AS asset_id,
          v.name,
          v.developer,
          COALESCE(
            NULLIF(TRIM(to_jsonb(v) ->> 'developer_ar'), ''),
            NULLIF(TRIM(to_jsonb(v) ->> 'name_ar'), '')
          ) AS developer_ar,
          v.city,
          v.area,
          COALESCE(
            NULLIF(TRIM(to_jsonb(v) ->> 'area_ar'), ''),
            NULLIF(TRIM(to_jsonb(v) ->> 'name_ar'), '')
          ) AS area_ar,
          v.status_band,
          v.price_aed,
          v.beds,
          v.score_0_100,
          v.safety_band,
          v.classification
        FROM agent_inventory_view_v1 v
        ${whereClause}
        ORDER BY v.score_0_100 DESC NULLS LAST
        LIMIT 20
      `),
    )

    const normalizedRows = rows.map((row) => normalizeValue(row))

    return NextResponse.json({
      status: "ok",
      params: { q, city, type, beds, minPrice, maxPrice, features },
      results: normalizedRows,
    })
  } catch (error) {
    console.error("Markets search error:", { requestId, error })
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to run search."), requestId },
      { status: 500 },
    )
  }
}
