import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getSessionUser()
    if (!session?.id) {
      return NextResponse.json({ reports: [] })
    }

    const reports = await prisma.assistantReport.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    })

    return NextResponse.json({ reports })
  } catch {
    return NextResponse.json({ reports: [] })
  }
}
