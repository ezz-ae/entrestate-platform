import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Response Lab - Entrestate",
  description:
    "Compare response engines live. No access key required. Review tone, structure, and depth across engines.",
  openGraph: {
    title: "Response Lab - Entrestate",
    description: "Compare response engines live. No access key required.",
  },
}

export default function PlaygroundLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
