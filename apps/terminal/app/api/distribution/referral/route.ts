import { NextResponse } from "next/server"
import { z } from "zod"
import { recordReferralSignup } from "@/lib/distribution"
import { assertKillSwitch } from "@/lib/governance"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const requestSchema = z.object({
  email: z.string().trim().email(),
  referralCode: z.string().trim().max(80).optional(),
  source: z.string().trim().max(120).optional(),
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    assertKillSwitch()
    const payload = await request.json()
    const parsed = requestSchema.safeParse(payload)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload.", requestId }, { status: 400 })
    }

    const record = recordReferralSignup(parsed.data)
    return NextResponse.json({ referral: record, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to record referral."), requestId },
      { status: 500 },
    )
  }
}
