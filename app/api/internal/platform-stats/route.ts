import { NextResponse } from "next/server"
import { platformStats } from "@/lib/stats/platformStats"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const stats = await platformStats()
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "no-store",
    },
  })
}
