import { NextResponse } from "next/server"
import { getPublicErrorMessage, getRequestId } from "@/lib/api-errors"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type IntentConfig = {
  id: string
  keywords: string[]
  buttons: string[]
}

const INTENTS: IntentConfig[] = [
  {
    id: "request_hold",
    keywords: ["hold", "reserve", "lock"],
    buttons: ["Request hold", "Join queue"],
  },
  {
    id: "schedule_viewing",
    keywords: ["view", "tour", "visit", "schedule"],
    buttons: ["Book viewing", "Request availability"],
  },
  {
    id: "price_check",
    keywords: ["price", "cost", "budget", "aed"],
    buttons: ["Show pricing", "Compare comps"],
  },
  {
    id: "negotiation",
    keywords: ["discount", "negotiate", "offer"],
    buttons: ["Open negotiation", "Request counter"],
  },
]

export async function POST(request: Request) {
  const requestId = getRequestId(request)
  const startedAt = Date.now()
  try {
    const body = await request.json().catch(() => ({}))
    const message = typeof body?.message === "string" ? body.message.trim() : ""
    if (!message) {
      return NextResponse.json({ error: "Missing message", requestId }, { status: 400 })
    }

    const normalized = message.toLowerCase()
    let bestIntent: IntentConfig | null = null
    let bestScore = 0

    for (const intent of INTENTS) {
      const score = intent.keywords.reduce((total, keyword) => total + (normalized.includes(keyword) ? 1 : 0), 0)
      if (score > bestScore) {
        bestScore = score
        bestIntent = intent
      }
    }

    const selected = bestIntent ?? INTENTS[0]
    const confidence = bestScore > 0 ? Math.min(0.9, 0.5 + bestScore * 0.15) : 0.45

    return NextResponse.json({
      requestId,
      intent: selected.id,
      confidence,
      buttons: selected.buttons,
      duration_ms: Date.now() - startedAt,
    })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Classification failed."), requestId },
      { status: 500 },
    )
  }
}
