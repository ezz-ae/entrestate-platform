import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getSessionUser()
    if (!session?.id) {
      return NextResponse.json({ sessions: [] })
    }

    const sessions = await prisma.chatSession.findMany({
      where: { userId: session.id },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
      take: 50,
    })

    return NextResponse.json({ sessions })
  } catch {
    return NextResponse.json({ sessions: [] })
  }
}
