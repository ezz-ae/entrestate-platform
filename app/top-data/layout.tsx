import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Top Data - Entrestate",
  description:
    "Curated market intelligence and focused requests for real estate decision makers.",
}

export default function TopDataLayout({ children }: { children: React.ReactNode }) {
  return children
}
