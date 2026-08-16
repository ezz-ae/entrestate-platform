import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { tableSpecSchema } from "@/lib/tablespec/schema"
import { calculateTableHash } from "@/lib/timetable/model"
import { getRequestId } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

const createTableRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  ownerId: z.string().cuid(),
  spec: tableSpecSchema,
  visibility: z.enum(["private", "team", "public"]).optional().default("private"),
  refreshPolicy: z.enum(["manual", "daily", "realtime"]).optional().default("manual"),
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const payload = await request.json()
    const parsed = createTableRequestSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId }, { status: 400 })
    }

    const hash = calculateTableHash(parsed.data.spec as any)

    const timetable = await prisma.timeTable.create({
      data: {
        title: parsed.data.title,
        ownerId: parsed.data.ownerId,
        tablespec: parsed.data.spec as any,
        hash,
        visibility: parsed.data.visibility as any,
        refreshPolicy: parsed.data.refreshPolicy as any,
      },
    })

    return NextResponse.json({ ...timetable, requestId }, { status: 201 })
  } catch (error) {
    console.error("Error creating TimeTable:", error)
    return NextResponse.json(
      { error: "Failed to create TimeTable.", requestId },
      { status: 500 },
    )
  }
}
