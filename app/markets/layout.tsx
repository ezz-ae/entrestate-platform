import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Explorer - Entrestate",
  description:
    "Explore market signals, price tiers, and decision-ready views for real estate.",
}

export default function MarketsLayout({ children }: { children: React.ReactNode }) {
  return children
}
