import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestId } from "@/lib/api-errors"

export const dynamic = "force-dynamic"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const requestId = getRequestId(request)
  const { id } = params

  try {
    const timetable = await prisma.timeTable.findUnique({
      where: { id },
    })

    if (!timetable) {
      return NextResponse.json({ error: "TimeTable not found.", requestId }, { status: 404 })
    }

    // In a real implementation, this might trigger a background job to re-materialize
    // or update a cache. For now, we just update the timestamp.
    const updated = await prisma.timeTable.update({
      where: { id },
      data: {
        lastRefreshAt: new Date(),
      },
    })

    return NextResponse.json({ ...updated, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to refresh TimeTable.", requestId },
      { status: 500 },
    )
  }
}
