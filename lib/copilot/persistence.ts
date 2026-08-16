import "server-only"
import { prisma } from "@/lib/prisma"
import { type UIMessage } from "ai"

let warnedAboutPersistenceSchema = false

function isPersistenceSchemaError(error: unknown) {
  if (!error || typeof error !== "object") return false

  const code = "code" in error && typeof error.code === "string" ? error.code : ""
  if (code === "P2021" || code === "P2022") return true

  const message = "message" in error && typeof error.message === "string" ? error.message : ""
  const normalized = message.toLowerCase()
  return normalized.includes("column `sessionid` does not exist")
    || normalized.includes("table `chat_messages` does not exist")
    || normalized.includes("table `chat_sessions` does not exist")
}

function warnPersistenceSchemaIssue(error: unknown) {
  if (warnedAboutPersistenceSchema) return
  warnedAboutPersistenceSchema = true
  console.warn("Copilot persistence disabled due to missing chat schema in database.", error)
}

/**
 * Loads a chat session and its messages from the database.
 */
export async function loadChatSession(sessionId: string) {
  let session
  try {
    session = await prisma.chatSession.findUnique({
      where: { id: sessionId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    })
  } catch (error) {
    if (isPersistenceSchemaError(error)) {
      warnPersistenceSchemaIssue(error)
      return null
    }
    throw error
  }

  if (!session) return null

  // Convert DB messages to AI SDK UIMessage format using text/tool parts.
  const messages: UIMessage[] = session.messages.map((msg) => {
    const textParts = msg.content
      ? [{ type: "text" as const, text: msg.content }]
      : []
    const toolParts = Array.isArray(msg.toolCalls)
      ? JSON.parse(JSON.stringify(msg.toolCalls))
      : []

    return {
      id: msg.id,
      role: msg.role as UIMessage["role"],
      parts: [...textParts, ...toolParts],
    }
  })

  return { ...session, messages }
}

/**
 * Saves a new message to an existing chat session or creates a new session.
 */
export async function saveChatMessage(userId: string, sessionId: string | null, message: { role: string; content: string; toolCalls?: any }) {
  try {
    let targetSessionId = sessionId

    if (!targetSessionId) {
      const session = await prisma.chatSession.create({
        data: {
          userId,
          title: message.content.slice(0, 50) + "..."
        }
      })
      targetSessionId = session.id
    }

    return await prisma.chatMessage.create({
      data: {
        sessionId: targetSessionId,
        role: message.role,
        content: message.content,
        toolCalls: message.toolCalls ? JSON.parse(JSON.stringify(message.toolCalls)) : undefined
      }
    })
  } catch (error) {
    if (isPersistenceSchemaError(error)) {
      warnPersistenceSchemaIssue(error)
      return null
    }
    throw error
  }
}

/**
 * Lists all chat sessions for a specific user.
 */
export async function listUserChatSessions(userId: string) {
  try {
    return await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        updatedAt: true
      }
    })
  } catch (error) {
    if (isPersistenceSchemaError(error)) {
      warnPersistenceSchemaIssue(error)
      return []
    }
    throw error
  }
}
