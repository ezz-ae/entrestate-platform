import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSyncedUser } from "@/lib/auth/sync"
import { getRequestId } from "@/lib/api-errors"
import { listUserChatSessions } from "@/lib/copilot/persistence"

export async function GET(request: Request) {
  const requestId = getRequestId(request)
  const user = await getSyncedUser()
  if (!user) return NextResponse.json({ error: "Unauthorized", requestId }, { status: 401 })

  try {
    const sessions = await listUserChatSessions(user.id)
    return NextResponse.json({ sessions, requestId })
  } catch (error) {
    console.error("Failed to list chat sessions:", error)
    return NextResponse.json({ error: "Failed to list chat sessions", requestId }, { status: 500 })
  }
}
