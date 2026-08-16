import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getSessionUser()
    if (!session?.id) {
      return NextResponse.json({ artifacts: [] })
    }

    const artifacts = await prisma.decisionObject.findMany({
      where: { ownerId: session.id },
      orderBy: { createdAt: "desc" },
      include: { timetable: { select: { title: true } } },
      take: 50,
    })

    return NextResponse.json({ artifacts })
  } catch {
    return NextResponse.json({ artifacts: [] })
  }
}
