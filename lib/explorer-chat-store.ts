"use client"

import { useSyncExternalStore } from "react"

function resolveChatLocaleHeader(): "en" | "ar" {
  if (typeof document === "undefined") return "en"
  const lang = document.documentElement.lang
  if (!lang) return "en"
  return lang.startsWith("ar") ? "ar" : "en"
}

export type ExplorerMessageRole = "user" | "assistant" | "system"

export interface ExplorerDataCard {
  type: "stat" | "area" | "project"
  title: string
  value: string
  subtitle?: string
  trend?: "up" | "down" | "flat"
  trendValue?: string
}

export interface ExplorerDldNotification {
  headline: string
  subline: string
  amount: number
  badge: string | null
  reg_type: string
  prop_type: string
  is_notable: boolean
}

export interface ExplorerChatMessage {
  id: string
  role: ExplorerMessageRole
  content: string
  timestamp: string
  suggestions?: string[]
  dataCards?: ExplorerDataCard[]
  notifications?: ExplorerDldNotification[]
}

export interface ExplorerChatState {
  messages: ExplorerChatMessage[]
  isOpen: boolean
  isMinimized: boolean
  isTyping: boolean
}

const STORAGE_KEY = "entrestate.explorer-chat.v1"

let state: ExplorerChatState = {
  messages: [],
  isOpen: false,
  isMinimized: false,
  isTyping: false,
}

let hydrated = false
const listeners = new Set<() => void>()

const notify = () => {
  listeners.forEach((listener) => listener())
}

const persist = () => {
  if (typeof window === "undefined") return
  const payload = {
    messages: state.messages,
    isOpen: state.isOpen,
    isMinimized: state.isMinimized,
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

const hydrate = () => {
  if (hydrated || typeof window === "undefined") return
  hydrated = true
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw) as Partial<ExplorerChatState>
    if (Array.isArray(parsed.messages)) {
      state = {
        messages: parsed.messages as ExplorerChatMessage[],
        isOpen: Boolean(parsed.isOpen),
        isMinimized: Boolean(parsed.isMinimized),
        isTyping: false,
      }
    }
  } catch {
    // ignore storage errors
  }
}

const getSnapshot = () => {
  hydrate()
  return state
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const setState = (partial: Partial<ExplorerChatState>) => {
  state = { ...state, ...partial }
  persist()
  notify()
}

export const setExplorerChatState = (partial: Partial<ExplorerChatState>) => {
  setState(partial)
}

export const setExplorerChatMessages = (
  updater: ExplorerChatMessage[] | ((messages: ExplorerChatMessage[]) => ExplorerChatMessage[]),
) => {
  const nextMessages = typeof updater === "function" ? updater(state.messages) : updater
  setState({ messages: nextMessages })
}

export const useExplorerChatStore = () => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  return {
    ...snapshot,
    setExplorerChatState,
    setExplorerChatMessages,
  }
}

async function fetchChatResponse(
  query: string,
  context?: { city?: string; area?: string },
): Promise<{
  content: string
  dataCards?: ExplorerDataCard[]
  notifications?: ExplorerDldNotification[]
  suggestions?: string[]
}> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-entrestate-locale": resolveChatLocaleHeader(),
    },
    body: JSON.stringify({ message: query, context }),
  })

  if (!res.ok) {
    let errorMessage = "Chat request failed"
    try {
      const payload = (await res.json()) as { error?: string }
      if (typeof payload.error === "string" && payload.error.trim().length > 0) {
        errorMessage = payload.error
      }
    } catch {
      // ignore parse errors
    }

    const error = new Error(errorMessage) as Error & { status?: number }
    error.status = res.status
    throw error
  }

  return res.json()
}

export async function sendExplorerChatMessage(options: {
  query: string
  quickSuggestions: string[]
  context?: { city?: string; area?: string }
}) {
  const trimmed = options.query.trim()
  if (!trimmed) return

  const userMessage: ExplorerChatMessage = {
    id: `user-${Date.now()}`,
    role: "user",
    content: trimmed,
    timestamp: new Date().toISOString(),
  }

  setExplorerChatMessages((prev) => [...prev, userMessage])
  setExplorerChatState({ isOpen: true, isMinimized: false, isTyping: true })

  try {
    const response = await fetchChatResponse(trimmed, options.context)
    const assistantMessage: ExplorerChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: response.content,
      timestamp: new Date().toISOString(),
      dataCards: response.dataCards,
      notifications: response.notifications,
      suggestions: response.suggestions ?? options.quickSuggestions.slice(0, 3),
    }
    setExplorerChatMessages((prev) => [...prev, assistantMessage])
  } catch (error) {
    const status = (error as Error & { status?: number }).status
    const isLimitError = status === 429
    const assistantMessage: ExplorerChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: isLimitError
        ? "Free usage is cooling down. Try again shortly, or upgrade for uninterrupted access: /pricing"
        : "I could not process this request right now. Please try again.",
      timestamp: new Date().toISOString(),
      suggestions: options.quickSuggestions.slice(0, 3),
    }
    setExplorerChatMessages((prev) => [...prev, assistantMessage])
  } finally {
    setExplorerChatState({ isTyping: false })
  }
}
