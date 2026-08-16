import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)

  try {
    const { id } = await context.params
    const payload = await request.json()

    const upstream = await fetch(new URL("/api/copilot", request.url), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const headers = new Headers(upstream.headers)
    headers.set("x-thread-id", id)
    headers.set("x-request-id", requestId)

    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: getPublicErrorMessage(error, "Failed to post thread message."),
        requestId,
      },
      { status: 500 },
    )
  }
}

