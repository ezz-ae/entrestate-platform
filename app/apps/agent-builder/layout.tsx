import type React from "react"
import "./builder.css"

export default function AgentBuilderLayout({
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
