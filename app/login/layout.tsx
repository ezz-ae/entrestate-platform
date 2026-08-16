import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Login - Entrestate",
  description: "Sign in to your Entrestate account to access the workspace, market tools, and saved briefings.",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
