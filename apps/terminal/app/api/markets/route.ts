import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { z } from "zod"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { withStatementTimeout } from "@/lib/db-guardrails"
import { buildExclusionSql } from "@/lib/inventory-policy"
import { buildRateLimitKey, rateLimit } from "@/lib/rate-limit"
import { getLatestNotebookProvenance } from "@/lib/notebook-provenance"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const PROVENANCE_TIMEOUT_MS = 500
const RATE_LIMIT_TIMEOUT_MS = 250
const MARKET_QUERY_TIMEOUT_MS = 2000

type RateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

const marketsQuerySchema = z.object({
  city: z.string().trim().min(1).max(80).optional(),
  area: z.string().trim().min(1).max(120).optional(),
  developer: z.string().trim().min(1).max(120).optional(),
  beds: z.string().trim().min(1).max(20).optional(),
  status_band: z.string().trim().min(1).max(40).optional(),
  minPrice: z.coerce.number().finite().min(0).optional(),
  maxPrice: z.coerce.number().finite().min(0).optional(),
  sort: z.enum(["score", "price", "safety"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).max(10000).optional(),
})

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

function createRateLimitFallback(limit: number): RateLimitResult {
  return {
    allowed: true,
    remaining: limit,
    resetAt: Date.now() + 60_000,
  }
}

async function resolveProvenanceFast() {
  try {
    return await Promise.race([
      getLatestNotebookProvenance(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), PROVENANCE_TIMEOUT_MS)),
    ])
  } catch {
    return null
  }
}

async function resolveRateLimitFast(request: Request) {
  try {
    return await Promise.race([
      rateLimit(buildRateLimitKey(request, "markets"), {
        limit: 120,
        windowMs: 60_000,
      }),
      new Promise<RateLimitResult>((resolve) =>
        setTimeout(() => resolve(createRateLimitFallback(120)), RATE_LIMIT_TIMEOUT_MS),
      ),
    ])
  } catch {
    return createRateLimitFallback(120)
  }
}

/**
 * GET /api/markets
 *
 * Query params:
 *   city     - filter by emirate (Dubai, Abu Dhabi, etc.)
 *   area     - filter by area name
 *   type     - filter by unit type (Studio, 1BR, 2BR, etc.)
 *   minPrice - min price per sqft
 *   maxPrice - max price per sqft
 *   sort     - sort field (price, yield, volume, change)
 *   limit    - number of results (default 50)
 *   offset   - pagination offset
 *
 * Uses agent_inventory_view_v1 for live inventory results.
 */

export async function GET(request: Request) {
  const requestId = getRequestId(request)

  const provenance = await resolveProvenanceFast()
  const runId = provenance?.run_id ?? requestId

  try {
    const { allowed, resetAt } = await resolveRateLimitFast(request)
    if (!allowed) {
      const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000))
      return NextResponse.json(
        {
          error: "Too many requests. Please wait a moment and try again.",
          requestId,
          request_id: requestId,
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } },
      )
    }

    const { searchParams } = new URL(request.url)
    const rawParams = Object.fromEntries(searchParams.entries())
    const parsed = marketsQuerySchema.safeParse(rawParams)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters.", requestId, request_id: requestId },
        { status: 400 },
      )
    }
    const {
      city,
      area,
      developer,
      beds,
      status_band: statusBand,
      minPrice,
      maxPrice,
      sort,
      limit,
      offset,
    } = parsed.data
    const effectiveSort = sort ?? "score"
    const effectiveLimit = limit ?? 12
    const effectiveOffset = offset ?? 0

    const clauses: Prisma.Sql[] = []
    if (city) clauses.push(Prisma.sql`city ILIKE ${`%${city}%`}`)
    if (area) clauses.push(Prisma.sql`area ILIKE ${`%${area}%`}`)
    if (developer) clauses.push(Prisma.sql`developer ILIKE ${`%${developer}%`}`)
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
    if (statusBand) clauses.push(Prisma.sql`status_band::text = ${statusBand}::text`)
    if (typeof minPrice === "number") {
      clauses.push(Prisma.sql`price_aed >= ${minPrice}`)
    }
    if (typeof maxPrice === "number") {
      clauses.push(Prisma.sql`price_aed <= ${maxPrice}`)
    }

    const exclusionSql = buildExclusionSql()
    if (exclusionSql) clauses.push(exclusionSql)

    const whereClause = clauses.length
      ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`
      : Prisma.empty

    const orderBy =
      effectiveSort === "price"
        ? Prisma.sql`ORDER BY price_aed ASC NULLS LAST`
        : effectiveSort === "safety"
          ? Prisma.sql`ORDER BY safety_band ASC NULLS LAST`
          : Prisma.sql`ORDER BY score_0_100 DESC NULLS LAST`

    const { rows, totalCount } = await Promise.race([
      withStatementTimeout(async (tx) => {
        const [rows, countRows] = await Promise.all([
          tx.$queryRaw<any[]>(Prisma.sql`
            SELECT
              asset_id::text AS asset_id,
              name,
              developer,
              city,
              area,
              status_band,
              price_aed::double precision AS price_aed,
              beds,
              score_0_100::double precision AS score_0_100,
              safety_band,
              classification
            FROM agent_inventory_view_v1
            ${whereClause}
            ${orderBy}
            LIMIT ${effectiveLimit} OFFSET ${effectiveOffset}
          `),
          tx.$queryRaw<Array<{ count: number | string }>>(Prisma.sql`
            SELECT COUNT(*)::int AS count
            FROM agent_inventory_view_v1
            ${whereClause}
          `),
        ])

        return {
          rows,
          totalCount: Number(countRows[0]?.count ?? 0),
        }
      }),
      new Promise<{ rows: any[]; totalCount: number }>((_, reject) =>
        setTimeout(() => reject(new Error("Market query timeout")), MARKET_QUERY_TIMEOUT_MS),
      ),
    ])

    const normalizedRows = rows.map((row) => normalizeValue(row))

    return NextResponse.json({
      requestId,
      request_id: requestId,
      run_id: runId,
      provenance: {
        run_id: runId,
        snapshot_ts: provenance?.snapshot_ts ?? null,
        sources_used: provenance?.sources_used ?? ["inventory_full"],
      },
      total: totalCount,
      results: normalizedRows,
      data: normalizedRows,
      projects: normalizedRows,
    }, {
      headers: {
        "x-request-id": requestId,
      },
    })
  } catch (error) {
    console.error("Markets query error:", { requestId, error })
    return NextResponse.json({
      requestId,
      request_id: requestId,
      run_id: runId,
      provenance: {
        run_id: runId,
        snapshot_ts: provenance?.snapshot_ts ?? null,
        sources_used: provenance?.sources_used ?? ["inventory_full"],
      },
      total: 0,
      results: [],
      data: [],
      projects: [],
      warning: getPublicErrorMessage(error, "Failed to load market inventory."),
    }, {
      status: 500,
      headers: {
        "x-request-id": requestId,
      },
    })
  }
}
