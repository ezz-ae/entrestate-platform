import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const body = await request.text()
    if (body) {
      console.warn("CSP report received", body)
    }
  } catch (error) {
    console.warn("Failed to parse CSP report", error)
  }

  return new NextResponse(null, { status: 204 })
}
