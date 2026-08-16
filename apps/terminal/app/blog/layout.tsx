import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog - Entrestate",
  description:
    "Strategy notes, operational physics, and market intelligence from the Entrestate OS team.",
  openGraph: {
    title: "Blog - Entrestate",
    description: "Strategy notes, operational physics, and market intelligence from the Entrestate OS team.",
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
