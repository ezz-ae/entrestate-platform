import { NextResponse } from "next/server"
import { z } from "zod"
import { generateText } from "ai"
import { getRequestId, getPublicErrorMessage } from "@/lib/api-errors"
import { requireSessionUserId } from "@/lib/auth/server"
import { resolveCopilotModel } from "@/lib/ai-provider"
import { getBook } from "@/lib/notebook/queries"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

const chatSchema = z.object({
  message: z.string().trim().min(1).max(2000),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)

  try {
    const { id } = await params
    const ownerId = await requireSessionUserId()
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })
    }
    const body = await request.json().catch(() => ({}))
    const parsed = chatSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request.", requestId }, { status: 400 })
    }

    const book = await getBook(id, ownerId)
    if (!book) {
      return NextResponse.json({ error: "Notebook not found.", requestId }, { status: 404 })
    }

    const model = resolveCopilotModel()
    const pageContext = book.pages
      .slice(0, 6)
      .map((page) => `# ${page.title}\n${page.rawText ?? JSON.stringify(page.content ?? {})}`)
      .join("\n\n")

    if (!model) {
      const fallback = book.pages.length > 0
        ? `Book ready. Available pages: ${book.pages.map((page) => page.title).join(", ")}.`
        : "No generated pages yet. Generate an output first to unlock notebook guidance."
      return NextResponse.json({ reply: fallback, requestId })
    }

    const { text } = await generateText({
      model,
      prompt: `
You are the Entrestate notebook copilot.
Answer the user using only the notebook context below.
Keep the answer direct, short, and operational.

BOOK
Title: ${book.title}
Subject: ${book.subject}
Type: ${book.type}

PAGES
${pageContext || "No pages generated yet."}

USER QUESTION
${parsed.data.message}
      `,
      maxOutputTokens: 700,
    })

    return NextResponse.json({ reply: text, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to answer notebook chat."), requestId },
      { status: 500 },
    )
  }
}
