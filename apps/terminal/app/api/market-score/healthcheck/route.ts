import { NextResponse } from "next/server"
import { getLatestHealthcheck } from "@/lib/market-score/service"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const row = await getLatestHealthcheck()
    return NextResponse.json({ healthcheck: row })
  } catch (error) {
    console.error("Market score healthcheck error:", error)
    return NextResponse.json({ error: "Failed to load system healthcheck." }, { status: 500 })
  }
}
