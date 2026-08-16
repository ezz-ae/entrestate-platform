import { NextResponse } from "next/server"
import { z } from "zod"
import { getRequestId, getPublicErrorMessage } from "@/lib/api-errors"
import { requireSessionUserId } from "@/lib/auth/server"
import { generateBookPages } from "@/lib/notebook/generator"
import { getBook, type BookPageType } from "@/lib/notebook/queries"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const outputSchema = z.object({
  outputType: z.string().trim().min(1).max(100),
})

const OUTPUT_PAGE_MAP: Record<string, BookPageType[]> = {
  "investor-memo": ["memo"],
  "area-brief": ["overview"],
  "risk-report": ["risk"],
  "price-reality": ["overview"],
  "developer-dd": ["memo"],
  "market-pulse": ["transactions"],
  comparison: ["comparison"],
  "client-decision": ["overview"],
  "full-study": ["overview", "risk", "transactions", "comparison", "opportunity", "memo"],
  "opportunity-brief": ["opportunity"],
  "audio-overview": ["overview"],
  "slide-deck": ["overview"],
  "mind-map": ["comparison"],
  infographic: ["overview"],
  "data-table": ["transactions"],
  flashcards: ["overview"],
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)

  try {
    const { id } = await params
    const ownerId = await requireSessionUserId()
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })
    }
    const body = await request.json().catch(() => ({}))
    const parsed = outputSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request.", requestId }, { status: 400 })
    }

    const book = await getBook(id, ownerId)
    if (!book) {
      return NextResponse.json({ error: "Notebook not found.", requestId }, { status: 404 })
    }

    const pageTypes = OUTPUT_PAGE_MAP[parsed.data.outputType] ?? ["overview"]
    const pages = await generateBookPages(book, pageTypes)

    return NextResponse.json({ pages, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to generate notebook output."), requestId },
      { status: 500 },
    )
  }
}
