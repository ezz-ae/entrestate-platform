import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us - Entrestate",
  description:
    "Get in touch with our team. Schedule a walkthrough, discuss enterprise coverage, or plan your market data stack.",
  openGraph: {
    title: "Contact Us - Entrestate",
    description: "Get in touch with our team. Schedule a walkthrough or discuss enterprise coverage.",
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
