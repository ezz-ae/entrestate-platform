import { NextResponse } from "next/server"
import { getRequestId } from "@/lib/api-errors"
import { parseMarketScoreFilters } from "@/lib/market-score/filters"
import { getMarketScoreSummary } from "@/lib/market-score/service"
import type { MarketScoreSummary } from "@/lib/market-score/types"
import { filtersSchema, routingSchema } from "@/lib/market-score/validators"
import { getLatestNotebookProvenance } from "@/lib/notebook-provenance"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const SUMMARY_TIMEOUT_MS = 2500
const PROVENANCE_TIMEOUT_MS = 500

function emptySummary(): MarketScoreSummary {
  return {
    totalAssets: 0,
    avgScore: 0,
    safetyDistribution: [],
    classificationDistribution: [],
    avgScoreByStatus: [],
    avgScoreBySafetyBand: [],
    avgScoreByPriceTier: [],
    conservativeReadyPool: 0,
    balancedDefaultPool: 0,
    available: {
      cities: [],
      areas: [],
      statusBands: [],
      priceTiers: [],
      safetyBands: [],
    },
    source: "view",
    truthChecks: {
      conservativeReady: [],
      balancedShort: [],
      horizonViolations: 0,
      speculativeLeak: 0,
    },
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

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const provenance = await resolveProvenanceFast()
  const runId = provenance?.run_id ?? requestId

  try {
    const { searchParams } = new URL(request.url)
    const { filters, routing, overrideFlags } = parseMarketScoreFilters(searchParams)
    filtersSchema.parse(filters)
    routingSchema.parse(routing)
    const summary = await Promise.race([
      getMarketScoreSummary(filters, routing, overrideFlags),
      new Promise<MarketScoreSummary>((resolve) =>
        setTimeout(() => resolve({ ...emptySummary(), source: routing.riskProfile && routing.horizon ? "routed" : "view" }), SUMMARY_TIMEOUT_MS),
      ),
    ])
    return NextResponse.json(
      {
        ...summary,
        requestId,
        request_id: requestId,
        run_id: runId,
        provenance: {
          run_id: runId,
          snapshot_ts: provenance?.snapshot_ts ?? null,
          sources_used: provenance?.sources_used ?? ["market_scores_v1"],
        },
      },
      {
        headers: {
          "x-request-id": requestId,
        },
      },
    )
  } catch (error) {
    console.error("Market score summary error:", { requestId, error })
    return NextResponse.json(
      {
        ...emptySummary(),
        requestId,
        request_id: requestId,
        run_id: runId,
        provenance: {
          run_id: runId,
          snapshot_ts: provenance?.snapshot_ts ?? null,
          sources_used: provenance?.sources_used ?? ["market_scores_v1"],
        },
        warning: "Failed to load market score summary.",
      },
      {
        headers: {
          "x-request-id": requestId,
        },
      },
    )
  }
}
