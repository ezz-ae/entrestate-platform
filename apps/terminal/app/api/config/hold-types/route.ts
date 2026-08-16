import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { getEnterpriseConfig, updateEnterpriseHoldTypesConfig } from "@/lib/enterprise-config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)

  try {
    const config = await getEnterpriseConfig()
    return NextResponse.json({
      holdTypes: config.holdTypes,
      updatedAt: config.updatedAt,
      requestId,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to load hold type config."), requestId },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  const requestId = getRequestId(request)

  try {
    const payload = (await request.json()) as Parameters<typeof updateEnterpriseHoldTypesConfig>[0]
    const holdTypes = await updateEnterpriseHoldTypesConfig(payload ?? {})
    const config = await getEnterpriseConfig()

    return NextResponse.json({ holdTypes, updatedAt: config.updatedAt, requestId })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid hold type payload.", issues: error.issues, requestId },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to update hold type config."), requestId },
      { status: 500 },
    )
  }
}
