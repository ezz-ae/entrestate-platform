import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Market Coverage - Entrestate",
  description:
    "See live market coverage across cities, areas, and project inventory.",
  openGraph: {
    title: "Market Coverage - Entrestate",
    description: "See live market coverage across cities, areas, and project inventory.",
  },
}

export default function ModelsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
