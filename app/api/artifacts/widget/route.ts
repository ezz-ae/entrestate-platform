import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getRequestId } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

const widgetRequestSchema = z.object({
  timetableId: z.string().cuid(),
  title: z.string().optional(),
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const payload = await request.json()
    const parsed = widgetRequestSchema.safeParse(payload)
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

    // Create a DecisionObject to track this widget
    // @ts-ignore
    const decisionObject = await prisma.decisionObject.create({
      data: {
        timetableId: timetable.id,
        type: "widget",
        status: "active",
        evidence: timetable.tablespec as any, // snapshot
      },
    })

    const embedToken = `pub_${Math.random().toString(36).substring(7)}`
    const embedCode = `<iframe src="https://entrestate.com/embed/${decisionObject.id}?token=${embedToken}" width="100%" height="400" frameborder="0"></iframe>`

    return NextResponse.json({ 
      widgetId: decisionObject.id,
      embedCode, 
      requestId 
    })
  } catch (error) {
    console.error("Error creating widget:", error)
    return NextResponse.json(
      { error: "Failed to create widget.", requestId },
      { status: 500 },
    )
  }
}
