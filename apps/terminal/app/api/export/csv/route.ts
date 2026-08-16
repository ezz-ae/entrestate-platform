import { hasTierAccess } from "@/lib/tier-access"
import { getRequestId } from "@/lib/api-errors"
import { listProperties } from "@/lib/decision-infrastructure"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function asCsvValue(value: unknown): string {
  if (value === null || value === undefined) return ""
  const raw = String(value)
  if (raw.includes(",") || raw.includes("\n") || raw.includes('"')) {
    return `"${raw.replace(/"/g, '""')}"`
  }
  return raw
}

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  if (!await hasTierAccess(request, "team")) {
    return new Response(JSON.stringify({ error: "Team tier required", requestId }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  const result = await listProperties({ page: 1, pageSize: 500 })

  const headers = ["name", "area", "developer", "price_from_aed", "rental_yield", "stress_grade_v1", "timing_label", "investor_score_v1", "price_confidence"]
  const lines = [headers.join(",")]

  for (const project of result.projects) {
    lines.push(
      [
        project.name,
        project.final_area ?? project.area,
        project.developer,
        project.price_from_aed ?? project.l1_canonical_price,
        project.rental_yield ?? project.l1_canonical_yield,
        project.stress_grade_v1 ?? project.l2_stress_test_grade,
        project.timing_label ?? project.l3_timing_signal,
        project.investor_score_v1 ?? project.engine_god_metric,
        project.price_confidence ?? project.l1_confidence,
      ]
        .map(asCsvValue)
        .join(","),
    )
  }

  return new Response(lines.join("\n"), {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": "attachment; filename=deal-screen.csv",
      "x-request-id": requestId,
    },
  })
}
