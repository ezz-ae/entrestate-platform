import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getRequestId } from "@/lib/api-errors"
import { getSyncedUser } from "@/lib/auth/sync"

export const dynamic = "force-dynamic"

const profileUpsertSchema = z.object({
  riskBias: z.number().min(0).max(1).optional(),
  horizon: z.string().optional(),
  yieldVsSafety: z.number().min(0).max(1).optional(),
  preferredMarkets: z.array(z.string()).optional(),
})

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const user = await getSyncedUser()
  const userId = user?.id

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized.", requestId }, { status: 401 })
  }

  try {
    // @ts-ignore
    const profile = await prisma.userProfile.findUnique({
      where: { userId },
    })

    if (!profile) {
      return NextResponse.json({ error: "Profile not found.", requestId }, { status: 404 })
    }

    return NextResponse.json({ ...profile, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch profile.", requestId },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const payload = await request.json()
    const parsed = profileUpsertSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId }, { status: 400 })
    }

    const resolvedUserId = (await getSyncedUser())?.id
    if (!resolvedUserId) {
      return NextResponse.json({ error: "Unauthorized.", requestId }, { status: 401 })
    }

    // @ts-ignore
    const profile = await prisma.userProfile.upsert({
      where: { userId: resolvedUserId },
      update: {
        riskBias: parsed.data.riskBias,
        horizon: parsed.data.horizon,
        yieldVsSafety: parsed.data.yieldVsSafety,
        preferredMarkets: parsed.data.preferredMarkets,
      },
      create: {
        userId: resolvedUserId,
        riskBias: parsed.data.riskBias ?? 0.65,
        horizon: parsed.data.horizon,
        yieldVsSafety: parsed.data.yieldVsSafety ?? 0.5,
        preferredMarkets: parsed.data.preferredMarkets ?? [],
      },
    })

    return NextResponse.json({ ...profile, requestId })
  } catch (error) {
    console.error("Error upserting profile:", error)
    return NextResponse.json(
      { error: "Failed to save profile.", requestId },
      { status: 500 },
    )
  }
}
