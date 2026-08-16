"use client"

import { createContext, useContext, ReactNode, useState, useCallback, useMemo, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import type { UIMessage } from "ai"
import { useLocale } from "next-intl"
import { normalizeLocale } from "@/i18n/locale"

type ChatHelpers = ReturnType<typeof useChat>

type CopilotContextValue = ChatHelpers & {
  isSidebarOpen: boolean
  toggleSidebar: () => void
  openSidebar: () => void
  closeSidebar: () => void
  hydrateSession: (sessionId?: string | null, sessionMessages?: UIMessage[]) => void
}

const CopilotContext = createContext<CopilotContextValue | null>(null)

export function CopilotProvider({
  children,
  initialId,
  initialMessages = [],
}: {
  children: ReactNode
  initialId?: string
  initialMessages?: UIMessage[]
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [activeSessionId, setActiveSessionId] = useState<string | undefined>(initialId)
  const [activeSessionMessages, setActiveSessionMessages] = useState<UIMessage[]>(initialMessages)
  const locale = normalizeLocale(useLocale())

  useEffect(() => {
    setActiveSessionId(initialId)
    setActiveSessionMessages(initialMessages)
  }, [initialId, initialMessages])

  // Memoize transport so it's not recreated on every render.
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/copilot",
        body: activeSessionId != null ? { id: activeSessionId } : {},
        headers: {
          "x-entrestate-locale": locale,
        },
      }),
    [activeSessionId, locale],
  )

  // Only include `id` when it's defined — passing `id: undefined` triggers
  // shouldRecreateChat in @ai-sdk/react on every render, resetting the chat.
  const chatHelpers = useChat({
    ...(activeSessionId != null ? { id: activeSessionId } : {}),
    messages: activeSessionMessages,
    transport,
    onError: (error) => {
      console.error("Copilot error:", error)
    },
  })

  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), [])
  const openSidebar = useCallback(() => setIsSidebarOpen(true), [])
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), [])
  const hydrateSession = useCallback((sessionId?: string | null, sessionMessages: UIMessage[] = []) => {
    setActiveSessionId(sessionId ?? undefined)
    setActiveSessionMessages(sessionMessages)
  }, [])

  return (
    <CopilotContext.Provider
      value={{
        ...chatHelpers,
        isSidebarOpen,
        toggleSidebar,
        openSidebar,
        closeSidebar,
        hydrateSession,
      }}
    >
      {children}
    </CopilotContext.Provider>
  )
}

export function useCopilot() {
  const context = useContext(CopilotContext)
  if (!context) {
    throw new Error("useCopilot must be used within a CopilotProvider")
  }
  return context
}
