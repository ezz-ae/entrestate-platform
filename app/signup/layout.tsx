import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Sign Up - Entrestate",
  description:
    "Create your Entrestate account and unlock market coverage, scoring, and execution tools for real estate teams.",
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
