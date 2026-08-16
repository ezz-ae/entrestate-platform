import { NextResponse } from "next/server"
import { z } from "zod"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { executeDealScreener } from "@/lib/copilot/executor"
import { hasTierAccess } from "@/lib/tier-access"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const flatInputSchema = z.object({
  area: z.string().trim().min(1).optional(),
  budget_max: z.number().positive().optional(),
  budget_max_aed: z.number().positive().optional(),
  beds: z.number().int().min(0).optional(),
  beds_min: z.number().int().min(0).optional(),
  beds_max: z.number().int().min(0).optional(),
  handover_months: z.number().int().min(0).optional(),
  golden_visa: z.boolean().optional(),
  golden_visa_required: z.boolean().optional(),
  timing_label: z.enum(["STRONG_BUY", "BUY", "HOLD", "WAIT", "AVOID"]).optional(),
  stress_grade_min: z.enum(["A", "B", "C", "D", "E"]).optional(),
  sort_by: z
    .enum(["investor_score_v1", "price_from_aed", "rental_yield", "developer_reliability_score"])
    .default("investor_score_v1"),
  limit: z.number().int().min(1).max(50).default(10),
})

const nestedInputSchema = z.object({
  filters: flatInputSchema.partial().optional(),
  sort_by: z
    .enum(["investor_score_v1", "price_from_aed", "rental_yield", "developer_reliability_score"])
    .default("investor_score_v1"),
  limit: z.number().int().min(1).max(50).default(10),
})

function normalizeInput(payload: unknown) {
  const nested = nestedInputSchema.safeParse(payload)
  if (nested.success) {
    const filters = nested.data.filters ?? {}
    return {
      filters: {
        area: filters.area,
        budget_max_aed: filters.budget_max_aed ?? filters.budget_max,
        beds_min: filters.beds_min ?? filters.beds,
        beds_max: filters.beds_max ?? filters.beds,
        golden_visa_required: filters.golden_visa_required ?? filters.golden_visa,
        timing_label: filters.timing_label,
        stress_grade_min: filters.stress_grade_min,
      },
      sort_by: nested.data.sort_by,
      limit: nested.data.limit,
    }
  }

  const flat = flatInputSchema.safeParse(payload)
  if (!flat.success) return null

  return {
    filters: {
      area: flat.data.area,
      budget_max_aed: flat.data.budget_max_aed ?? flat.data.budget_max,
      beds_min: flat.data.beds_min ?? flat.data.beds,
      beds_max: flat.data.beds_max ?? flat.data.beds,
      golden_visa_required: flat.data.golden_visa_required ?? flat.data.golden_visa,
      timing_label: flat.data.timing_label,
      stress_grade_min: flat.data.stress_grade_min,
    },
    sort_by: flat.data.sort_by,
    limit: flat.data.limit,
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)

  if (!await hasTierAccess(request, "pro")) {
    return NextResponse.json({ error: "Pro tier required", requestId }, { status: 403 })
  }

  try {
    const body = await request.json()
    const normalized = normalizeInput(body)

    if (!normalized) {
      return NextResponse.json({ error: "Invalid request payload", requestId }, { status: 400 })
    }

    const data = await executeDealScreener(normalized)

    return NextResponse.json(
      {
        ...data,
        accepted_filters: {
          ...normalized.filters,
          handover_months: (body as { handover_months?: number })?.handover_months ?? null,
        },
        requestId,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to screen deals."), requestId },
      { status: 500 },
    )
  }
}
