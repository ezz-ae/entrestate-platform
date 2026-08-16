import { NextResponse } from "next/server"
import { z } from "zod"
import { compileTableSpec } from "@/lib/tablespec"
import { createTimeTable } from "@/lib/time-table"
import { generatePdfReport } from "@/lib/artifacts"
import { AccessDeniedError, assertKillSwitch, assertPermission, type GovernanceRole } from "@/lib/governance"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const brandingSchema = z.object({
  primaryColor: z.string().trim().min(1).max(20).optional(),
  logoUrl: z.string().trim().url().optional(),
  badgeText: z.string().trim().min(1).max(40).optional(),
  tier: z.enum(["free", "pro", "enterprise"]).optional(),
})

const requestSchema = z.object({
  limit: z.number().int().min(1).max(100).optional(),
  profile: z
    .object({
      riskProfile: z.string().trim().min(1).max(40).optional(),
      horizon: z.string().trim().min(1).max(40).optional(),
    })
    .optional(),
  branding: brandingSchema.optional(),
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    assertKillSwitch()
    const roleHeader = request.headers.get("x-entrestate-role")
    const role = (roleHeader as GovernanceRole) || "viewer"
    assertPermission(role, "artifact:generate")

    const payload = await request.json()
    const parsed = requestSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId }, { status: 400 })
    }

    const compilation = compileTableSpec({
      goldenPath: "underwrite_development_site",
      profile: parsed.data.profile,
    })

    const table = createTimeTable(compilation.spec)
    const preview = table.preview(parsed.data.limit ?? 20)
    const report = generatePdfReport(compilation.spec, preview.metadata.hash, {
      branding: parsed.data.branding,
      title: "Underwrite Development Site",
    })

    return NextResponse.json({ timeTable: preview, report, requestId })
  } catch (error) {
    if (error instanceof AccessDeniedError) {
      return NextResponse.json({ error: error.message, requestId }, { status: 403 })
    }
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to build underwriting report."), requestId },
      { status: 500 },
    )
  }
}
