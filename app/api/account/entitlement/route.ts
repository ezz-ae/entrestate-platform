import { NextResponse } from "next/server"
import { getRequestId } from "@/lib/api-errors"
import { getCurrentEntitlement } from "@/lib/account-entitlement"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const current = await getCurrentEntitlement()

  return NextResponse.json(
    {
      tier: current.tier,
      account_key: current.accountKey,
      source: current.source,
      subscription_id: current.subscriptionId,
      subscription_status: current.status,
      requestId,
    },
    { status: 200 },
  )
}
