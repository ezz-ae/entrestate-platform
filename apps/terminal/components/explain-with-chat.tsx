"use client"

import { MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCopilot } from "@/components/copilot-provider"
import { Button } from "@/components/ui/button"

type ExplainWithChatProps = {
  prompt: string
  label?: string
  className?: string
  context?: { city?: string; area?: string }
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "default"
}

export function ExplainWithChat({
  prompt,
  label = "Explain in chat",
  className,
  context,
  variant = "outline",
  size = "sm",
}: ExplainWithChatProps) {
  const { append, openSidebar } = useCopilot()

  const handleClick = () => {
    openSidebar()
    void append({
      role: "user",
      content: `${prompt} Explain it in clear real estate language.`,
    })
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn("gap-2", className)}
    >
      <MessageCircle className="h-4 w-4" />
      {label}
    </Button>
  )
}
