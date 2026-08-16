import { NextRequest, NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { buildEmptyCoverageSummary } from "@/lib/data-coverage"
import { buildDataSyncMeta } from "@/lib/data-sync-contract"
import { listSearchIndex } from "@/lib/search-index"
import type { PropertyFilters } from "@/lib/decision-infrastructure"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)
  const params = request.nextUrl.searchParams

  const sortBy = (params.get("sortBy") ?? "god_metric") as "god_metric" | "price" | "yield" | "timing" | "reliability"
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1)
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? "25") || 25))
  const locale = params.get("locale") ?? undefined
  const query = params.get("q") ?? params.get("query") ?? undefined

  const filters: PropertyFilters = {}
  if (params.get("area")) filters.area = params.get("area")!
  if (params.get("developer")) filters.developer = params.get("developer")!
  if (params.get("timing")) filters.timingSignal = params.get("timing") as PropertyFilters["timingSignal"]
  if (params.get("stress")) filters.stressGradeMin = params.get("stress") as PropertyFilters["stressGradeMin"]
  if (params.get("minPrice")) filters.budgetMinAed = Number(params.get("minPrice"))
  if (params.get("maxPrice")) filters.budgetMaxAed = Number(params.get("maxPrice"))
  if (params.get("bedsMin")) filters.bedsMin = Number(params.get("bedsMin"))
  if (params.get("bedsMax")) filters.bedsMax = Number(params.get("bedsMax"))
  if (params.get("goldenVisa") === "true") filters.goldenVisaRequired = true

  try {
    const result = await listSearchIndex({
      query,
      filters,
      sortBy,
      page,
      pageSize,
      locale,
    })

    return NextResponse.json(
      {
        ...result,
        sync: buildDataSyncMeta("search", result.data_as_of),
        requestId,
        request_id: requestId,
      },
      { headers: { "x-request-id": requestId } },
    )
  } catch (error) {
    return NextResponse.json(
      {
        projects: [],
        total: 0,
        page: 1,
        pageSize,
        data_as_of: new Date().toISOString(),
        source_view: "api.search_index",
        coverage: buildEmptyCoverageSummary([
          { key: "developer", label: "Developer" },
          { key: "area", label: "Area" },
          { key: "price", label: "Price" },
          { key: "yield", label: "Yield" },
          { key: "score", label: "Score" },
          { key: "timing", label: "Timing" },
          { key: "stress", label: "Stress" },
          { key: "slug", label: "Slug" },
        ]),
        sync: buildDataSyncMeta("search"),
        error: getPublicErrorMessage(error, "Failed to run search."),
        requestId,
        request_id: requestId,
      },
      { status: 500, headers: { "x-request-id": requestId } },
    )
  }
}
