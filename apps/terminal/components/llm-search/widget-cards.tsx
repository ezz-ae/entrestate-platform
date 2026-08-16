"use client"

const reportCards = [
  {
    title: "Market Overview Report",
    description: "Metro-wide performance snapshot for decision makers.",
    format: "PDF",
    updated: "Updated today",
    includes: ["Rent & vacancy trends", "Absorption and pricing", "Top submarkets"],
  },
  {
    title: "Comparable Sales Report",
    description: "Recent transactions with pricing and cap details.",
    format: "XLSX",
    updated: "Updated 2 hours ago",
    includes: ["Sale price per SF", "Cap rates and buyers", "Adjustment notes"],
  },
  {
    title: "Development Pipeline Report",
    description: "Supply risk and construction activity by submarket.",
    format: "PDF",
    updated: "Updated yesterday",
    includes: ["Permits and deliveries", "Under construction volume", "Supply risk signals"],
  },
]

export function LlmWidgetCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {reportCards.map((card) => (
        <div key={card.title} className="rounded-3xl border border-border/50 bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 text-left">
              <h3 className="text-base font-semibold text-foreground">{card.title}</h3>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </div>
            <span className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
              {card.format}
            </span>
          </div>
          <div className="mt-4 text-left text-[11px] uppercase tracking-wide text-muted-foreground">Includes</div>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {card.includes.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <span>{card.updated}</span>
            <button
              type="button"
              className="rounded-full bg-primary px-3 py-1 text-[11px] font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              Download {card.format}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
