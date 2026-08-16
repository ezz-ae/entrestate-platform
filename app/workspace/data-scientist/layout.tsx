import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Market Intelligence Desk - Entrestate",
  description:
    "Activate the Entrestate Intelligence Engine, explore market signals, save snapshots, and build reusable briefs.",
}

export default function DataScientistLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
