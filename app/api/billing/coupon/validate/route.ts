import { NextResponse } from "next/server"
import { z } from "zod"
import { getRequestId, getPublicErrorMessage } from "@/lib/api-errors"
import { getSessionUser } from "@/lib/auth"
import { validateCoupon } from "@/lib/billing-entitlements"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const schema = z.object({
  code: z.string().trim().min(1),
})

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request.", requestId }, { status: 400 })
    }

    const sessionUser = await getSessionUser()
    const accountKey = sessionUser?.id ?? "anonymous"

    const result = await validateCoupon(parsed.data.code, accountKey)

    if (!result.valid) {
      return NextResponse.json({ valid: false, reason: result.reason, requestId }, { status: 200 })
    }

    return NextResponse.json({
      valid: true,
      code: result.coupon.code,
      discount_pct: result.coupon.discount_pct,
      applies_to: result.coupon.applies_to,
      requestId,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to validate coupon."), requestId },
      { status: 500 },
    )
  }
}
