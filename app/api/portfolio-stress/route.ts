import { NextResponse } from "next/server"
import { z } from "zod"
import { getRequestId } from "@/lib/api-errors"
import { getStressTestByProjectName } from "@/lib/decision-infrastructure"
import { hasTierAccess } from "@/lib/tier-access"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  projects: z.array(z.string().trim().min(1)).min(1).max(30),
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  if (!await hasTierAccess(request, "institutional")) {
    return NextResponse.json({ error: "Institutional tier required", requestId }, { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid portfolio payload", requestId }, { status: 400 })
  }

  const rows = (
    await Promise.all(parsed.data.projects.map((name) => getStressTestByProjectName(name).then((result) => result.rows[0] ?? null)))
  ).filter(Boolean)

  const validRows = rows.filter((row): row is Record<string, unknown> => Boolean(row))
  const avgStressScore =
    validRows
      .map((row) => row.engine_stress_test)
      .filter((value): value is number => typeof value === "number" && Number.isFinite(value))
      .reduce((sum, value, _, list) => (list.length > 0 ? sum + value / list.length : 0), 0)

  return NextResponse.json(
    {
      data_as_of: new Date().toISOString(),
      requested: parsed.data.projects,
      projects_evaluated: validRows.length,
      avg_stress_score: Number.isFinite(avgStressScore) ? Number(avgStressScore.toFixed(2)) : null,
      rows: validRows,
      requestId,
    },
    { status: 200 },
  )
}

