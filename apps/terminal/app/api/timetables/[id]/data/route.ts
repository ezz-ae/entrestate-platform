import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getRequestId } from "@/lib/api-errors"
import { materializeTable } from "@/lib/timetable/materialize"
import { TableSpec } from "@/lib/tablespec/schema"

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

    const rows = await materializeTable(timetable.tablespec as unknown as TableSpec)

    return NextResponse.json({
      timetableId: id,
      rows,
      count: rows.length,
      requestId
    })
  } catch (error) {
    console.error("Error materializing table data:", error)
    return NextResponse.json(
      { error: "Failed to fetch table data.", requestId },
      { status: 500 },
    )
  }
}
