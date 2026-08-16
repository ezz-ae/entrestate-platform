import type React from "react"
import "../../apps/agent-builder/builder.css"

export default function AgentCreatorLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="agent-builder-scope font-sans antialiased">
      {children}
    </div>
  )
}
