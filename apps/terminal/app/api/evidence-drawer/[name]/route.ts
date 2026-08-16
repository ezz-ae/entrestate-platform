import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { Prisma, dbQuery } from "@/lib/db"
import { getDetailTableSql } from "@/lib/inventory-table"
import { hasTierAccess } from "@/lib/tier-access"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const DETAIL_TABLE_SQL = getDetailTableSql()

export async function GET(request: Request, context: { params: Promise<{ name: string }> }) {
  const requestId = getRequestId(request)

  if (!await hasTierAccess(request, "pro")) {
    return NextResponse.json({ error: "Pro tier required", requestId }, { status: 403 })
  }

  try {
    const { name } = await context.params
    const projectName = decodeURIComponent(name)

    const rows = await dbQuery(Prisma.sql`
      SELECT
        name,
        evidence_sources,
        evidence_exclusions,
        evidence_assumptions,
        l1_confidence,
        l1_source_coverage,
        engine_god_metric
      FROM ${DETAIL_TABLE_SQL}
      WHERE LOWER(name) = LOWER(${projectName})
      LIMIT 1
    `)

    return NextResponse.json(
      {
        data_as_of: new Date().toISOString(),
        rows,
        requestId,
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to load evidence drawer."), requestId },
      { status: 500 },
    )
  }
}
