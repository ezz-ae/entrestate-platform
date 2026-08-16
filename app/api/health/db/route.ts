import "server-only"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const QUERY_TIMEOUT_MS = parseInt(process.env.DB_HEALTHCHECK_TIMEOUT_MS ?? "8000", 10)

export async function GET() {
  const startedAt = Date.now()

  try {
    await withTimeout(prisma.$queryRawUnsafe("SELECT 1"), QUERY_TIMEOUT_MS, "health_check")
    return NextResponse.json({
      ok: true,
      latency_ms: Date.now() - startedAt,
    })
  } catch (error) {
    console.error("DB health check failed:", error)
    return NextResponse.json(
      {
        ok: false,
        error: "db_unreachable",
      },
      { status: 503 },
    )
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms (${label})`)), ms)
  })

  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    clearTimeout(timeoutId!)
  }
}
