"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Button } from "@/data-scientist/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/data-scientist/components/ui/card"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  data?: {
    type: "list" | "stats"
    items?: Array<{ label: string; value: string }>
  }
}

const quickPrompts = [
  "Top cities",
  "Top developers",
  "Risk mix",
  "Delivery windows",
  "Pricing bands",
]

interface DashboardChatProps {
  datasetId: string
  variant?: "default" | "embedded"
}

export function DashboardChat({ datasetId, variant = "default" }: DashboardChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content: "Ask about cities, developers, delivery windows, or pricing bands.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading])

  const handleSend = async (message: string) => {
    const trimmed = message.trim()
    if (!trimmed) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/data-scientist/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ datasetId, message: trimmed }),
      })

      if (!response.ok) {
        throw new Error("Failed to fetch response")
      }

      const data = await response.json()
      const reply: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply,
        data: data.data,
      }

      setMessages((prev) => [...prev, reply])
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "I could not fetch an answer right now. Try again in a moment.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const cardClass =
    variant === "embedded"
      ? "border-transparent bg-transparent shadow-none"
      : "border-border/60 bg-card/60"

  return (
    <Card className={`${cardClass} h-full`}>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Market chat</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 h-[calc(100%-80px)]">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="px-3 py-1 rounded-full text-xs border border-border/60 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {messages.map((message) => (
            <div key={message.id} className={message.role === "user" ? "text-right" : "text-left"}>
              <div
                className={`inline-block rounded-lg px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "bg-foreground text-background"
                    : "bg-muted/50 text-foreground"
                }`}
              >
                {message.content}
              </div>
              {message.data?.items && (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {message.data.items.map((item) => (
                    <div key={`${message.id}-${item.label}`} className="flex items-center justify-between">
                      <span>{item.label}</span>
                      <span className="text-foreground/80">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {isLoading && <div className="text-sm text-muted-foreground">Checking the market...</div>}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault()
            handleSend(input)
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about top cities, risk mix, or pricing bands..."
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/20"
          />
          <Button type="submit" size="sm" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
