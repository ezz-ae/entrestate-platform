import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Style Guide - Entrestate",
  description:
    "Design system documentation for the Entrestate template. Explore colors, typography, components, and patterns.",
}

export default function StyleGuideLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
