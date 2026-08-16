import { getRequestId } from "@/lib/api-errors"
import { hasTierAccess } from "@/lib/tier-access"
import { getSyncedUser } from "@/lib/auth/sync"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)
  const url = new URL(request.url)
  const requestedFormat = url.searchParams.get("format") ?? "pdf"
  const user = await getSyncedUser()

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized", requestId }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  if (!await hasTierAccess(request, "team")) {
    return new Response(JSON.stringify({ error: "Team tier required", requestId }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { id } = await context.params
  const teamId = user.profile?.teamId
  const report = await prisma.assistantReport.findFirst({
    where: teamId
      ? {
          id,
          OR: [{ userId: user.id }, { teamId }],
        }
      : {
          id,
          userId: user.id,
        },
    select: {
      id: true,
      title: true,
      createdAt: true,
      payload: true,
    },
  })

  if (!report) {
    return new Response(JSON.stringify({ error: "Report not found", requestId }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    })
  }

  const reportPayload =
    report.payload && typeof report.payload === "object"
      ? (report.payload as Record<string, unknown>)
      : null

  const profilePayload =
    reportPayload?.profile && typeof reportPayload.profile === "object"
      ? (reportPayload.profile as Record<string, unknown>)
      : null

  const enabledExports = Array.isArray(profilePayload?.enabledExports)
    ? profilePayload.enabledExports.filter((item): item is string => typeof item === "string")
    : ["pdf", "json", "brandedFiles"]

  if (
    (requestedFormat === "json" && !enabledExports.includes("json")) ||
    (requestedFormat === "pdf" && !enabledExports.includes("pdf")) ||
    (requestedFormat === "branded" && !enabledExports.includes("brandedFiles"))
  ) {
    return new Response(JSON.stringify({ error: "Export format not enabled for this profile", requestId }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    })
  }

  const content = `Entrestate Report\n\nTitle: ${report.title}\nGenerated: ${report.createdAt.toISOString()}\n\n${JSON.stringify(report.payload, null, 2)}`

  if (requestedFormat === "json") {
    return new Response(JSON.stringify(report.payload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${report.id}.json"`,
        "x-request-id": requestId,
      },
    })
  }

  const fileName = requestedFormat === "branded" ? `${report.id}-branded.pdf` : `${report.id}.pdf`

  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "x-request-id": requestId,
    },
  })
}
