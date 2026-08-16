import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getSessionUser()
    if (!session?.id) {
      return NextResponse.json({ tables: [] })
    }

    const tables = await prisma.timeTable.findMany({
      where: { ownerId: session.id },
      orderBy: { updatedAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ tables })
  } catch {
    return NextResponse.json({ tables: [] })
  }
}
