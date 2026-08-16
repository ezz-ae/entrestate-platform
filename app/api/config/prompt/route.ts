import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"
import { getEnterpriseConfig, updateEnterprisePromptConfig } from "@/lib/enterprise-config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const requestId = getRequestId(request)

  try {
    const config = await getEnterpriseConfig()
    return NextResponse.json({
      prompt: config.prompt,
      updatedAt: config.updatedAt,
      requestId,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to load prompt config."), requestId },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  const requestId = getRequestId(request)

  try {
    const payload = (await request.json()) as Parameters<typeof updateEnterprisePromptConfig>[0]
    const prompt = await updateEnterprisePromptConfig(payload ?? {})
    const config = await getEnterpriseConfig()

    return NextResponse.json({ prompt, updatedAt: config.updatedAt, requestId })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid prompt config payload.", issues: error.issues, requestId },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to update prompt config."), requestId },
      { status: 500 },
    )
  }
}
