import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestId } from "@/lib/api-errors"
import { getEvidenceForSpec } from "@/lib/timetable/evidence"

export const dynamic = "force-dynamic"

export async function GET(
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

    const evidence = getEvidenceForSpec(timetable.tablespec)

    return NextResponse.json({ ...timetable, evidence, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch TimeTable.", requestId },
      { status: 500 },
    )
  }
}
