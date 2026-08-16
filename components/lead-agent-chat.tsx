"use client"

import { useEffect, useState } from "react"
import { Send } from "lucide-react"

type Message = {
  id: string
  role: "assistant" | "user"
  content: string
}

type FlowStep = {
  id: string
  question: string
  suggestions?: string[]
  placeholder?: string
}

const flow: FlowStep[] = [
  {
    id: "intent",
    question: "Are you buying, investing, or both?",
    suggestions: ["Buying", "Investing", "Both"],
  },
  {
    id: "location",
    question: "Which city or area are you interested in?",
    suggestions: ["Dubai", "Abu Dhabi", "Sharjah", "Other"],
    placeholder: "Type a city or area",
  },
  {
    id: "budget",
    question: "What is your budget range (AED)?",
    suggestions: ["< 1M", "1M - 2M", "2M - 5M", "5M+"],
  },
  {
    id: "timeline",
    question: "When do you want to move or invest?",
    suggestions: ["Now", "3-6 months", "6-12 months", "12+ months"],
  },
  {
    id: "contact",
    question: "How should we contact you?",
    suggestions: ["WhatsApp", "Phone", "Email"],
    placeholder: "Enter your contact detail",
  },
]

export function LeadAgentChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [input, setInput] = useState("")

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "Hi, I can help you find the right property. Let me ask a few quick questions.",
        },
        {
          id: flow[0].id,
          role: "assistant",
          content: flow[0].question,
        },
      ])
    }
  }, [messages])

  const currentStep = flow[stepIndex]

  const advance = (value: string) => {
    const trimmed = value.trim()
    if (!trimmed || !currentStep) return

    setAnswers((prev) => ({ ...prev, [currentStep.id]: trimmed }))
    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: "user", content: trimmed },
    ])
    setInput("")

    const nextIndex = stepIndex + 1
    if (nextIndex < flow.length) {
      const nextStep = flow[nextIndex]
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: nextStep.id, role: "assistant", content: nextStep.question },
        ])
      }, 400)
      setStepIndex(nextIndex)
      return
    }

    setStepIndex(flow.length)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: "complete",
          role: "assistant",
          content: "Thanks. You are qualified. A specialist will follow up shortly.",
        },
      ])
    }, 400)
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    advance(input)
  }

  return (
    <div className="rounded-2xl border border-border bg-card/70 p-6 shadow-lg">
      <div className="space-y-4 min-h-[320px]">
        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block rounded-lg px-3 py-2 text-sm ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-foreground"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {currentStep && (
        <div className="mt-6 space-y-4">
          {currentStep.suggestions && (
            <div className="flex flex-wrap gap-2">
              {currentStep.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => advance(suggestion)}
                  className="px-3 py-1 text-xs rounded-full border border-border/70 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={currentStep.placeholder || "Type your answer"}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-primary text-primary-foreground"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {stepIndex >= flow.length && (
        <div className="mt-6 rounded-lg border border-border bg-secondary/40 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Lead summary</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {Object.entries(answers).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="capitalize">{key}</span>
                <span className="text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
