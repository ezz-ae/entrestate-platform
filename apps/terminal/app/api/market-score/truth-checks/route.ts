import { NextResponse } from "next/server"
import { buildTruthChecks } from "@/lib/market-score/service"
import type { TruthChecks } from "@/lib/market-score/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const TRUTH_CHECKS_TIMEOUT_MS = 2500

function emptyTruthChecks(): TruthChecks {
  return {
    conservativeReady: [],
    balancedShort: [],
    horizonViolations: 0,
    speculativeLeak: 0,
  }
}

export async function GET() {
  try {
    const truthChecks = await Promise.race([
      buildTruthChecks(),
      new Promise<TruthChecks>((resolve) => setTimeout(() => resolve(emptyTruthChecks()), TRUTH_CHECKS_TIMEOUT_MS)),
    ])
    return NextResponse.json(truthChecks)
  } catch (error) {
    console.error("Market score truth checks error:", error)
    return NextResponse.json({ ...emptyTruthChecks(), warning: "Failed to load truth checks." })
  }
}
