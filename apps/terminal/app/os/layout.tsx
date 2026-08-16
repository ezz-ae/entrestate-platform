import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Decision OS - Entrestate",
  description:
    "Decision OS preview: compile TableSpecs, inspect Time Tables, and generate evidence-backed notes.",
}

export default function DecisionOSLayout({ children }: { children: React.ReactNode }) {
  return children
}
