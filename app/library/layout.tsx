import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Library - Entrestate",
  description:
    "Reports, contracts, and real estate decision notes curated for market operators.",
}

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children
}
