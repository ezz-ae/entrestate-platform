import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getRequestId } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

const artifactRequestSchema = z.object({
  timetableId: z.string().cuid(),
  format: z.enum(["pdf", "pptx"]),
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const payload = await request.json()
    const parsed = artifactRequestSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId }, { status: 400 })
    }

    // @ts-ignore
    const timetable = await prisma.timeTable.findUnique({
      where: { id: parsed.data.timetableId },
    })

    if (!timetable) {
      return NextResponse.json({ error: "TimeTable not found.", requestId }, { status: 404 })
    }

    // Stub for actual PDF/PPTX generation logic
    const artifactUrl = `https://storage.entrestate.com/artifacts/${timetable.id}.${parsed.data.format}`
    
    // Create a DecisionObject to track this artifact
    // @ts-ignore
    const decisionObject = await prisma.decisionObject.create({
      data: {
        timetableId: timetable.id,
        type: parsed.data.format === "pdf" ? "report" : "presentation",
        status: "completed",
        artifactUrls: { [parsed.data.format]: artifactUrl },
        evidence: timetable.tablespec as any, // snapshot
      },
    })

    return NextResponse.json({ 
      id: decisionObject.id,
      url: artifactUrl, 
      requestId 
    })
  } catch (error) {
    console.error(`Error generating ${request.url.split('/').pop()} artifact:`, error)
    return NextResponse.json(
      { error: "Failed to generate artifact.", requestId },
      { status: 500 },
    )
  }
}
