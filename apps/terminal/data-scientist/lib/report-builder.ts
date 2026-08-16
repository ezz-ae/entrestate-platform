import type { DashboardSummary } from "./dashboard-summary"
import type { NotebookEntry } from "./notebook"

type ReportOptions = {
  title: string
  summary?: DashboardSummary | null
  entries: NotebookEntry[]
}

export function buildReportDraft({ title, summary, entries }: ReportOptions): string {
  const lines: string[] = []
  const now = new Date()

  lines.push(title || "Market Brief")
  lines.push(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`)

  if (summary) {
    lines.push("")
    lines.push("Coverage")
    lines.push(`- Projects tracked: ${summary.rowCount.toLocaleString()}`)
    lines.push(`- Cities: ${summary.uniqueCities.toLocaleString()}`)
    lines.push(`- Areas: ${summary.uniqueAreas.toLocaleString()}`)
    lines.push(`- Developers: ${summary.uniqueDevelopers.toLocaleString()}`)
  }

  if (entries.length > 0) {
    lines.push("")
    lines.push("Saved Snapshots")
    entries.forEach((entry, index) => {
      lines.push("")
      lines.push(`${index + 1}. ${entry.title}`)
      lines.push(`   Summary: ${entry.summary}`)
      if (entry.highlights.length > 0) {
        lines.push("   Highlights:")
        entry.highlights.slice(0, 4).forEach((item) => {
          lines.push(`   - ${item}`)
        })
      }
    })
  } else {
    lines.push("")
    lines.push("Saved Snapshots")
    lines.push("- No snapshots saved yet. Save a view to start a brief.")
  }

  lines.push("")
  lines.push("Next Actions")
  lines.push("- Review the strongest areas by yield and liquidity.")
  lines.push("- Compare delivery timing with pricing bands.")
  lines.push("- Save two more snapshots to strengthen the brief.")

  return lines.join("\n")
}
