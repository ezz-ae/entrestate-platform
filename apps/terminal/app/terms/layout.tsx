import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service - Entrestate",
  description: "Entrestate Terms of Service. Read our terms and conditions for using the platform.",
}

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
