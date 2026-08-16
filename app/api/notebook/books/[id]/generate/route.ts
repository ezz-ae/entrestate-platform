import { NextResponse } from "next/server"
import { z } from "zod"
import { getRequestId, getPublicErrorMessage } from "@/lib/api-errors"
import { requireSessionUserId } from "@/lib/auth/server"
import { getBook } from "@/lib/notebook/queries"
import { generateBookPages } from "@/lib/notebook/generator"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const generateSchema = z.object({
  pages: z
    .array(z.enum(["overview", "transactions", "comparison", "opportunity", "risk", "memo"]))
    .min(1)
    .optional(),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)
  try {
    const { id } = await params
    const ownerId = await requireSessionUserId()
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })
    }

    const book = await getBook(id, ownerId)
    if (!book) {
      return NextResponse.json({ error: "Notebook not found.", requestId }, { status: 404 })
    }

    const body = await request.json().catch(() => ({}))
    const parsed = generateSchema.safeParse(body)
    const pagesToGenerate = parsed.success && parsed.data.pages ? parsed.data.pages : undefined

    const pages = await generateBookPages(book, pagesToGenerate)

    return NextResponse.json({ pages, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to generate notebook pages."), requestId },
      { status: 500 },
    )
  }
}
