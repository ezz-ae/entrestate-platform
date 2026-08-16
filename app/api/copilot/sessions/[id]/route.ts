import { NextResponse } from "next/server"
import { getRequestId } from "@/lib/api-errors"
import { getSyncedUser } from "@/lib/auth/sync"
import { loadChatSession } from "@/lib/copilot/persistence"

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const requestId = getRequestId(request)
  const user = await getSyncedUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })
  }

  try {
    const { id } = await context.params
    const session = await loadChatSession(id)

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: "Session not found", requestId }, { status: 404 })
    }

    return NextResponse.json(
      {
        session: {
          id: session.id,
          title: session.title,
          updatedAt: session.updatedAt,
          messages: session.messages,
        },
        requestId,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Failed to load chat session:", error)
    return NextResponse.json({ error: "Failed to load chat session", requestId }, { status: 500 })
  }
}
