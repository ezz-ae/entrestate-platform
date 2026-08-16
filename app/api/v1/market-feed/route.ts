import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestId } from "@/lib/api-errors"
import { Prisma, dbQuery } from "@/lib/db"
import { listAreas, getMarketPulse } from "@/lib/decision-infrastructure"
import { hashApiKey } from "@/lib/api-keys"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Public read API.
 *
 * Product rule:
 *   - Entrestate market data is open to read.
 *   - Paid plans start when customers connect their own platform, inventory,
 *     or write flows into Entrestate.
 *
 * So this route works anonymously. When an API key is present we still validate
 * it and update last-used telemetry, but a key is not required for the public
 * market feed.
 */
export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const apiKey = request.headers.get("x-api-key")
  if (apiKey) {
    const hashedKey = hashApiKey(apiKey)
    const keyRecord = await prisma.apiKey.findFirst({
      where: {
        OR: [{ key: hashedKey }, { key: apiKey }],
      },
    })

    if (!keyRecord) {
      return NextResponse.json({ error: "Invalid API key", requestId }, { status: 403 })
    }

    await prisma.apiKey.update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    })
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "dashboard"

    if (type === "dashboard") {
      const pulse = await getMarketPulse()
      const areas = await listAreas()
      
      return NextResponse.json({
        data_as_of: pulse.data_as_of,
        summary: pulse.summary,
        timing_signals: pulse.timing_signals,
        top_areas: areas.areas.slice(0, 10).map(a => ({
          name: a.area,
          projects: a.projects,
          avg_price: a.avg_price,
          avg_yield: a.avg_yield,
          slug: a.slug
        })),
        requestId,
      })
    }

    if (type === "listings") {
      const rows = await dbQuery(Prisma.sql`
        SELECT
          id,
          name,
          area,
          developer,
          price_from_aed,
          rental_yield,
          timing_label,
          stress_grade_v1,
          investor_score_v1,
          decision_label_v1,
          evidence_label_v1,
          hero_image,
          golden_visa,
          price_confidence,
          price_source
        FROM inventory_clean
        WHERE price_confidence = 'HIGH'
        ORDER BY investor_score_v1 DESC
        LIMIT 50
      `)

      return NextResponse.json({
        data_as_of: new Date().toISOString(),
        listings: rows,
        requestId,
      })
    }

    return NextResponse.json({ error: "Invalid feed type. Use 'dashboard' or 'listings'.", requestId }, { status: 400 })
  } catch (error) {
    console.error("External data API error:", error)
    return NextResponse.json({ error: "Internal market feed error", requestId }, { status: 500 })
  }
}
