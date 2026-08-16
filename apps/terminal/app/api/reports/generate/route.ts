import { NextResponse } from "next/server"
import { z } from "zod"
import { getRequestId } from "@/lib/api-errors"
import { hasTierAccess } from "@/lib/tier-access"
import { getSyncedUser } from "@/lib/auth/sync"
import { prisma } from "@/lib/prisma"
import {
  DEFAULT_COMPREHENSIVE_PROFILE,
  getComprehensiveProfileFromSignals,
} from "@/lib/profile/comprehensive"
import type { ComprehensiveProfileReportAudience } from "@/lib/profile/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  title: z.string().trim().min(1).max(180),
  content: z.unknown(),
  clientName: z.string().trim().min(1).max(120).optional(),
  templateId: z.string().trim().min(1).optional(),
  audience: z.enum(["client", "social", "investor", "executive"]).optional(),
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  if (!await hasTierAccess(request, "team")) {
    return NextResponse.json({ error: "Team tier required", requestId }, { status: 403 })
  }

  const user = await getSyncedUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid report payload", requestId }, { status: 400 })
  }

  let comprehensiveProfile = DEFAULT_COMPREHENSIVE_PROFILE

  if (user?.id) {
    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { inferredSignals: true },
    })
    comprehensiveProfile = getComprehensiveProfileFromSignals(profile?.inferredSignals)
  }

  const selectedTemplate = parsed.data.templateId
    ? comprehensiveProfile.reportTemplates.find((template) => template.id === parsed.data.templateId)
    : null

  const reportAudience: ComprehensiveProfileReportAudience =
    parsed.data.audience ?? selectedTemplate?.audience ?? "client"

  const enabledExports = Object.entries(comprehensiveProfile.outputs)
    .filter(([, enabled]) => enabled)
    .map(([format]) => format)

  const reportTitle =
    selectedTemplate && parsed.data.clientName
      ? `${selectedTemplate.name} · ${parsed.data.clientName}`
      : parsed.data.title

  const reportPayload = {
    content: parsed.data.content,
    profile: {
      audience: reportAudience,
      clientName: parsed.data.clientName ?? null,
      branding: comprehensiveProfile.branding,
      templateId: selectedTemplate?.id ?? null,
      templateName: selectedTemplate?.name ?? null,
      templateOutline: selectedTemplate?.outline ?? null,
      enabledExports,
    },
  }

  const report = await prisma.assistantReport.create({
    data: {
      userId: user.id,
      teamId: user.profile?.teamId ?? null,
      title: reportTitle,
      payload: reportPayload,
    },
    select: {
      id: true,
      publicId: true,
      createdAt: true,
      title: true,
      payload: true,
    },
  })

  return NextResponse.json({ report, enabledExports, requestId })
}
