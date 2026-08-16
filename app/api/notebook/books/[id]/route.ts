import { NextResponse } from "next/server"
import { getRequestId, getPublicErrorMessage } from "@/lib/api-errors"
import { requireSessionUserId } from "@/lib/auth/server"
import { getBook, deleteBook } from "@/lib/notebook/queries"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
    return NextResponse.json({ book, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to fetch notebook."), requestId },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = getRequestId(request)
  try {
    const { id } = await params
    const ownerId = await requireSessionUserId()
    if (!ownerId) {
      return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })
    }
    const deleted = await deleteBook(id, ownerId)
    if (!deleted) {
      return NextResponse.json({ error: "Notebook not found.", requestId }, { status: 404 })
    }
    return NextResponse.json({ success: true, requestId })
  } catch (error) {
    return NextResponse.json(
      { error: getPublicErrorMessage(error, "Failed to delete notebook."), requestId },
      { status: 500 },
    )
  }
}
