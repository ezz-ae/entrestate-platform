import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { getEnterpriseConfig, updateEnterpriseBrandConfig } from "@/lib/enterprise-config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)

  try {
    const config = await getEnterpriseConfig()
    return NextResponse.json({
      brand: config.brand,
      updatedAt: config.updatedAt,
      requestId,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to load brand config."), requestId },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  const requestId = getRequestId(request)

  try {
    const payload = (await request.json()) as Parameters<typeof updateEnterpriseBrandConfig>[0]
    const brand = await updateEnterpriseBrandConfig(payload ?? {})
    const config = await getEnterpriseConfig()

    return NextResponse.json({ brand, updatedAt: config.updatedAt, requestId })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid brand config payload.", issues: error.issues, requestId },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to update brand config."), requestId },
      { status: 500 },
    )
  }
}
