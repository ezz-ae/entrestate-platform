import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Workspace - Entrestate",
  description:
    "Your analysis workspace for market study, comparisons, dashboards, and data science briefs.",
}

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  return children
}
