import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us - Entrestate",
  description:
    "Meet the team behind Entrestate. Learn about our mission to build decision infrastructure for real estate teams.",
  openGraph: {
    title: "About Us - Entrestate",
    description:
      "Meet the team behind Entrestate. Learn about our mission to build decision infrastructure for real estate teams.",
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
